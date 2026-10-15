// Redirections 301/410 (ST-03) : avant tout rendu, le chemin demandé est
// résolu auprès de l'API (`GET /seo/resolve` — table `redirects` Directus,
// remplie par le hook slug-redirects et le référent SEO). Le middleware
// Nitro s'exécute avant l'ISR : la redirection coûte un appel API (réponse
// en cache Redis), jamais un rendu.
// Normalisation identique à la table : sans slash final, minuscules. La
// query est conservée sur la cible (un lien tracké ou paginé la garde).
// API en échec → passage libre : la résolution ne doit jamais rendre le
// site indisponible (dégradation fail-open).
const INTERNAL_PREFIXES =
  /^\/(?:api|directus|_nuxt|__sitemap__|_ipx|__nuxt|fonts|images|favicon)(?:\/|$)/
const FILE_LIKE = /\.[a-zA-Z0-9]{1,10}$/

interface ResolveResult {
  redirect?: { to: string; status: number }
  gone?: boolean
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return

  const { pathname, search } = getRequestURL(event)
  if (pathname === '/' || INTERNAL_PREFIXES.test(pathname) || FILE_LIKE.test(pathname)) return

  const config = useRuntimeConfig(event)
  const token = config.internalApiToken
  const path = pathname.replace(/\/+$/, '').toLowerCase()

  let result: ResolveResult | null
  try {
    result = await $fetch<ResolveResult>(`${config.apiBase}/seo/resolve`, {
      query: { path },
      headers: typeof token === 'string' && token ? { 'x-internal-ssr': token } : undefined
    })
  } catch {
    return
  }

  if (result?.redirect?.to && result.redirect.to !== path) {
    return sendRedirect(event, `${result.redirect.to}${search}`, 301)
  }
  if (result?.gone) {
    throw createError({ statusCode: 410, statusMessage: 'Gone' })
  }
})
