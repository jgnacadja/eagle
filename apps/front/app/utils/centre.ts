import type { Centre } from '@learnup/types'
import type { CenterResult } from '~/types/center-result'

/**
 * Transforme un item `Centre` (Directus) en `CenterResult` affichable
 * par les composants de carte (entreprise, référencement d'organisme).
 */
export const toCenterResults = (centres: Centre[] | null | undefined): CenterResult[] =>
  (centres ?? []).map((centre) => {
    const location = [centre.address, centre.postal_code, centre.city, centre.department]
      .filter(Boolean)
      .join(', ')
    const tags = (centre.specialties ?? []).join(' · ')
    return {
      id: centre.slug,
      name: centre.name,
      cp: centre.postal_code ?? '',
      address: location,
      tags,
      tagsShort: tags,
      lat: centre.latitude ?? undefined,
      lng: centre.longitude ?? undefined
    }
  })
