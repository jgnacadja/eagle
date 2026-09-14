import { regions as knownRegions } from '~/data/navigation'
import { slugify } from '~/utils/slugify'

/** Libellé affiché pour une valeur `region` (slug ou libellé brut stocké en base). */
export function formatRegionLabel(value: string): string {
  const normalized = value.trim()
  return (
    knownRegions.find(
      (region) => region.slug === slugify(normalized) || region.label === normalized
    )?.label ?? normalized.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  )
}
