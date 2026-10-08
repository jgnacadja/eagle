import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DirectusItemsClient } from '../directus/directus.items.client'
import {
  LEAD_FORM_NAMES,
  SourceSecrets,
  type LeadFormName,
  type SourceConfig,
  type SourceStatus
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

const blank = (value: string | null | undefined): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : null

/**
 * Point d'accès unique aux sources Digiforma / HubSpot : lit la collection
 * Directus `sources`, déchiffre les secrets (AES-256-GCM, clé
 * `SOURCES_ENC_KEY`) et replie sur les variables d'env tant qu'aucune source
 * n'est active — la config mono-source actuelle continue de fonctionner.
 * Lecture mise en cache 60 s ; `invalidate()` après une modification admin.
 * Aucun secret n'est loggé : seuls les codes de source apparaissent.
 */
@Injectable()
export class SourcesService {
  private readonly logger = new Logger(SourcesService.name)
  private cache: { at: number; sources: SourceConfig[] } | null = null
  private inflight: Promise<SourceConfig[]> | null = null

  constructor(
    private readonly config: ConfigService,
    private readonly directus: DirectusItemsClient
  ) {}

  /** Sources actives ; la HQ issue de l'env quand aucune n'est active. */
  async listActive(): Promise<SourceConfig[]> {
    const sources = await this.all()
    const active = sources.filter((source) => source.status === 'active')
    return active.length > 0 ? active : [this.envHq()]
  }

  /** Toutes les sources lues en base, actives ou non (hors repli env). */
  async listAll(): Promise<SourceConfig[]> {
    return this.all()
  }

  async getHq(): Promise<SourceConfig> {
    const sources = await this.all()
    return sources.find((source) => source.isHq) ?? this.envHq()
  }

  /** Toute source, active ou non (le routage des leads gère le repli). */
  async getById(id: string): Promise<SourceConfig | null> {
    if (id === ENV_SOURCE_ID) return this.envHq()
    return (await this.all()).find((source) => source.id === id) ?? null
  }

  async getByCode(code: string): Promise<SourceConfig | null> {
    const sources = await this.all()
    const found = sources.find((source) => source.code === code)
    if (found) return found
    return code === HQ_CODE && sources.length === 0 ? this.envHq() : null
  }

  invalidate(): void {
    this.cache = null
  }

  private async all(): Promise<SourceConfig[]> {
    if (this.cache && Date.now() - this.cache.at < CACHE_TTL_MS) return this.cache.sources
    this.inflight ??= this.load().finally(() => {
      this.inflight = null
    })
    return this.inflight
  }

  private async load(): Promise<SourceConfig[]> {
    try {
      const { data } = await this.directus.readMany<SourceRow>('sources', {
        fields: ROW_FIELDS,
        limit: -1
      })
      const sources = data.flatMap((row) => this.toConfig(row) ?? [])
      this.cache = { at: Date.now(), sources }
      return sources
    } catch (error) {
      // Directus indisponible : on sert la dernière lecture connue, sinon
      // l'env (non mis en cache pour retenter dès la requête suivante).
      this.logger.warn(
        `Sources unreadable, using ${this.cache ? 'stale cache' : 'env fallback'}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`
      )
      return this.cache?.sources ?? []
    }
  }

  private toConfig(row: SourceRow): SourceConfig | null {
    let digiformaApiKey: string | null
    let hubspotToken: string | null
    try {
      digiformaApiKey = this.decrypt(row.digiforma_api_key)
      hubspotToken = this.decrypt(row.hubspot_token)
    } catch (error) {
      this.logger.error(
        `Source "${row.code}" ignored: ${error instanceof Error ? error.message : 'secret unreadable'}`
      )
      return null
    }

    const isHq = row.is_hq === true
    const env = isHq ? this.envHq() : null
    const status: SourceStatus = row.status === 'inactive' ? 'inactive' : 'active'

    const forms = Object.fromEntries(
      LEAD_FORM_NAMES.map((form) => [
        form,
        blank(row[`hubspot_form_${form}`]) ?? env?.hubspot.forms[form] ?? null
      ])
    ) as Record<LeadFormName, string | null>

    return {
      id: row.id,
      code: row.code,
      name: row.name,
      isHq,
      status,
      fromEnv: false,
      digiforma: { apiUrl: blank(row.digiforma_api_url) ?? env?.digiforma.apiUrl ?? null },
      hubspot: {
        portalId: blank(row.hubspot_portal_id) ?? env?.hubspot.portalId ?? null,
        forms
      },
      secrets: new SourceSecrets(
        digiformaApiKey ?? env?.secrets.digiformaApiKey ?? '',
        hubspotToken
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
        forms: Object.fromEntries(
          LEAD_FORM_NAMES.map((form) => [form, get(`HUBSPOT_FORM_${form.toUpperCase()}`)])
        ) as Record<LeadFormName, string | null>
      },
      secrets: new SourceSecrets(get('DIGIFORMA_API_KEY') ?? '', null)
    }
  }
}
