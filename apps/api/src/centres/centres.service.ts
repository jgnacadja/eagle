import { Injectable, Logger } from '@nestjs/common'
import type { CentreListItem } from '@learnup/types'
import { CacheService } from '../common/cache/cache.service'
import { DirectusCatalogService, type DirectusCentre } from '../directus/directus.catalog.service'
import { GeocodingService } from './geocoding.service'
import { departmentName } from './departments'
import type { ListCentresDto } from './centres.dto'

function normalizeSearch(text: string | null | undefined): string {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Forme de comparaison d'une valeur de département : casse et accents via
 * `normalizeSearch`, plus espaces et tirets ignorés — « Val de Marne »
 * (tag libre) et « Val-de-Marne » (géocodé BAN) doivent se rejoindre.
 */
function normalizeDepartment(text: string | null | undefined): string {
  return normalizeSearch(text).replace(/[\s-]+/g, '')
}

/**
 * Toutes les valeurs de département rattachées à un centre : le nom
 * géocodé plus `departments_covered` (champ tags libre — codes ou noms),
 * en brut et traduit en nom. Le filtre matche code et nom indifféremment,
 * dans les deux sens.
 */
function centreDepartmentValues(centre: DirectusCentre): string[] {
  const values = [centre.department ?? '', departmentName(centre.department)]
  for (const covered of centre.departments_covered ?? []) {
    if (!covered) continue
    values.push(covered, departmentName(covered))
  }
  return values
}

function matchesCentre(centre: DirectusCentre, query: ListCentresDto): boolean {
  const department = query.department?.trim()
  if (department) {
    // La query peut être un code INSEE (« 94 ») quand le centre ne porte
    // que le nom géocodé « Val-de-Marne », et inversement : on compare
    // les deux formes des deux côtés.
    const wanted = new Set([department, departmentName(department)].map(normalizeDepartment))
    if (!centreDepartmentValues(centre).some((d) => wanted.has(normalizeDepartment(d)))) {
      return false
    }
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
    private readonly directus: DirectusCatalogService,
    private readonly geocoding: GeocodingService
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
    // v2 : les codes `departments_covered` sont traduits en noms — l'ancienne
    // clé servirait une liste mélangeant codes et noms jusqu'à expiration.
    const cacheKey = 'centres:departments:v2'
    const cached = await this.cache.get<string[]>(cacheKey)
    if (cached) {
      return cached
    }

    const all = await this.getAllCentres()
    if (all === null) {
      return []
    }
    // Dédup sur la forme normalisée : '94' (couvert), « Val de Marne »
    // (tag libre) et « Val-de-Marne » (géocodé) donnent une seule entrée.
    // Premier vu gagne : le département géocodé, itéré avant les tags
    // couverts, garde sa graphie BAN.
    const set = new Map<string, string>()
    for (const centre of all) {
      for (const value of [centre.department, ...(centre.departments_covered ?? [])]) {
        const name = departmentName(value)
        const key = normalizeDepartment(name)
        if (name && !set.has(key)) set.set(key, name)
      }
    }

    const result = [...set.values()].sort((a, b) => a.localeCompare(b, 'fr'))
    await this.cache.set(cacheKey, result)
    return result
  }

  async count(): Promise<number> {
    const all = await this.getAllCentres()
    return all?.length ?? 0
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
      // Fire-and-forget : géocode en arrière-plan les centres dont l'adresse
      // a changé — la lecture courante garde les données actuelles, la
      // prochaine (cache invalidé par syncMissing) est à jour.
      void this.geocoding.syncMissing()
      return rows
    } catch (error) {
      this.logger.warn({ error }, 'Directus centres fetch failed — returning empty list')
      return null
    }
  }
}
