import { nextTick } from 'vue'
import { useAnalytics } from '~/composables/useAnalytics'
import { isPreviewQuery } from '~/utils/matomo'
import { logClientWarning } from '~/utils/logger'

// ST-27 — tracker Matomo sans cookie. La file `_paq` est remplie avant
// l'injection du script : les commandes sont rejouées dans l'ordre au
// chargement de matomo.js (hébergé sur le sous-domaine de la VM, ST-26).
// Cookies désactivés (disableCookies → conformité sans bandeau) ; l'IP
// anonymisée (MAT-16) est un réglage de l'instance, pas du tracker.
// Sans configuration (dev, preview Vercel) le script n'est pas chargé :
// `useAnalytics()` reste un no-op et aucune donnée ne fuit hors prod/recette.
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const matomoUrl = (config.public?.matomoUrl as string | undefined)?.replace(/\/+$/, '')
  const siteId = config.public?.matomoSiteId as string | undefined

  if (!matomoUrl || !siteId) {
    logClientWarning(
      '[Analytics] NUXT_PUBLIC_MATOMO_URL / NUXT_PUBLIC_MATOMO_SITE_ID manquants : Matomo désactivé.'
    )
    return
  }

  window._paq = window._paq ?? []
  window._paq.push(['setTrackerUrl', `${matomoUrl}/matomo.php`])
  window._paq.push(['setSiteId', siteId])
  window._paq.push(['disableCookies'])

  const { trackPageView } = useAnalytics()
  const route = useRoute()

  // Vue initiale (déclenchée immédiatement, les commandes attendent matomo.js),
  // puis une vue à chaque navigation client — après useHead pour avoir le titre.
  if (!isPreviewQuery(route.query)) trackPageView()
  window._paq.push(['enableLinkTracking'])

  if (!document.getElementById('matomo-script')) {
    const script = document.createElement('script')
    script.id = 'matomo-script'
    script.async = true
    script.defer = true
    script.src = `${matomoUrl}/matomo.js`
    document.head.appendChild(script)
  }

  nuxtApp.hook('page:finish', () => {
    nextTick(trackPageView)
  })
})
