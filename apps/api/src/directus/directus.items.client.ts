import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export type DirectusFilter = Record<string, unknown>

export interface DirectusItemsQuery {
  filter?: DirectusFilter
  fields?: string[]
  sort?: string[]
  limit?: number
  page?: number
  /** Métadonnées demandées (ex. `filter_count`). */
  meta?: string
}

export interface DirectusListResult<T> {
  data: T[]
  meta?: { filter_count?: number }
}

interface FetchLikeResponse {
  ok: boolean
  status: number
  json(): Promise<unknown>
  text(): Promise<string>
}

type HttpMethod = 'GET' | 'POST' | 'DELETE'

/**
 * Client REST générique `/items/{collection}` (token statique
 * `DIRECTUS_TOKEN`). Sans token ou URL, le client est désactivé : les
 * lectures renvoient vide et les écritures sont ignorées — l'API doit
 * démarrer sans Directus (dev, environnements sans back-office).
 *
 * Pas de retry : les appelants (journalisation, purge) sont non critiques
 * et une écriture rejouée dupliquerait des lignes.
 */
@Injectable()
export class DirectusItemsClient {
  private readonly logger = new Logger(DirectusItemsClient.name)
  private readonly token: string
  private readonly baseUrl: string
  private readonly timeoutMs = 10_000

  constructor(config: ConfigService) {
    this.token = config.get<string>('DIRECTUS_TOKEN') ?? ''
    this.baseUrl = (config.get<string>('DIRECTUS_INTERNAL_URL') ?? '').replace(/\/+$/, '')
    if (!this.enabled) {
      this.logger.warn('DIRECTUS_TOKEN or DIRECTUS_INTERNAL_URL missing: Directus items disabled')
    }
  }

  get enabled(): boolean {
    return Boolean(this.token && this.baseUrl)
  }

  async createOne<T>(
    collection: string,
    payload: Record<string, unknown>,
    fields: string[] = ['id']
  ): Promise<T | null> {
    if (!this.enabled) return null

    const url = this.itemsUrl(collection)
    for (const field of fields) {
      url.searchParams.append('fields[]', field)
    }
    const response = await this.request<{ data: T }>(url, 'POST', payload)
    return response?.data ?? null
  }

  async readMany<T>(collection: string, query: DirectusItemsQuery): Promise<DirectusListResult<T>> {
    if (!this.enabled) return { data: [] }

    const url = this.itemsUrl(collection)
    if (query.filter) url.searchParams.set('filter', JSON.stringify(query.filter))
    for (const field of query.fields ?? []) {
      url.searchParams.append('fields[]', field)
    }
    if (query.sort?.length) url.searchParams.set('sort', query.sort.join(','))
    if (query.limit !== undefined) url.searchParams.set('limit', String(query.limit))
    if (query.page !== undefined) url.searchParams.set('page', String(query.page))
    if (query.meta) url.searchParams.set('meta', query.meta)

    const response = await this.request<DirectusListResult<T>>(url, 'GET')
    return { data: response?.data ?? [], meta: response?.meta }
  }

  /** Supprime tous les items matchant le filtre (sans limite de nombre). */
  async deleteMany(collection: string, filter: DirectusFilter): Promise<void> {
    if (!this.enabled) return
    await this.request(this.itemsUrl(collection), 'DELETE', { query: { filter, limit: -1 } })
  }

  private itemsUrl(collection: string): URL {
    return new URL(`${this.baseUrl}/items/${collection}`)
  }

  private async request<T>(url: URL, method: HttpMethod, body?: unknown): Promise<T | null> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = (await fetch(url.toString(), {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal
      })) as unknown as FetchLikeResponse

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Directus ${method} ${url.pathname} failed: ${response.status} ${text}`)
      }

      if (response.status === 204) return null
      return (await response.json()) as T
    } finally {
      clearTimeout(timeout)
    }
  }
}
