import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis, { RedisOptions } from 'ioredis'

const REDIS_OPTIONS: RedisOptions = {
  connectTimeout: 1000,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 0,
  retryStrategy: () => null
}

export interface SyncRun {
  status: 'running' | 'success' | 'failed'
  startedAt: string
  finishedAt: string | null
  inserted: number
  updated: number
  failed: number
  error: string | null
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name)
  private client?: Redis
  private readonly versionKey = 'catalog:version'
  private currentVersion = 0
  private isReady = false
  private initPromise?: Promise<void>
  private connectionErrorLogged = false

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL')
    if (!url) {
      this.logger.warn('REDIS_URL missing: cache disabled')
      return
    }

    this.client = new Redis(url, REDIS_OPTIONS)
    this.client.on('ready', () => this.initializeClient())
    this.client.on('error', (error) => this.onConnectionError(error))
    this.client.on('close', () => {
      this.isReady = false
    })
    this.client.on('end', () => {
      this.isReady = false
    })
  }

  async onModuleInit(): Promise<void> {
    if (this.client && this.client.status === 'ready') {
      await this.initializeClient()
    } else {
      this.currentVersion = 0
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client || !this.isReady) return

    try {
      await this.client.quit()
    } catch {
      this.logger.warn('Redis quit failed during shutdown')
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isReady) return null

    try {
      const value = await this.client.get(this.key(key))
      if (value === null || value === '') {
        return null
      }

      try {
        return JSON.parse(value) as T
      } catch (error) {
        this.logger.warn({ error, key }, 'Failed to parse cached value')
        return null
      }
    } catch (error) {
      this.logger.warn({ error, key }, 'Failed to get cached value')
      return null
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    if (!this.client || !this.isReady) return

    try {
      const serialized = JSON.stringify(value)
      await this.client.setex(this.key(key), ttlSeconds, serialized)
    } catch (error) {
      this.logger.warn({ error, key }, 'Failed to set cached value')
    }
  }

  async del(pattern: string): Promise<void> {
    if (!this.client || !this.isReady) return

    try {
      await this.deleteByPattern(this.key(pattern))
    } catch (error) {
      this.logger.warn({ error, pattern }, 'Failed to delete cached values')
    }
  }

  async invalidateCatalog(): Promise<void> {
    if (!this.client || !this.isReady) return

    try {
      const newVersion = await this.client.incr(this.versionKey)
      const oldVersion = newVersion - 1
      this.currentVersion = newVersion
      await this.deleteByPattern(`catalog:v${oldVersion}:*`)
      this.logger.log(`Catalog cache invalidated, new version v${this.currentVersion}`)
    } catch (error) {
      this.logger.warn({ error }, 'Failed to invalidate catalog cache')
    }
  }

  async setSyncRun(run: SyncRun): Promise<void> {
    if (!this.client || !this.isReady) return

    try {
      await this.client.setex('sync:last_run', 86_400, JSON.stringify(run))
    } catch (error) {
      this.logger.warn({ error, run }, 'Failed to set sync run status')
    }
  }

  async getSyncRun(): Promise<SyncRun | null> {
    if (!this.client || !this.isReady) return null

    try {
      const value = await this.client.get('sync:last_run')
      if (!value) return null
      return JSON.parse(value) as SyncRun
    } catch (error) {
      this.logger.warn({ error }, 'Failed to get sync run status')
      return null
    }
  }

  key(path: string): string {
    return `catalog:v${this.currentVersion}:${path}`
  }

  private async initializeClient(): Promise<void> {
    if (this.initPromise) return this.initPromise
    this.initPromise = this.doInitialize().finally(() => {
      this.initPromise = undefined
    })
    return this.initPromise
  }

  private async doInitialize(): Promise<void> {
    try {
      if (!this.client) return
      const version = await this.client.get(this.versionKey)
      this.currentVersion = version ? Number.parseInt(version, 10) : 0
      this.isReady = true
    } catch (error) {
      this.isReady = false
      this.currentVersion = 0
      if (error instanceof Error) {
        this.logger.warn(`Failed to initialize cache: ${error.message}`)
      }
    }
  }

  private onConnectionError(error: Error): void {
    this.isReady = false
    if (!this.connectionErrorLogged) {
      this.connectionErrorLogged = true
      this.logger.warn(`Redis unavailable — cache disabled (${error.message})`)
    }
  }

  private async deleteByPattern(pattern: string): Promise<void> {
    if (!this.client || !this.isReady) return

    const stream = this.client.scanStream({ match: pattern, count: 100 })
    const pending: Promise<unknown>[] = []

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (batch: string[]) => {
        if (batch.length === 0) return
        const pipeline = this.client!.pipeline()
        for (const key of batch) {
          pipeline.del(key)
        }
        pending.push(pipeline.exec())
      })
      stream.on('end', () => resolve())
      stream.on('error', (error) => reject(error))
    })

    await Promise.all(pending)
  }
}
