import { createHash } from 'node:crypto'
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

/**
 * Port par lequel une feature précise au cache la portée de ses clés
 * catalogue. `common/cache` ne connaît aucune feature : c'est la feature qui
 * s'y enregistre au démarrage (`CacheService.setScopeProvider`).
 */
export interface CacheScopeProvider {
  /** Codes des sources actives : leurs versions entrent dans toutes les clés catalogue. */
  activeCodes(): Promise<string[]>
  /** Relâche la copie mémoire du fournisseur (sa config vient de changer en admin). */
  invalidate(): void
}

export interface SyncRun {
  status: 'running' | 'success' | 'failed'
  startedAt: string
  finishedAt: string | null
  inserted: number
  updated: number
  failed: number
  error: string | null
  /** Code de la source synchronisée (absent des runs antérieurs au multi-sources). */
  source?: string
  /** Formations dépubliées par la désactivation d'une source (cycle de vie). */
  archived?: number
  /** Formations republiées à la réactivation d'une source. */
  republished?: number
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name)
  private readonly client?: Redis
  private readonly versionKey = 'catalog:version'
  // Compteur partagé de toutes les invalidations (complètes et ciblées) :
  // permet à chaque instance de savoir qu'une autre a purgé le catalogue.
  private readonly generationKey = 'catalog:generation'
  private currentVersion = 0
  private knownGeneration = 0
  private isReady = false
  private initPromise?: Promise<void>
  private connectionErrorLogged = false
  private readonly catalogListeners = new Set<() => void>()
  private scopeProvider?: CacheScopeProvider

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

  /**
   * Enregistre le fournisseur de portée des clés catalogue (les sources
   * actives). Sans fournisseur, les clés ne portent que la version globale.
   */
  setScopeProvider(provider: CacheScopeProvider): void {
    this.scopeProvider = provider
  }

  /** La config du fournisseur de portée a changé : il doit la relire. */
  invalidateScope(): void {
    this.scopeProvider?.invalidate()
  }

  /**
   * Version propre à une source (`catalog:ver:{code}`) : incrémentée à chaque
   * sync réussi, désactivation et réactivation. Le hash des versions des
   * sources actives entre dans toutes les clés catalogue : activer ou
   * désactiver une source change la portée du cache sur toutes les instances,
   * sans attendre le TTL.
   */
  async bumpSourceVersion(sourceCode: string): Promise<void> {
    if (!this.client || !this.isReady) return
    try {
      await this.client.incr(`catalog:ver:${sourceCode}`)
    } catch (error) {
      this.logger.warn({ error, source: sourceCode }, 'Failed to bump the source cache version')
    }
  }

  /** Version courante des clés catalogue — bump à chaque invalidation complète. */
  get version(): number {
    return this.currentVersion
  }

  /**
   * Abonne un consommateur aux invalidations catalogue (sync Digiforma,
   * purges déclenchées par Directus) — index en mémoire à reconstruire, etc.
   * Retourne la fonction de désabonnement.
   */
  onCatalogInvalidated(listener: () => void): () => void {
    this.catalogListeners.add(listener)
    return () => this.catalogListeners.delete(listener)
  }

  async invalidateCatalog(): Promise<void> {
    if (!this.client || !this.isReady) {
      this.notifyCatalogInvalidated()
      return
    }

    try {
      const newVersion = await this.client.incr(this.versionKey)
      const oldVersion = newVersion - 1
      this.currentVersion = newVersion
      // La génération part dès que la nouvelle version existe : si la purge
      // des anciennes clés échoue ensuite, les autres instances basculent
      // quand même (les clés v{old} orphelines expirent d'elles-mêmes).
      await this.bumpGeneration()
      await this.deleteByPattern(`catalog:v${oldVersion}:*`)
      this.logger.log(`Catalog cache invalidated, new version v${this.currentVersion}`)
    } catch (error) {
      this.logger.warn({ error }, 'Failed to invalidate catalog cache')
    } finally {
      this.notifyCatalogInvalidated()
    }
  }

  // Purge ciblée : supprime les clés matchant `patterns` dans la version
  // courante, sans bump — les clés non concernées restent valides.
  async invalidatePatterns(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      await this.del(pattern)
    }
    await this.bumpGeneration()
    this.notifyCatalogInvalidated()
  }

  /**
   * Rattrape les invalidations faites par d'autres instances (déploiement
   * multi-instances : la sync ou le webhook Directus n'atterrit que sur
   * l'une d'elles) : réaligne la version des clés et prévient les
   * abonnés. Retourne `true` quand une invalidation a été rattrapée.
   */
  async syncInvalidations(): Promise<boolean> {
    if (!this.client || !this.isReady) return false

    try {
      const generation = Number.parseInt((await this.client.get(this.generationKey)) ?? '0', 10)
      if (generation <= this.knownGeneration) return false
      const version = await this.client.get(this.versionKey)
      // La génération n'est consommée qu'une fois les deux lectures réussies :
      // une lecture de version en échec est retentée au passage suivant.
      this.knownGeneration = generation
      this.currentVersion = version ? Number.parseInt(version, 10) : this.currentVersion
    } catch (error) {
      this.logger.warn({ error }, 'Failed to sync catalog invalidations')
      return false
    }

    this.notifyCatalogInvalidated()
    return true
  }

  private async bumpGeneration(): Promise<void> {
    if (!this.client || !this.isReady) return
    try {
      this.knownGeneration = await this.client.incr(this.generationKey)
    } catch (error) {
      this.logger.warn({ error }, 'Failed to bump the catalog invalidation generation')
    }
  }

  private notifyCatalogInvalidated(): void {
    for (const listener of this.catalogListeners) {
      try {
        listener()
      } catch (error) {
        this.logger.warn({ error }, 'Catalog invalidation listener failed')
      }
    }
  }

  // `sync:last_run:{code}` garde le dernier run de chaque source ;
  // `sync:last_run` (sans code) le dernier run global, que l'appelant agrège
  // lui-même : un run de source ne l'écrase pas, sinon l'échec d'une source
  // serait masqué par la réussite de la suivante.
  async setSyncRun(run: SyncRun, sourceCode?: string): Promise<void> {
    if (!this.client || !this.isReady) return

    try {
      const key = sourceCode ? `sync:last_run:${sourceCode}` : 'sync:last_run'
      await this.client.setex(key, 86_400, JSON.stringify(run))
    } catch (error) {
      this.logger.warn({ error, run }, 'Failed to set sync run status')
    }
  }

  async getSyncRun(sourceCode?: string): Promise<SyncRun | null> {
    if (!this.client || !this.isReady) return null

    try {
      const value = await this.client.get(
        sourceCode ? `sync:last_run:${sourceCode}` : 'sync:last_run'
      )
      if (!value) return null
      return JSON.parse(value) as SyncRun
    } catch (error) {
      this.logger.warn({ error }, 'Failed to get sync run status')
      return null
    }
  }

  // Verrou distribué de la sync catalogue (SET NX PX) : une seule instance
  // exécute la sync à la fois, même en multi-instances/serverless.
  // Fail-open quand Redis est absent ou en erreur : le run est idempotent,
  // un doublon coûte moins qu'une sync manquée ; le flag `running` du
  // service conserve l'exclusion au sein du process.
  // Un verrou par source (`sync:lock:{code}`) : deux sources se
  // synchronisent en parallèle sur des instances différentes, jamais deux
  // fois la même.
  async acquireSyncLock(token: string, ttlMs: number, sourceCode = 'default'): Promise<boolean> {
    if (!this.client || !this.isReady) return true

    try {
      const result = await this.client.set(`sync:lock:${sourceCode}`, token, 'PX', ttlMs, 'NX')
      return result === 'OK'
    } catch (error) {
      this.logger.warn({ error }, 'Failed to acquire sync lock — proceeding without it')
      return true
    }
  }

  // Compare-and-delete : le token évite de libérer le verrou posé par une
  // autre instance si le nôtre a déjà expiré (TTL dépassé pendant le run).
  async releaseSyncLock(token: string, sourceCode = 'default'): Promise<void> {
    if (!this.client || !this.isReady) return

    try {
      await this.client.eval(
        'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end',
        1,
        `sync:lock:${sourceCode}`,
        token
      )
    } catch (error) {
      this.logger.warn({ error }, 'Failed to release sync lock')
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
  //
  // Version globale et versions par source partagent un seul MGET.
  private async versionedKey(path: string): Promise<string> {
    const codes = await this.scopeCodes()
    const [rawVersion, ...sourceVersions] = await this.client!.mget([
      this.versionKey,
      ...codes.map((code) => `catalog:ver:${code}`)
    ])
    const version = Number.parseInt(rawVersion ?? '0', 10) || 0
    this.currentVersion = version
    return `catalog:v${version}:${this.scopeOf(codes, sourceVersions)}${path}`
  }

  // Codes de la portée des clés, triés. Vide sans fournisseur ou en cas
  // d'erreur — le cache retombe alors sur la seule version globale (jamais
  // d'échec de lecture pour autant).
  private async scopeCodes(): Promise<string[]> {
    if (!this.scopeProvider) return []
    try {
      return [...(await this.scopeProvider.activeCodes())].sort()
    } catch (error) {
      this.logger.warn({ error }, 'Failed to compute the sources cache scope')
      return []
    }
  }

  // Portée « sources actives » des clés : hash de leurs versions.
  private scopeOf(codes: string[], versions: Array<string | null>): string {
    if (codes.length === 0) return ''
    const digest = createHash('sha1')
      .update(codes.map((code, i) => `${code}=${versions[i] ?? 0}`).join('|'))
      .digest('hex')
      .slice(0, 8)
    return `s${digest}:`
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
      // Génération d'abord, version ensuite : l'invalidateur écrit la version
      // puis la génération. Une invalidation intercalée entre ces deux
      // lectures laisse alors une génération connue en retard, que le
      // prochain `syncInvalidations()` rattrape ; l'ordre inverse la
      // marquerait consommée avec l'ancienne version.
      const generation = await this.client!.get(this.generationKey)
      const version = await this.client!.get(this.versionKey)
      this.currentVersion = version ? Number.parseInt(version, 10) : 0
      this.knownGeneration = generation ? Number.parseInt(generation, 10) : 0
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
