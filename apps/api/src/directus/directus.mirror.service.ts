import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface MirrorCourse {
  digiformaId: string
  slug: string
  title: string
  categoryName: string | null
}

interface DirectusFormation {
  id: number
  digiforma_id: string
}

interface UpsertBatch {
  create: { digiforma_id: string; slug: string; title: string; category_name: string | null }[]
  update: {
    id: number
    digiforma_id: string
    slug: string
    title: string
    category_name: string | null
  }[]
}

@Injectable()
export class DirectusMirrorService {
  private readonly logger = new Logger(DirectusMirrorService.name)
  private readonly token: string
  private readonly baseUrl: string
  private readonly timeoutMs = 10_000
  private readonly maxRetries = 2
  private readonly updateConcurrency = 10

  constructor(config: ConfigService) {
    // Token facultatif : l'API doit démarrer sans accès Directus (dev,
    // environnements sans sync). Le miroir est alors simplement désactivé.
    this.token = config.get<string>('DIRECTUS_SYNC_TOKEN') ?? ''
    this.baseUrl = config.get<string>('DIRECTUS_INTERNAL_URL') ?? ''
    if (!this.token || !this.baseUrl) {
      this.logger.warn(
        'DIRECTUS_SYNC_TOKEN or DIRECTUS_INTERNAL_URL missing: Directus mirror disabled'
      )
    }
  }

  private get enabled(): boolean {
    return Boolean(this.token && this.baseUrl)
  }

  async upsertMany(courses: MirrorCourse[]): Promise<void> {
    if (courses.length === 0 || !this.enabled) {
      return
    }

    try {
      const existing = await this.fetchExisting(courses.map((c) => c.digiformaId))
      const batch = this.buildBatch(courses, existing)

      const results = await Promise.allSettled([
        this.createMany(batch.create),
        this.updateMany(batch.update)
      ])

      for (const result of results) {
        if (result.status === 'rejected') {
          this.logger.warn(`Directus mirror upsert failed: ${String(result.reason)}`)
        }
      }
    } catch (error) {
      this.logger.warn(error, 'Directus mirror upsert aborted')
    }
  }

  async fetchAssignments(): Promise<Map<string, string>> {
    // Ne jamais retourner une map vide quand le miroir est désactivé :
    // applyFamilies interpréterait ça comme « toutes les affectations ont
    // été retirées » et viderait family_slug.
    if (!this.enabled) {
      throw new Error(
        'Directus mirror disabled: missing DIRECTUS_SYNC_TOKEN or DIRECTUS_INTERNAL_URL'
      )
    }

    const map = new Map<string, string>()

    try {
      const url = new URL(`${this.baseUrl}/items/formations`)
      // append (et non set) : plusieurs valeurs pour le même paramètre fields[].
      url.searchParams.append('fields[]', 'digiforma_id')
      url.searchParams.append('fields[]', 'famille.slug')
      url.searchParams.set('limit', '-1')

      const response = await this.request<{
        data: Array<{ digiforma_id: string; famille: { slug: string } | null }>
      }>(url.toString())

      for (const row of response.data ?? []) {
        if (row.famille?.slug) {
          map.set(row.digiforma_id, row.famille.slug)
        }
      }
    } catch (error) {
      this.logger.warn(error, 'Failed to fetch family assignments from Directus')
      throw error
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

      const response = await this.request<{ data: DirectusFormation[] }>(url.toString())
      for (const row of response.data ?? []) {
        map.set(row.digiforma_id, row.id)
      }
    }

    return map
  }

  private buildBatch(courses: MirrorCourse[], existing: Map<string, number>): UpsertBatch {
    const batch: UpsertBatch = { create: [], update: [] }

    for (const course of courses) {
      const payload = {
        digiforma_id: course.digiformaId,
        slug: course.slug,
        title: course.title,
        category_name: course.categoryName
      }

      const id = existing.get(course.digiformaId)
      if (id === undefined) {
        batch.create.push(payload)
      } else {
        batch.update.push({ id, ...payload })
      }
    }

    return batch
  }

  private async createMany(rows: UpsertBatch['create']): Promise<void> {
    if (rows.length === 0) return
    await this.request(`${this.baseUrl}/items/formations`, 'POST', rows)
  }

  private async updateMany(rows: UpsertBatch['update']): Promise<void> {
    // PATCH par lots : un Promise.all sur tout le tableau ouvrirait autant
    // de requêtes concurrentes que de formations.
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
        const response = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        })

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
