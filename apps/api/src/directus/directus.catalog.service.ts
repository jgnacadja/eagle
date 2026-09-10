import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { CentreListItem } from '@learnup/types'
import type { FormationDirectusPayload } from '../digiforma/digiforma.mapper'

export interface FamilyApplyResult {
  assigned: number
  cleared: number
}

export interface DirectusFormation extends FormationDirectusPayload {
  id: number
  famille: { id: number; slug: string } | null
  created_at: string | null
  updated_at: string | null
}

export type DirectusCentre = CentreListItem

interface FetchLikeResponse {
  ok: boolean
  status: number
  json(): Promise<unknown>
  text(): Promise<string>
}

interface UpsertBatch {
  create: FormationDirectusPayload[]
  update: (FormationDirectusPayload & { id: number })[]
}

const ALL_CENTRE_FIELDS = [
  'id',
  'status',
  'slug',
  'name',
  'address',
  'city',
  'postal_code',
  'department',
  'departments_covered',
  'region',
  'specialties',
  'latitude',
  'longitude'
]

const ALL_FORMATION_FIELDS = [
  'id',
  'digiforma_id',
  'slug',
  'title',
  'description',
  'duration_days',
  'duration_hours',
  'price',
  'cpf',
  'cpf_code',
  'certification',
  'certifier_name',
  'category_name',
  'modalities',
  'center_slug',
  'center_slugs',
  'sessions',
  'locations_text',
  'blocks',
  'image_url',
  'generated_program_url',
  'status',
  'seo_title',
  'seo_description',
  'seo_canonical',
  'raw',
  'famille.slug',
  'created_at',
  'updated_at'
]

@Injectable()
export class DirectusCatalogService {
  private readonly logger = new Logger(DirectusCatalogService.name)
  private readonly token: string
  private readonly baseUrl: string
  private readonly timeoutMs = 10_000
  private readonly maxRetries = 2
  private readonly updateConcurrency = 10

  constructor(config: ConfigService) {
    // Token facultatif : l'API doit démarrer sans accès Directus (dev,
    // environnements sans sync). Le catalogue Directus est alors simplement
    // indisponible, les endpoints dégradent gracieusement.
    this.token = config.get<string>('DIRECTUS_TOKEN') ?? ''
    this.baseUrl = config.get<string>('DIRECTUS_INTERNAL_URL') ?? ''
    if (!this.token || !this.baseUrl) {
      this.logger.warn('DIRECTUS_TOKEN or DIRECTUS_INTERNAL_URL missing: Directus catalog disabled')
    }
  }

  private get enabled(): boolean {
    return Boolean(this.token && this.baseUrl)
  }

  /**
   * Crée ou met à jour un lot de formations dans Directus.
   * L'affectation famille n'est jamais écrite : elle reste éditoriale.
   */
  async upsertMany(
    courses: FormationDirectusPayload[]
  ): Promise<{ inserted: number; updated: number }> {
    if (courses.length === 0 || !this.enabled) {
      return { inserted: 0, updated: 0 }
    }

    const existing = await this.fetchExisting(courses.map((c) => c.digiforma_id))
    const batch = this.buildBatch(courses, existing)

    await Promise.all([this.createMany(batch.create), this.updateMany(batch.update)])

    return {
      inserted: batch.create.length,
      updated: batch.update.length
    }
  }

  /** Récupère l'intégralité des formations publiées (cache en amont si besoin). */
  async fetchAllFormations(): Promise<DirectusFormation[]> {
    if (!this.enabled) {
      return []
    }

    const url = new URL(`${this.baseUrl}/items/formations`)
    url.searchParams.set('filter[status][_eq]', 'published')
    url.searchParams.set('limit', '-1')
    for (const field of ALL_FORMATION_FIELDS) {
      url.searchParams.append('fields[]', field)
    }

    const response = await this.request<{ data: DirectusFormation[] }>(url.toString())
    return response.data ?? []
  }

  /**
   * Récupère l'intégralité des centres publiés. Le filtrage métier se fait
   * en mémoire côté API : les champs JSON (`departments_covered`,
   * `specialties`) ne supportent ni `_contains` ni `_icontains` dans
   * Directus, et l'opérateur `_json` n'a pas de wildcard tableau.
   */
  async fetchAllCentres(): Promise<DirectusCentre[]> {
    if (!this.enabled) {
      return []
    }

    const url = new URL(`${this.baseUrl}/items/centres`)
    url.searchParams.set('filter[status][_eq]', 'published')
    url.searchParams.set('limit', '-1')
    url.searchParams.set('sort', 'sort,name')
    for (const field of ALL_CENTRE_FIELDS) {
      url.searchParams.append('fields[]', field)
    }

    const response = await this.request<{ data: DirectusCentre[] }>(url.toString())
    return response.data ?? []
  }

  /**
   * Applique les affectations famille (faites dans Directus) aux formations.
   * Retourne le nombre de formations affectées / désaffectées.
   */
  async applyFamilyAssignments(assignments: Map<string, string>): Promise<FamilyApplyResult> {
    if (!this.enabled) {
      throw new Error('Directus catalog disabled: missing DIRECTUS_TOKEN or DIRECTUS_INTERNAL_URL')
    }

    const [formations, familyBySlug] = await Promise.all([
      this.fetchFormationsForAssignments(),
      this.getFamilyIdsBySlug()
    ])

    const result: FamilyApplyResult = { assigned: 0, cleared: 0 }
    const patches: Promise<unknown>[] = []

    for (const formation of formations) {
      const desiredSlug = assignments.get(formation.digiforma_id)
      if (!desiredSlug) continue

      const currentSlug = formation.famille?.slug ?? null
      if (desiredSlug === currentSlug) continue

      const familyId = familyBySlug.get(desiredSlug)
      if (familyId === undefined) continue

      patches.push(
        this.request(`${this.baseUrl}/items/formations/${formation.id}`, 'PATCH', {
          famille: familyId
        }).then(() => {
          result.assigned += 1
        })
      )
    }

    for (let i = 0; i < patches.length; i += this.updateConcurrency) {
      const slice = patches.slice(i, i + this.updateConcurrency)
      await Promise.all(slice)
    }

    return result
  }

  private async fetchFormationsForAssignments(): Promise<DirectusFormation[]> {
    const url = new URL(`${this.baseUrl}/items/formations`)
    url.searchParams.set('limit', '-1')
    url.searchParams.append('fields[]', 'id')
    url.searchParams.append('fields[]', 'digiforma_id')
    url.searchParams.append('fields[]', 'famille.slug')

    const response = await this.request<{ data: DirectusFormation[] }>(url.toString())
    return response.data ?? []
  }

  async getFamilyIdsBySlug(): Promise<Map<string, number>> {
    const url = new URL(`${this.baseUrl}/items/familles_formation`)
    url.searchParams.set('limit', '-1')
    url.searchParams.append('fields[]', 'id')
    url.searchParams.append('fields[]', 'slug')

    const response = await this.request<{ data: Array<{ id: number; slug: string }> }>(
      url.toString()
    )

    const map = new Map<string, number>()
    for (const row of response.data ?? []) {
      map.set(row.slug, row.id)
    }
    return map
  }

  private async fetchExisting(digiformaIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>()

    for (let i = 0; i < digiformaIds.length; i += 100) {
      const slice = digiformaIds.slice(i, i + 100)
      const url = new URL(`${this.baseUrl}/items/formations`)
      url.searchParams.append('fields[]', 'id')
      url.searchParams.append('fields[]', 'digiforma_id')
      url.searchParams.set('filter[digiforma_id][_in]', slice.join(','))
      url.searchParams.set('limit', '-1')

      const response = await this.request<{ data: Array<{ id: number; digiforma_id: string }> }>(
        url.toString()
      )
      for (const row of response.data ?? []) {
        map.set(row.digiforma_id, row.id)
      }
    }

    return map
  }

  private buildBatch(
    courses: FormationDirectusPayload[],
    existing: Map<string, number>
  ): UpsertBatch {
    const batch: UpsertBatch = { create: [], update: [] }

    for (const course of courses) {
      const id = existing.get(course.digiforma_id)
      if (id === undefined) {
        batch.create.push(course)
      } else {
        batch.update.push({ id, ...course })
      }
    }

    return batch
  }

  private async createMany(rows: FormationDirectusPayload[]): Promise<void> {
    if (rows.length === 0) return
    await this.request(`${this.baseUrl}/items/formations`, 'POST', rows)
  }

  private async updateMany(rows: UpsertBatch['update']): Promise<void> {
    for (let i = 0; i < rows.length; i += this.updateConcurrency) {
      const slice = rows.slice(i, i + this.updateConcurrency)
      await Promise.all(
        slice.map((row) => {
          const { id, ...data } = row
          return this.request(`${this.baseUrl}/items/formations/${id}`, 'PATCH', data)
        })
      )
    }
  }

  private async request<T>(
    url: string,
    method: 'GET' | 'POST' | 'PATCH' = 'GET',
    body?: unknown
  ): Promise<T> {
    let attempt = 0

    while (true) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

      try {
        const response = (await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        })) as unknown as FetchLikeResponse

        if (!response.ok) {
          const text = await response.text()
          throw new Error(`Directus ${method} ${url} failed: ${response.status} ${text}`)
        }

        if (response.status === 204) {
          return undefined as T
        }

        return (await response.json()) as T
      } catch (error) {
        if (attempt >= this.maxRetries) {
          throw error
        }

        const delay = 2 ** attempt * 100
        this.logger.warn(`Directus request retry ${attempt + 1} after ${delay}ms`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        attempt += 1
      } finally {
        clearTimeout(timeout)
      }
    }
  }
}
