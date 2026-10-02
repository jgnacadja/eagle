import { nextTick } from 'vue'
import { useDataLayer } from '~/composables/useDataLayer'
import { logClientWarning } from '~/utils/logger'

export default defineNuxtPlugin((nuxtApp) => {
  // 1. Initialiser le dataLayer avant tout le reste (exigence stricte du plan)
  window.dataLayer = window.dataLayer || []

  const config = useRuntimeConfig()
  const gtmId = config.public?.gtmId as string | undefined

  if (gtmId && typeof document !== 'undefined' && !document.getElementById('gtm-script')) {
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })
    const script = document.createElement('script')
    script.id = 'gtm-script'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`
    document.head.appendChild(script)
  } else if (!gtmId) {
    logClientWarning(
      '[Analytics] NUXT_PUBLIC_GTM_ID manquant : le script Google Tag Manager ne sera pas chargé.'
    )
  }

  const { pushEvent } = useDataLayer()

  // 2. Événement de page_view initial et sur chaque navigation
  nuxtApp.hook('page:finish', () => {
    // Laisser le temps à document.title de se mettre à jour via useHead / useSeoMeta
    nextTick(() => {
      pushEvent({
        event: 'page_view',
        page_path: window.location.pathname + window.location.search,
        page_title: document.title
      })
    })
  })
})
