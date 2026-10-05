// URL d'un asset Directus servi via le proxy de l'API — le fichier Directus
// est la seule source de visuels (formations, familles, centres, articles).
// `apiBase` obligatoire : passé par l'appelant depuis la runtime config
// capturée au setup — jamais résolu ici (hors contexte Nuxt, useRuntimeConfig
// lève NUXT_E1001 ; la compilation refuse l'oubli au lieu de le dégrader).
export function directusAssetUrl(
  fileId: string | null | undefined,
  apiBase: string
): string | null {
  if (!fileId || !apiBase) return null
  return `${apiBase}/directus/assets/${fileId}`
}
