// Slash final proscrit (ST-02) : toute URL de page avec « / » terminal
// redirige en 301 vers sa forme sans slash, en un seul saut (la query est
// conservée ; le fragment ne quitte jamais le client).
// Le middleware Nitro s'exécute avant le rendu et l'ISR : la redirection
// coûte une requête, jamais un rendu.
// Exclus : racine, chemins internes (API, proxy, assets), tout ce qui
// ressemble à un fichier (dernier segment avec extension).
const INTERNAL_PREFIXES =
  /^\/(?:api|directus|_nuxt|__sitemap__|_ipx|__nuxt|fonts|images|favicon)(?:\/|$)/
const FILE_LIKE = /\.[a-zA-Z0-9]{1,10}$/

export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return

  const { pathname, search } = getRequestURL(event)
  if (pathname === '/' || !pathname.endsWith('/')) return
  if (INTERNAL_PREFIXES.test(pathname) || FILE_LIKE.test(pathname)) return

  // Cible normalisée en minuscules : les slugs sont contraints en minuscules
  // — `/Formations/` redirige directement vers `/formations` plutôt que
  // d'enchaîner 301 puis 404 (le routeur est sensible à la casse).
  return sendRedirect(event, `${pathname.replace(/\/+$/, '').toLowerCase()}${search}`, 301)
})
