// X-Robots-Tag : hors environnement indexable (dev local, previews
// Vercel, préproduction), toute réponse de page porte « noindex » en
// en-tête — filet en plus du « Disallow: / » du robots.txt : une preview
// partagée ou crawlée hors robots ne peut pas être indexée.
// En environnement indexable, aucun en-tête n'est ajouté : les directives
// par page (meta robots via seo_robots / routeRules robots) font la loi.
const INTERNAL_PREFIXES =
  /^\/(?:api|directus|_nuxt|__sitemap__|_ipx|__nuxt|fonts|images|favicon)(?:\/|$)/
const FILE_LIKE = /\.[a-zA-Z0-9]{1,10}$/

export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return
  const { pathname } = getRequestURL(event)
  if (INTERNAL_PREFIXES.test(pathname) || FILE_LIKE.test(pathname)) return
  if (getSiteIndexable(event)) return

  setHeader(event, 'X-Robots-Tag', 'noindex')
})
