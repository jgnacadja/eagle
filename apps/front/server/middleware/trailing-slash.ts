// Slash final canonique (ST-02) : toute URL de page sans « / » terminal
// redirige en 301 vers sa forme avec slash, en un seul saut (la query est
// conservée ; le fragment ne quitte jamais le client).
// Le middleware Nitro s'exécute avant le rendu et l'ISR : la redirection
// coûte une requête, jamais un rendu.
// Exclus : racine déjà slashée, chemins internes (API, proxy, assets),
// tout ce qui ressemble à un fichier (dernier segment avec extension).
const INTERNAL_PREFIXES =
  /^\/(?:api|directus|_nuxt|__sitemap__|_ipx|__nuxt|fonts|images|favicon)(?:\/|$)/
const FILE_LIKE = /\.[a-zA-Z0-9]{1,10}$/

export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return

  const { pathname, search } = getRequestURL(event)
  if (pathname === '/' || pathname.endsWith('/')) return
  if (INTERNAL_PREFIXES.test(pathname) || FILE_LIKE.test(pathname)) return

  return sendRedirect(event, `${pathname}/${search}`, 301)
})
