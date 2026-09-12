// Purge du cache ISR Nitro — appelée par les flows Directus d'invalidation
// après chaque écriture de contenu. Sans elle, les pages resteraient figées
// jusqu'à l'expiration naturelle (600 s) malgré la purge Redis de l'API.
//
// Body (JSON) — le plus précis gagne :
//   { match: '<slug>' }      → seules les routes contenant ce fragment
//   { path: '/formations' }  → routes contenant ce préfixe
//   { collection: 'x' }      → préfixes routiers mappés ci-dessous
//   (vide)                   → purge complète
// `useStorage`, `useRuntimeConfig`, `defineEventHandler`, `getHeader`,
// `readBody`, `createError` : auto-imports Nitro (pas d'import explicite).
const COLLECTION_ROUTES: Record<string, string[]> = {
  formations: ['/formations'],
  familles_formation: ['/formations'],
  sous_familles_formation: ['/formations'],
  centres: ['/centres', '/formations'],
  articles: ['/actualites', '/'],
  pages: ['/'],
  page_blocks: ['/'],
  stats: ['/']
}

// Le format interne des clés ISR Nitro n'est pas un contrat stable : on
// compare sur une forme normalisée (alphanumérique) — `match` et `path`
// fonctionnent quel que soit le séparateur utilisé par le driver.
function normalize(value: string): string {
  return value.replaceAll(/[^a-z0-9]/gi, '')
}

export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig(event).cachePurgeSecret
  if (!secret) {
    throw createError({ statusCode: 503, statusMessage: 'Cache purge non configurée' })
  }
  if (getHeader(event, 'x-cache-secret') !== secret) {
    throw createError({ statusCode: 401, statusMessage: 'Secret invalide' })
  }

  const body = (await readBody(event)) as {
    collection?: string
    path?: string
    match?: string
  } | null

  let matchers: string[] | null = null
  if (body?.match || body?.path) {
    matchers = [body.match ?? body.path].filter((v): v is string => Boolean(v))
  } else if (body?.collection) {
    // Collection non mappée : purge complète — la fraîcheur prime.
    matchers = COLLECTION_ROUTES[body.collection] ?? null
  }

  const storage = useStorage('cache')
  const keys = await storage.getKeys()
  const targets = keys.filter((key) => {
    if (!matchers) return true
    const normalized = normalize(key)
    return matchers.some((m) => normalized.includes(normalize(m)))
  })

  await Promise.all(targets.map((key) => storage.removeItem(key)))
  return { success: true, purged: targets.length }
})
