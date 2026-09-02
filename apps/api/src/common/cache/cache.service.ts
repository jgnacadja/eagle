import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name)
  private readonly client: Redis
  private readonly versionKey = 'catalog:version'
  private currentVersion = 0

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('REDIS_URL')
    this.client = new Redis(url, { maxRetriesPerRequest: 3 })
  }

  async onModuleInit(): Promise<void> {
    const version = await this.client.get(this.versionKey)
    this.currentVersion = version ? parseInt(version, 10) : 0
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit()
  }

  async get<T>(key: string): Promise<T | null> {
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
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    const serialized = JSON.stringify(value)
    await this.client.setex(this.key(key), ttlSeconds, serialized)
  }

  async del(pattern: string): Promise<void> {
    await this.deleteByPattern(this.key(pattern))
  }

  async invalidateCatalog(): Promise<void> {
    const oldVersion = this.currentVersion
    await this.deleteByPattern(`catalog:v${oldVersion}:*`)
    this.currentVersion += 1
    await this.client.set(this.versionKey, this.currentVersion.toString())
    this.logger.log(`Cache catalogue invalidé, nouvelle version v${this.currentVersion}`)
  }

  key(path: string): string {
    return `catalog:v${this.currentVersion}:${path}`
  }

  private async deleteByPattern(pattern: string): Promise<void> {
    const keys: string[] = []
    const stream = this.client.scanStream({ match: pattern, count: 100 })

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (batch: string[]) => {
        keys.push(...batch)
      })
      stream.on('end', () => resolve())
      stream.on('error', (error) => reject(error))
    })

    if (keys.length === 0) {
      return
    }

    const pipeline = this.client.pipeline()
    for (const key of keys) {
      pipeline.del(key)
    }
    await pipeline.exec()
  }
}
