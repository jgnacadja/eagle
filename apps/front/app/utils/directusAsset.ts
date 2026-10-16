// URL d'un asset Directus servi via le proxy de l'API — le fichier Directus
// est la seule source de visuels (formations, familles, centres, articles).
// `apiBase` obligatoire : passé par l'appelant depuis la runtime config
// capturée au setup — jamais résolu ici (hors contexte Nuxt, useRuntimeConfig
// lève NUXT_E1001 ; la compilation refuse l'oubli au lieu de le dégrader).
//
// `transform` = transformations natives Directus (`/assets/:id?width=…`) :
// `format: 'auto'` négocie webp/avif via l'en-tête Accept du navigateur.
// Sous-ensemble autorisé par la liste blanche du proxy (ALLOWED_ASSET_PARAMS).
export interface DirectusAssetTransform {
  width?: number
  height?: number
  quality?: number
  fit?: 'cover' | 'contain' | 'inside' | 'outside'
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
}

export function directusAssetUrl(
  fileId: string | null | undefined,
  apiBase: string,
  transform?: DirectusAssetTransform
): string | null {
  if (!fileId || !apiBase) return null
  const url = `${apiBase}/directus/assets/${fileId}`
  if (!transform) return url

  const params = new URLSearchParams()
  if (transform.width) params.set('width', String(transform.width))
  if (transform.height) params.set('height', String(transform.height))
  if (transform.quality) params.set('quality', String(transform.quality))
  if (transform.fit) params.set('fit', transform.fit)
  if (transform.format) params.set('format', transform.format)

  const query = params.toString()
  return query ? `${url}?${query}` : url
}
