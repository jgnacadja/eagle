// URL d'un asset Directus servi via le proxy de l'API — le fichier Directus
// est la seule source de visuels (formations, familles, centres, articles).
// `apiBase` optionnel : résolu via la runtime config en contexte Nuxt,
// `null` en dehors (tests unitaires purs — le fallback reste possible).
export function directusAssetUrl(
  fileId: string | null | undefined,
  apiBase?: string
): string | null {
  if (!fileId) return null
  const base =
    apiBase ??
    (typeof useRuntimeConfig === 'function' ? useRuntimeConfig().public.apiBase : undefined)
  return base ? `${base}/directus/assets/${fileId}` : null
}
