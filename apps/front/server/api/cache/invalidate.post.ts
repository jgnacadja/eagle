// Purge du cache ISR — appelée par les flows Directus d'invalidation après
// chaque écriture de contenu. Deux couches complémentaires :
// - `useStorage('cache')` : runtimes où Nitro sert lui-même l'ISR (docker,
//   preset node) — la purge y est opérante.
// - Revalidation à la demande Vercel : l'ISR y est servi par le CDN, pas par
//   le storage de la lambda — la couche précédente n'y touche rien. Les
//   routeRules `isr` portent un `group` par section et Vercel revalide tout
//   un groupe ensemble : une requête HEAD `x-prerender-revalidate` sur un
//   représentant du groupe marque stale toutes ses pages.
//
// Body (JSON) — le plus précis gagne :
//   { match: '<slug>' }      → routes pouvant porter ce fragment
//   { path: '/formations' }  → routes contenant ce préfixe
//   { collection: 'x' }      → préfixes routiers mappés ci-dessous
//   (vide)                   → purge complète
// `useStorage`, `useRuntimeConfig`, `defineEventHandler`, `getHeader`,
// `readBody`, `createError`, `$fetch` : auto-imports Nitro (pas d'import
// explicite).
import { timingSafeEqual } from 'node:crypto'

const COLLECTION_ROUTES: Record<string, string[]> = {
  formations: ['/formations', '/centres'],
  formations_centres: ['/formations', '/centres'],
  familles_formation: ['/formations'],
  sous_familles_formation: ['/formations'],
  centres: ['/centres', '/formations'],
  articles: ['/actualites', '/'],
  pages: ['/'],
  page_blocks: ['/'],
  stats: ['/']
  // pages_legales volontairement absente : ses routes sont des slugs racine
  // (/{slug}) impossibles à cibler par préfixe — non mappée → purge complète.
}

// Représentant de chaque groupe ISR Vercel (cf. `isr.group` des routeRules
// dans nuxt.config.ts) : le revalider marque stale tout le groupe.
const GROUP_PATHS: Record<number, string> = {
  1: '/formations',
  2: '/centres',
  3: '/actualites',
  4: '/'
}
const ALL_GROUPS = Object.keys(GROUP_PATHS).map(Number)
const SECTION_GROUPS: [RegExp, number][] = [
  [/formations/i, 1],
  [/centres/i, 2],
  [/actualites/i, 3]
]

// Coalescence des marquages CDN : la sync Digiforma écrit des centaines de
// formations à la chaîne et chaque écriture déclenche un appel ici — sans
// fenêtre, chacun émettait un HEAD de revalidation par groupe (dont
// /centres, groupe 2, mappé par `formations`). Un groupe déjà marqué stale
// n'a pas besoin d'être re-marqué : on saute les appels dans la fenêtre et
// on dé-marque un groupe dont le HEAD a échoué (le prochain write
// réessaiera). Map en mémoire du process : chaque lambda throttle sa
// propre rafale. La purge `useStorage` reste immédiate à chaque appel.
const REVALIDATE_WINDOW_MS = 60_000
const lastRevalidateAt = new Map<number, number>()

// Comparaison en temps constant — timingSafeEqual lève sur des longueurs
// différentes ; la longueur du secret n'est pas confidentielle.
function secretEqual(value: string | undefined, secret: string): boolean {
  if (!value) return false
  const a = Buffer.from(value)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Le format interne des clés ISR Nitro n'est pas un contrat stable : on
// compare sur une forme normalisée (alphanumérique) — `match` et `path`
// fonctionnent quel que soit le séparateur utilisé par le driver.
function normalize(value: string): string {
  return value.replaceAll(/[^a-z0-9]/gi, '')
}

// Matcher → groupes ISR à revalider sur Vercel. Un fragment qui ne désigne
// aucune section (ex. un slug de fiche /{famille}/{slug}) couvre tous les
// groupes : rater une page coûte plus qu'une revalidation de trop.
function groupsFor(matchers: string[] | null): number[] {
  if (!matchers) return ALL_GROUPS
  const groups = new Set<number>()
  for (const matcher of matchers) {
    const n = normalize(matcher)
    // « / » se normalise en '' : la racine ne cible que le groupe catch-all.
    if (!n) {
      groups.add(4)
      continue
    }
    const hits = SECTION_GROUPS.filter(([re]) => re.test(n)).map(([, g]) => g)
    for (const g of hits.length ? hits : ALL_GROUPS) groups.add(g)
  }
  return [...groups]
}

export default defineEventHandler(async (event) => {
  const { cachePurgeSecret, isrBypassToken } = useRuntimeConfig(event)
  if (!cachePurgeSecret) {
    throw createError({ statusCode: 503, statusMessage: 'Cache purge non configurée' })
  }
  if (!secretEqual(getHeader(event, 'x-cache-secret'), cachePurgeSecret)) {
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
    // `hasOwn` : sans lui, `__proto__` résoudrait une propriété héritée et
    // `matchers.some` lèverait sur une valeur non-tableau.
    matchers = Object.hasOwn(COLLECTION_ROUTES, body.collection)
      ? COLLECTION_ROUTES[body.collection]!
      : null
  }

  // Couche 1 — ISR servi par Nitro (auto-hébergé). Sur Vercel, ce storage est
  // la mémoire de la lambda : la boucle est inopérante mais sans effet.
  const storage = useStorage('cache')
  const keys = await storage.getKeys()
  const targets = keys.filter((key) => {
    if (!matchers) return true
    const normalized = normalize(key)
    return matchers.some((m) => {
      const matcher = normalize(m)
      // « / » se normalise en '' et `includes('')` est toujours vrai : la
      // racine ne doit cibler que la clé ISR de la page d'accueil (la clé
      // sans segment de route, ex. `nitro:isr:`).
      if (!matcher) return normalized === normalize('nitro:isr:')
      return normalized.includes(matcher)
    })
  })
  await Promise.all(targets.map((key) => storage.removeItem(key)))

  // Couche 2 — ISR servi par le CDN Vercel. Jeton absent (dev, docker, preset
  // node) : le header serait ignoré, on saute les auto-appels. Une requête
  // HEAD par groupe concerné suffit : le groupe est revalidé ensemble.
  let revalidated = 0
  // URL d'appel = URL du déploiement : les prerender functions à revalider
  // vivent sur ce même host (preview incluse). `x-forwarded-proto` est posé
  // par Vercel ; `host` est toujours présent (HTTP/1.1 l'exige).
  const proto = getHeader(event, 'x-forwarded-proto')?.split(',')[0]?.trim() ?? 'https'
  const host = getHeader(event, 'host') ?? getHeader(event, ':authority')
  if (isrBypassToken && host) {
    const base = `${proto}://${host}`
    const now = Date.now()
    const dueGroups = groupsFor(matchers).filter(
      (group) => now - (lastRevalidateAt.get(group) ?? 0) >= REVALIDATE_WINDOW_MS
    )
    for (const group of dueGroups) lastRevalidateAt.set(group, now)
    const settled = await Promise.allSettled(
      dueGroups.map((group) =>
        $fetch.raw(`${base}${GROUP_PATHS[group]}`, {
          method: 'HEAD',
          headers: { 'x-prerender-revalidate': isrBypassToken },
          timeout: 5000
        })
      )
    )
    settled.forEach((result, i) => {
      // Échec réseau → dé-marquer : la prochaine écriture retente le HEAD
      // au lieu de laisser le groupe stale jusqu'à la fin de la fenêtre.
      if (result.status === 'rejected') lastRevalidateAt.delete(dueGroups[i]!)
    })
    revalidated = settled.filter((r) => r.status === 'fulfilled').length
  }

  return { success: true, purged: targets.length, revalidated }
})
