import type { Centre } from '@learnup/types'
import type { CenterResult } from '~/types/center-result'
import { departmentCodeFromPostalCode } from '~/utils/geo'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}

/**
 * Rue seule : `address` peut déjà contenir la localité voire le pays
 * (« 7 rue Molière, 54400, Longwy, France », copier-coller Google Maps ou
 * anciennes données) — le suffixe « CP[,] ville[, pays] » est retiré pour
 * recomposer les affichages sans doublon.
 */
export const streetOnly = (
  address: string | null | undefined,
  postalCode: string | null | undefined,
  city: string | null | undefined
): string => {
  const raw = (address ?? '').trim()
  const cp = postalCode?.trim()
  const town = city?.trim()
  if (!raw || !cp || !town) return raw
  const tail = new RegExp(
    String.raw`,?\s*${escapeRegExp(cp)},?\s+${escapeRegExp(town)}(?:\s*,\s*[^,]+)?\s*$`,
    'i'
  )
  return raw.replace(tail, '').replace(/,\s*$/, '')
}

/**
 * Localité de la popup carte : « Ville · Département (code) » depuis les
 * champs structurés. Repli sur le dernier segment de `address` pour les
 * `CenterResult` assemblés à la main (legacy).
 */
export const centreLocationLabel = (center: CenterResult): string => {
  const city = center.city?.trim()
  const dept = center.department?.trim()
  const code = departmentCodeFromPostalCode(center.cp)
  let deptLabel = ''
  if (dept) deptLabel = code ? `${dept} (${code})` : dept
  else if (code) deptLabel = `(${code})`
  const label = [city, deptLabel].filter(Boolean).join(' · ')
  if (label) return label
  return center.address.split('·').pop()?.trim() || center.address.split(',').pop()?.trim() || ''
}

/**
 * Transforme un item `Centre` (Directus) en `CenterResult` affichable
 * par les composants de carte (entreprise, référencement d'organisme).
 */
export const toCenterResults = (centres: Centre[] | null | undefined): CenterResult[] =>
  (centres ?? []).map((centre) => {
    const location = [
      streetOnly(centre.address, centre.postal_code, centre.city),
      centre.postal_code,
      centre.city,
      centre.department
    ]
      .filter(Boolean)
      .join(', ')
    const tags = (centre.specialties ?? []).join(' · ')
    return {
      id: centre.slug,
      name: centre.name,
      city: centre.city ?? undefined,
      department: centre.department ?? undefined,
      cp: centre.postal_code ?? '',
      address: location,
      tags,
      tagsShort: tags,
      lat: centre.latitude ?? undefined,
      lng: centre.longitude ?? undefined
    }
  })
