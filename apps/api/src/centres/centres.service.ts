import { Injectable, Logger } from '@nestjs/common'
import type { CentreListItem } from '@learnup/types'
import { CacheService } from '../common/cache/cache.service'
import { DirectusCatalogService, type DirectusCentre } from '../directus/directus.catalog.service'
import type { ListCentresDto } from './centres.dto'

function normalizeSearch(text: string | null | undefined): string {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function matchesCentre(centre: DirectusCentre, query: ListCentresDto): boolean {
  const department = normalizeSearch(query.department)
  if (
    department &&
    normalizeSearch(centre.department) !== department &&
    !(centre.departments_covered ?? []).some((d) => normalizeSearch(d) === department)
  ) {
    return false
  }

  const search = normalizeSearch(query.search)
  if (search) {
    const haystack = [
      centre.name,
      centre.city,
      centre.postal_code,
      centre.address,
      centre.region,
      ...(centre.specialties ?? [])
    ]
      .map(normalizeSearch)
      .join(' ')
    if (!haystack.includes(search)) return false
  }

  return true
}

const ALL_CENTRES_CACHE_KEY = 'centres:all'

@Injectable()
export class CentresService {
  private readonly logger = new Logger(CentresService.name)

  constructor(
    private readonly cache: CacheService,
    private readonly directus: DirectusCatalogService
  ) {}

  async list(query: ListCentresDto): Promise<CentreListItem[]> {
    // Clé déterministe : JSON.stringify(query) dépend de l'ordre des
    // paramètres d'URL et fragmenterait le cache.
    const cacheKey = `centres:list:${query.department ?? ''}|${query.search ?? ''}`
    const cached = await this.cache.get<CentreListItem[]>(cacheKey)
    if (cached) {
      return cached
    }

    const all = await this.getAllCentres()
    if (all === null) {
      return []
    }
    const result = all.filter((centre) => matchesCentre(centre, query))

    await this.cache.set(cacheKey, result)
    return result
  }

  async departments(): Promise<string[]> {
    const cacheKey = 'centres:departments'
    const cached = await this.cache.get<string[]>(cacheKey)
    if (cached) {
      return cached
    }

    const all = await this.getAllCentres()
    if (all === null) {
      return []
    }
    const set = new Set<string>()
    for (const centre of all) {
      if (centre.department) set.add(centre.department)
      for (const dept of centre.departments_covered ?? []) {
        if (dept) set.add(dept)
      }
    }

    const result = [...set].sort((a, b) => a.localeCompare(b, 'fr'))
    await this.cache.set(cacheKey, result)
    return result
  }

  /**
   * `null` en cas d'échec Directus (distinct de la liste vide) pour que
   * les appelants ne mettent pas en cache un résultat dégradé : sinon une
   * erreur transitoire empoisonnerait `centres:list:*` pour tout le TTL.
   */
  private async getAllCentres(): Promise<DirectusCentre[] | null> {
    const cached = await this.cache.get<DirectusCentre[]>(ALL_CENTRES_CACHE_KEY)
    if (cached) {
      return cached
    }

    try {
      const rows = await this.directus.fetchAllCentres()
      await this.cache.set(ALL_CENTRES_CACHE_KEY, rows)
      return rows
    } catch (error) {
      this.logger.warn({ error }, 'Directus centres fetch failed — returning empty list')
      return null
    }
  }
}
