import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis, { RedisOptions } from 'ioredis'

// retryStrategy borné : une coupure Redis transitoire (restart container,
// réseau) ne doit pas désactiver le cache jusqu'au prochain restart de
// l'API — sinon les purges webhook (invalidateCatalog) no-op en silence.
// Les commandes échouent toujours vite (pas d'offline queue, pas de retry
// par requête) : la dégradation reste fail-open côté lecture.
const REDIS_OPTIONS: RedisOptions = {
  connectTimeout: 1000,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 0,
  /* v8 ignore next -- callback interne ioredis, exercé uniquement sur Redis réel */
  retryStrategy: (attempt) => Math.min(attempt * 500, 5000)
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
  private readonly client?: Redis
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
    if (this.client?.status === 'ready') {
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
      const value = await this.client.get(await this.versionedKey(key))
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
      await this.client.setex(await this.versionedKey(key), ttlSeconds, serialized)
    } catch (error) {
      this.logger.warn({ error, key }, 'Failed to set cached value')
    }
  }

  async del(pattern: string): Promise<void> {
    if (!this.client || !this.isReady) return

    try {
      await this.deleteByPattern(await this.versionedKey(pattern))
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

  // Purge ciblée : supprime les clés matchant `patterns` dans la version
  // courante, sans bump — les clés non concernées restent valides.
  async invalidatePatterns(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      await this.del(pattern)
    }
  }

  // `key` permet à plusieurs jobs de partager le même mécanisme
  // (`sync:last_run` catalogue, `sync:reviews:last_run` avis Google).
  async setSyncRun(run: SyncRun, key = 'sync:last_run'): Promise<void> {
    if (!this.client || !this.isReady) return

    try {
      await this.client.setex(key, 86_400, JSON.stringify(run))
    } catch (error) {
      this.logger.warn({ error, run }, 'Failed to set sync run status')
    }
  }

  async getSyncRun(key = 'sync:last_run'): Promise<SyncRun | null> {
    if (!this.client || !this.isReady) return null

    try {
      const value = await this.client.get(key)
      if (!value) return null
      return JSON.parse(value) as SyncRun
    } catch (error) {
      this.logger.warn({ error }, 'Failed to get sync run status')
      return null
    }
  }

  // Verrou distribué des jobs de synchro (SET NX PX) : une seule instance
  // exécute le run à la fois, même en multi-instances/serverless.
  // Fail-open quand Redis est absent ou en erreur : les runs sont
  // idempotents, un doublon coûte moins qu'une sync manquée ; le flag
  // `running` du service conserve l'exclusion au sein du process.
  async acquireSyncLock(token: string, ttlMs: number, lockKey = 'sync:lock'): Promise<boolean> {
    if (!this.client || !this.isReady) return true

    try {
      const result = await this.client.set(lockKey, token, 'PX', ttlMs, 'NX')
      return result === 'OK'
    } catch (error) {
      this.logger.warn({ error, lockKey }, 'Failed to acquire sync lock — proceeding without it')
      return true
    }
  }

  // Compare-and-delete : le token évite de libérer le verrou posé par une
  // autre instance si le nôtre a déjà expiré (TTL dépassé pendant le run).
  async releaseSyncLock(token: string, lockKey = 'sync:lock'): Promise<void> {
    if (!this.client || !this.isReady) return

    try {
      await this.client.eval(
        'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end',
        1,
        lockKey,
        token
      )
    } catch (error) {
      this.logger.warn({ error, lockKey }, 'Failed to release sync lock')
    }
  }

  key(path: string): string {
    return `catalog:v${this.currentVersion}:${path}`
  }

  // Version lue dans Redis à chaque opération : une invalidation émise
  // par une autre instance (multi-instances/serverless) est effective
  // immédiatement au lieu d'attendre le TTL. Une écriture concurrente
  // ne peut pas réintroduire du périmé : elle lit d'abord la version
  // courante, donc elle atterrit sous le préfixe frais.
  private async versionedKey(path: string): Promise<string> {
    const raw = await this.client!.get(this.versionKey)
    const version = Number.parseInt(raw ?? '0', 10) || 0
    this.currentVersion = version
    return `catalog:v${version}:${path}`
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
      const version = await this.client!.get(this.versionKey)
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
    // Appelants (del, invalidateCatalog) garantissent client + isReady.
    const stream = this.client!.scanStream({ match: pattern, count: 100 })
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
