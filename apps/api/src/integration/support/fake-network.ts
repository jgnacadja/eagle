type Row = Record<string, unknown>

export interface RecordedCall {
  url: string
  method: string
  headers: Record<string, string>
  body: unknown
}

export const DIRECTUS_URL = 'https://directus.test'
export const HUBSPOT_FORMS_URL = 'https://hsforms.test'

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })

function matches(row: Row, field: string, op: string, expected: unknown): boolean {
  const actual = row[field]
  if (op === '_eq') return String(actual ?? null) === String(expected)
  if (op === '_in') {
    const wanted = Array.isArray(expected) ? expected.map(String) : String(expected).split(',')
    return wanted.includes(String(actual))
  }
  throw new Error(`Unsupported Directus filter operator ${op}`)
}

// Deux écritures de filtre coexistent dans l'API : `filter[champ][_op]=valeur`
// (DirectusCatalogService) et `filter={"champ":{"_op":valeur}}` (DirectusItemsClient).
function filtersOf(url: URL): Array<[string, string, unknown]> {
  const filters: Array<[string, string, unknown]> = []
  for (const [key, value] of url.searchParams) {
    const bracket = /^filter\[(\w+)\]\[(_\w+)\]$/.exec(key)
    if (bracket) filters.push([bracket[1], bracket[2], value])
  }
  const json = url.searchParams.get('filter')
  if (json) {
    for (const [field, condition] of Object.entries(JSON.parse(json) as Record<string, Row>)) {
      for (const [op, value] of Object.entries(condition)) filters.push([field, op, value])
    }
  }
  return filters
}

/**
 * Directus en mémoire, branché sur `fetch` : les vrais `DirectusItemsClient` et
 * `DirectusCatalogService` l'interrogent comme le back-office. Les formations
 * reçoivent les valeurs par défaut de la base (`source` = HQ, `status`,
 * `archived_by_source`) pour que les filtres de cycle de vie se comportent
 * comme en production.
 */
export class FakeDirectus {
  readonly tables: Record<string, Row[]> = { sources: [], formations: [], centres: [] }
  readonly calls: RecordedCall[] = []
  private nextId = 1
  private nextFileId = 1

  constructor(private readonly defaultSourceId: string | null) {}

  rows(collection: string): Row[] {
    return this.tables[collection]
  }

  formation(sourceId: string | null, digiformaId: string): Row | undefined {
    return this.tables.formations.find(
      (row) => row.source === sourceId && row.digiforma_id === digiformaId
    )
  }

  handle(url: URL, method: string, body: unknown): Response | null {
    const items = /^\/items\/(\w+)(?:\/([\w-]+))?$/.exec(url.pathname)
    if (url.pathname === '/files/import') {
      return jsonResponse(200, { data: { id: `file-${this.nextFileId++}` } })
    }
    if (!items) return null

    const [, collection, id] = items
    const table = this.tables[collection]
    if (!table) return jsonResponse(404, { errors: [{ message: `Unknown ${collection}` }] })

    if (method === 'GET') {
      const filters = filtersOf(url)
      const data = table.filter((row) => filters.every(([f, op, v]) => matches(row, f, op, v)))
      return jsonResponse(200, { data, meta: { filter_count: data.length } })
    }
    if (method === 'POST') return this.create(collection, body)
    if (method === 'PATCH') return this.patch(table, id, body)
    return jsonResponse(405, {})
  }

  private create(collection: string, body: unknown): Response {
    const payloads = Array.isArray(body) ? (body as Row[]) : [body as Row]
    const created = payloads.map((payload) => {
      const row: Row = { id: this.nextId++, ...payload }
      if (collection === 'formations') {
        row.source ??= this.defaultSourceId
        row.status ??= 'draft'
        row.archived_by_source ??= false
      }
      this.tables[collection].push(row)
      return row
    })
    return jsonResponse(200, { data: Array.isArray(body) ? created : created[0] })
  }

  private patch(table: Row[], id: string | undefined, body: unknown): Response {
    if (id) {
      const row = table.find((candidate) => String(candidate.id) === id)
      if (!row) return jsonResponse(404, { errors: [{ message: 'Not found' }] })
      Object.assign(row, body)
      return jsonResponse(200, { data: row })
    }
    const { keys, data } = body as { keys: Array<string | number>; data: Row }
    const wanted = new Set(keys.map(String))
    for (const row of table) if (wanted.has(String(row.id))) Object.assign(row, data)
    return jsonResponse(200, { data: [] })
  }
}

export interface DigiformaAccount {
  /** Programmes renvoyés ; un nombre = statut HTTP d'erreur à renvoyer. */
  response: unknown[] | number
}

/**
 * Remplace `fetch` pour les trois services externes : Directus, Digiforma
 * (un compte par URL, clé Bearer vérifiée) et la Forms API HubSpot.
 */
export class FakeNetwork {
  readonly digiformaCalls: RecordedCall[] = []
  readonly hubspotCalls: RecordedCall[] = []
  private readonly accounts = new Map<string, { token: string; account: DigiformaAccount }>()

  constructor(private readonly directus: FakeDirectus) {}

  addDigiforma(url: string, token: string, account: DigiformaAccount): void {
    this.accounts.set(url, { token, account })
  }

  setDigiforma(url: string, response: DigiformaAccount['response']): void {
    const entry = this.accounts.get(url)
    if (!entry) throw new Error(`Unknown Digiforma account ${url}`)
    entry.account.response = response
  }

  readonly fetch = async (
    input: string | URL | Request,
    init?: Parameters<typeof fetch>[1]
  ): Promise<Response> => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url)
    const method = init?.method ?? 'GET'
    const headers = Object.fromEntries(
      Object.entries((init?.headers ?? {}) as Record<string, string>).map(([k, v]) => [
        k.toLowerCase(),
        v
      ])
    )
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
    const call: RecordedCall = { url: url.toString(), method, headers, body }

    if (url.origin === DIRECTUS_URL) {
      this.directus.calls.push(call)
      const response = this.directus.handle(url, method, body)
      if (response) return response
    }

    if (url.origin === HUBSPOT_FORMS_URL) {
      this.hubspotCalls.push(call)
      return jsonResponse(200, {})
    }

    const entry = this.accounts.get(url.toString())
    if (entry) {
      this.digiformaCalls.push(call)
      if (headers.authorization !== `Bearer ${entry.token}`) return jsonResponse(401, {})
      const { response } = entry.account
      if (typeof response === 'number') return jsonResponse(response, {})
      return jsonResponse(200, { data: { programs: response } })
    }

    throw new Error(`Unexpected network call: ${method} ${url.toString()}`)
  }

  digiformaCallsTo(url: string): RecordedCall[] {
    return this.digiformaCalls.filter((call) => call.url === url)
  }
}
