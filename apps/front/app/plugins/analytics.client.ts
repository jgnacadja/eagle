import { nextTick } from 'vue'
import { useDataLayer } from '~/composables/useDataLayer'

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
