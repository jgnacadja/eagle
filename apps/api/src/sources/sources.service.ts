import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CacheService, type CacheScopeProvider } from '../common/cache/cache.service'
import { DirectusItemsClient } from '../directus/directus.items.client'
import {
  LEAD_FORM_NAMES,
  SourceSecrets,
  mapForms,
  type LeadFormName,
  type SourceConfig,
  type SourceStatus,
  type UnreadableSource
} from './source.types'
import { decryptSecret, isEncrypted, parseEncryptionKey } from './sources.crypto'

const CACHE_TTL_MS = 60_000
const ENV_SOURCE_ID = 'env'
const HQ_CODE = 'hq'

const ROW_FIELDS = [
  'id',
  'code',
  'name',
  'is_hq',
  'status',
  'digiforma_api_url',
  'digiforma_api_key',
  'hubspot_portal_id',
  'hubspot_token',
  ...LEAD_FORM_NAMES.map((form) => `hubspot_form_${form}`)
]

type SourceRow = {
  id: string
  code: string
  name: string
  is_hq: boolean | null
  status: string | null
  digiforma_api_url: string | null
  digiforma_api_key: string | null
  hubspot_portal_id: string | null
  hubspot_token: string | null
} & Partial<Record<`hubspot_form_${LeadFormName}`, string | null>>

interface Snapshot {
  at: number
  sources: SourceConfig[]
  unreadable: UnreadableSource[]
}

interface DecryptedSecrets {
  digiformaApiKey: string | null
  hubspotToken: string | null
}

const blank = (value: string | null | undefined): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : null

const statusOf = (row: SourceRow): SourceStatus =>
  row.status === 'inactive' ? 'inactive' : 'active'

/**
 * Point d'accès unique aux sources Digiforma / HubSpot : lit la collection
 * Directus `sources`, déchiffre les secrets (AES-256-GCM, clé
 * `SOURCES_ENC_KEY`) et replie sur les variables d'env tant qu'aucune source
 * n'est active — la config mono-source actuelle continue de fonctionner.
 * Lecture mise en cache 60 s ; `invalidate()` après une modification admin.
 * Aucun secret n'est loggé : seuls les codes de source apparaissent.
 *
 * Le repli env ne vaut que pour une lecture **réussie** sans source active.
 * Une lecture en échec sans copie en cache, ou des sources actives écartées
 * faute de secret lisible, ne sont pas « aucune source » : la config
 * (`listActive`, `listAll`, `getByCode`) lève alors un 503 — synchroniser le
 * compte de l'env sans filtre de source pourrait écraser les formations d'une
 * franchise. Le routage des leads (`getHq`, `getById`) reste tolérant : un
 * lead n'est jamais perdu faute de config, il part sur la HQ de l'env.
 *
 * Fournit aussi la portée des clés du cache (`CacheScopeProvider`) : c'est
 * le cache qui ignore les sources, et non l'inverse.
 */
@Injectable()
export class SourcesService implements CacheScopeProvider, OnModuleInit {
  private readonly logger = new Logger(SourcesService.name)
  private snapshot: Snapshot | null = null
  private inflight: Promise<Snapshot> | null = null

  constructor(
    private readonly config: ConfigService,
    private readonly directus: DirectusItemsClient,
    private readonly cache: CacheService
  ) {}

  onModuleInit(): void {
    this.cache.setScopeProvider(this)
  }

  /** Sources actives ; la HQ issue de l'env quand aucune n'est active. */
  async listActive(): Promise<SourceConfig[]> {
    const { sources, unreadable } = await this.read()
    const active = sources.filter((source) => source.status === 'active')
    if (active.length > 0) return active

    const skipped = unreadable.filter((source) => source.status === 'active')
    if (skipped.length > 0) {
      throw new ServiceUnavailableException(
        `No usable source: ${skipped.map((source) => source.code).join(', ')} unreadable.`
      )
    }
    return [this.envHq()]
  }

  async activeCodes(): Promise<string[]> {
    return (await this.listActive()).map((source) => source.code)
  }

  /** Toutes les sources lues en base, actives ou non (hors repli env). */
  async listAll(): Promise<SourceConfig[]> {
    return (await this.read()).sources
  }

  /** Lignes écartées faute de secret lisible, actives ou non. */
  async listUnreadable(): Promise<UnreadableSource[]> {
    return (await this.read()).unreadable
  }

  async getHq(): Promise<SourceConfig> {
    const snapshot = await this.readOrNull()
    return snapshot?.sources.find((source) => source.isHq) ?? this.envHq()
  }

  /** Toute source, active ou non (le routage des leads gère le repli). */
  async getById(id: string): Promise<SourceConfig | null> {
    if (id === ENV_SOURCE_ID) return this.envHq()
    const snapshot = await this.readOrNull()
    return snapshot?.sources.find((source) => source.id === id) ?? null
  }

  async getByCode(code: string): Promise<SourceConfig | null> {
    const { sources, unreadable } = await this.read()
    const found = sources.find((source) => source.code === code)
    if (found) return found
    const empty = sources.length === 0 && unreadable.length === 0
    return code === HQ_CODE && empty ? this.envHq() : null
  }

  invalidate(): void {
    this.snapshot = null
  }

  private async read(): Promise<Snapshot> {
    if (this.snapshot && Date.now() - this.snapshot.at < CACHE_TTL_MS) return this.snapshot
    this.inflight ??= this.load().finally(() => {
      this.inflight = null
    })
    return this.inflight
  }

  // Lecture pour le routage des leads : une config illisible ne bloque pas.
  private async readOrNull(): Promise<Snapshot | null> {
    try {
      return await this.read()
    } catch {
      return null
    }
  }

  private async load(): Promise<Snapshot> {
    let rows: SourceRow[]
    try {
      const { data } = await this.directus.readMany<SourceRow>('sources', {
        fields: ROW_FIELDS,
        limit: -1
      })
      rows = data
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown error'
      if (this.snapshot) {
        // Directus indisponible : on sert la dernière lecture connue.
        this.logger.warn(`Sources unreadable, using stale cache: ${reason}`)
        return this.snapshot
      }
      this.logger.error(`Sources unreadable and no cached copy: ${reason}`)
      throw new ServiceUnavailableException('The sources configuration is unreadable.')
    }

    const sources: SourceConfig[] = []
    const unreadable: UnreadableSource[] = []
    for (const row of rows) {
      let secrets: DecryptedSecrets
      try {
        secrets = this.decryptSecrets(row)
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'secret unreadable'
        this.logger.error(`Source "${row.code}" ignored: ${reason}`)
        unreadable.push({
          id: row.id,
          code: row.code,
          status: statusOf(row),
          fromEnv: false,
          reason
        })
        continue
      }
      sources.push(this.toConfig(row, secrets))
    }

    this.snapshot = { at: Date.now(), sources, unreadable }
    return this.snapshot
  }

  private decryptSecrets(row: SourceRow): DecryptedSecrets {
    return {
      digiformaApiKey: this.decrypt(row.digiforma_api_key),
      hubspotToken: this.decrypt(row.hubspot_token)
    }
  }

  private toConfig(row: SourceRow, secrets: DecryptedSecrets): SourceConfig {
    const isHq = row.is_hq === true
    const env = isHq ? this.envHq() : null

    return {
      id: row.id,
      code: row.code,
      name: row.name,
      isHq,
      status: statusOf(row),
      fromEnv: false,
      digiforma: { apiUrl: blank(row.digiforma_api_url) ?? env?.digiforma.apiUrl ?? null },
      hubspot: {
        portalId: blank(row.hubspot_portal_id) ?? env?.hubspot.portalId ?? null,
        forms: mapForms(
          (form) => blank(row[`hubspot_form_${form}`]) ?? env?.hubspot.forms[form] ?? null
        )
      },
      secrets: new SourceSecrets(
        secrets.digiformaApiKey ?? env?.secrets.digiformaApiKey ?? '',
        secrets.hubspotToken
      )
    }
  }

  private decrypt(value: string | null | undefined): string | null {
    const stored = blank(value)
    if (!stored) return null
    if (!isEncrypted(stored)) throw new Error('secret stored in plaintext (hook bypassed)')
    return decryptSecret(stored, parseEncryptionKey(this.config.get<string>('SOURCES_ENC_KEY')))
  }

  private envHq(): SourceConfig {
    const get = (name: string) => blank(this.config.get<string>(name))
    return {
      id: ENV_SOURCE_ID,
      code: HQ_CODE,
      name: 'HQ (environment)',
      isHq: true,
      status: 'active',
      fromEnv: true,
      digiforma: { apiUrl: get('DIGIFORMA_API_URL') },
      hubspot: {
        portalId: get('HUBSPOT_PORTAL_ID'),
        forms: mapForms((form) => get(`HUBSPOT_FORM_${form.toUpperCase()}`))
      },
      secrets: new SourceSecrets(get('DIGIFORMA_API_KEY') ?? '', null)
    }
  }
}
