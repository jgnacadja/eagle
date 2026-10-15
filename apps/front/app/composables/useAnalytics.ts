import { cleanTrackedUrl, isPreviewQuery, type MatomoCommand } from '~/utils/matomo'

export interface AnalyticsPageDimensions {
  /** Dimensions personnalisées Matomo (id → valeur), configurées dans ST-32. */
  [dimensionId: number]: string
}

/**
 * API interne unique de tracking (ST-27) — le seul point de contact avec la
 * file Matomo `window._paq`. Sans configuration (`NUXT_PUBLIC_MATOMO_URL` /
 * `NUXT_PUBLIC_MATOMO_SITE_ID`) ou pendant une prévisualisation Directus
 * (`?preview=`), chaque appel est un no-op : le tracking ne casse jamais la
 * navigation ni la consultation d'un brouillon.
 */
export function useAnalytics() {
  const config = useRuntimeConfig()
  const route = useRoute()
  const enabled = Boolean(config.public?.matomoUrl && config.public?.matomoSiteId)

  const ready = (): boolean =>
    enabled &&
    typeof window !== 'undefined' &&
    Array.isArray(window._paq) &&
    !isPreviewQuery(route.query)

  /**
   * Page vue — appelée par le plugin à chaque changement de route ; disponible
   * pour un suivi manuel (vue logique sans navigation). `dimensions` reçoit les
   * dimensions personnalisées de la page (Gabarit & co — ST-32).
   */
  function trackPageView(dimensions?: AnalyticsPageDimensions) {
    if (!ready()) return
    const url = cleanTrackedUrl(window.location.pathname, window.location.search)
    window._paq!.push(['setCustomUrl', url])
    window._paq!.push(['setDocumentTitle', document.title])
    for (const [id, value] of Object.entries(dimensions ?? {})) {
      window._paq!.push(['setCustomDimension', Number(id), value])
    }
    window._paq!.push(['trackPageView'])
  }

  /** Événement (catégorie, action, nom optionnel, valeur numérique optionnelle). */
  function trackEvent(category: string, action: string, name?: string, value?: number) {
    if (!ready()) return
    const command: Array<string | number> = ['trackEvent', category, action]
    if (name) command.push(name)
    if (value !== undefined) command.push(value)
    window._paq!.push(command as MatomoCommand)
  }

  return { trackPageView, trackEvent, enabled }
}
