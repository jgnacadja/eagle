import { Injectable, Logger } from '@nestjs/common'
import { CacheService } from '../common/cache/cache.service'
import { DirectusCatalogService } from '../directus/directus.catalog.service'

export interface GeocodedAddress {
  city: string | null
  postal_code: string | null
  department: string | null
  region: string | null
  latitude: number
  longitude: number
}

interface BanFeature {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    city?: string
    postcode?: string
    // « 69, Rhône, Auvergne-Rhône-Alpes » — code dept, nom dept, région.
    context?: string
  }
}

// API Adresse (BAN) : officielle, gratuite, sans clé.
const BAN_SEARCH_URL = 'https://api-adresse.data.gouv.fr/search/'

function parseBanContext(context: string | undefined): {
  department: string | null
  region: string | null
} {
  const parts = (context ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  return { department: parts[1] ?? null, region: parts[2] ?? null }
}

/**
 * Géocodage des centres : l'éditeur ne renseigne que `address` dans
 * Directus ; ville, code postal, département, région et coordonnées sont
 * dérivés automatiquement via l'API Adresse (BAN). `geocoded_address`
 * mémorise l'adresse traitée pour re-géocoder uniquement en cas de
 * changement.
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name)

  constructor(
    private readonly directus: DirectusCatalogService,
    private readonly cache: CacheService
  ) {}

  async geocodeAddress(address: string): Promise<GeocodedAddress | null> {
    const url = new URL(BAN_SEARCH_URL)
    url.searchParams.set('q', address)
    url.searchParams.set('limit', '1')

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8_000) })
      if (!response.ok) return null
      const body = (await response.json()) as { features?: BanFeature[] }
      const feature = body.features?.[0]
      const coordinates = feature?.geometry?.coordinates
      if (!feature || !coordinates) return null

      const { department, region } = parseBanContext(feature.properties?.context)
      return {
        city: feature.properties?.city ?? null,
        postal_code: feature.properties?.postcode ?? null,
        department,
        region,
        longitude: coordinates[0],
        latitude: coordinates[1]
      }
    } catch (error) {
      this.logger.warn({ error, address }, 'BAN geocoding request failed')
      return null
    }
  }

  /**
   * Géocode les centres dont l'adresse diffère de `geocoded_address` et
   * persiste les champs dérivés dans Directus. Appelé en fin de sync et à
   * la volée quand les centres relus depuis Directus sont périmés.
   */
  async syncMissing(): Promise<{ geocoded: number; failed: number }> {
    let centres
    try {
      centres = await this.directus.fetchCentresForGeocoding()
    } catch (error) {
      this.logger.warn({ error }, 'Centres fetch for geocoding failed')
      return { geocoded: 0, failed: 0 }
    }

    const stale = centres.filter(
      (centre) => centre.address?.trim() && centre.address !== centre.geocoded_address
    )

    let geocoded = 0
    let failed = 0
    for (const centre of stale) {
      const geo = await this.geocodeAddress(centre.address as string)
      if (!geo) {
        failed += 1
        continue
      }
      try {
        await this.directus.updateCentre(centre.id, {
          ...geo,
          geocoded_address: centre.address
        })
        geocoded += 1
      } catch (error) {
        this.logger.warn({ error, centre: centre.slug }, 'Failed to persist centre geodata')
        failed += 1
      }
    }

    if (geocoded > 0) {
      await this.cache.invalidateCatalog()
    }
    if (geocoded > 0 || failed > 0) {
      this.logger.log(`Centre geocoding: ${geocoded} updated, ${failed} failed`)
    }
    return { geocoded, failed }
  }
}
