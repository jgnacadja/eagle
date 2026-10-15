import { cleanTrackedUrl, isPreviewQuery, type MatomoCommand } from '~/utils/matomo'
import { cleanEventPayload, toMatomoCommands } from '~/utils/matomo-events'
import type { TrackingEvent } from '~/types/analytics'

export interface AnalyticsPageDimensions {
  /** Dimensions personnalisées Matomo (id → valeur), configurées dans ST-32. */
  [dimensionId: number]: string
}

/**
 * API interne unique de tracking — le seul point de contact avec la file
 * Matomo `window._paq` (injectée par `plugins/matomo.client.ts`, ST-27).
 * Sans tracker (`_paq` absent, config manquante) ou pendant une
 * prévisualisation Directus (`?preview=`), chaque appel est un no-op : le
 * tracking ne casse jamais la navigation ni la consultation d'un brouillon.
 *
 * `useRuntimeConfig` / `useRoute` sont résolus à la demande et de façon
 * défensive : le composable reste appelable hors contexte Nuxt.
 */
export function useAnalytics() {
  const isConfigured = (): boolean => {
    try {
      const config = useRuntimeConfig()
      return Boolean(config.public?.matomoUrl && config.public?.matomoSiteId)
    } catch {
      return false
    }
  }

  const inPreview = (): boolean => {
    try {
      return isPreviewQuery(useRoute()?.query ?? {})
    } catch {
      return false
    }
  }

  const ready = (): boolean =>
    isConfigured() && typeof window !== 'undefined' && Array.isArray(window._paq) && !inPreview()

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

  /**
   * Événement typé du plan de tracking (`types/analytics.ts`), traduit en
   * commandes Matomo par `toMatomoCommands` — catégorie, action = nom du plan,
   * nom/valeur issus des identifiants métier. Les valeurs vides et les clés
   * personnelles (PII) sont retirées avant envoi.
   */
  function pushEvent<E extends TrackingEvent>(eventData: E): void {
    if (!ready()) return
    const cleaned = cleanEventPayload(eventData)
    for (const command of toMatomoCommands(cleaned)) {
      window._paq!.push(command)
    }
  }

  /** Attributs de page du plan (chemin courant, titre du document). */
  function getPageAttributes(): { page_path: string; page_title: string } {
    let page_path = ''
    try {
      const route = useRoute()
      page_path = route?.fullPath || route?.path || ''
    } catch {
      // Hors contexte Vue Router
    }

    if (!page_path && typeof window !== 'undefined') {
      page_path = window.location.pathname
    }

    let page_title = ''
    if (typeof document !== 'undefined') {
      page_title = document.title
    }
    return { page_path, page_title }
  }

  return { trackPageView, trackEvent, pushEvent, getPageAttributes, enabled: isConfigured() }
}
