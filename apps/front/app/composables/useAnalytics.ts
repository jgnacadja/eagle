import { cleanTrackedUrl, isPreviewQuery, type MatomoCommand } from '~/utils/matomo'
import { cleanEventPayload, toMatomoCommands } from '~/utils/matomo-events'
import {
  ACTION_DIMENSION,
  VISIT_DIMENSION,
  type ActionDimensionKey,
  type VisitDimensionKey
} from '~/utils/matomo-dimensions'
import type { TrackingEvent } from '~/types/analytics'

export interface AnalyticsPageDimensions {
  /** Dimensions personnalisées Matomo (id → valeur), configurées dans ST-32. */
  [dimensionId: number]: string
}

// Registre des dimensions courantes (ST-32). Module-level : la SPA vit dans
// un seul onglet — un rechargement repart à zéro, ce qui est le comportement
// attendu pour des dimensions de portée action. Jamais alimenté côté
// serveur : la lecture n'a lieu que dans `trackPageView` (gardé navigateur).
const actionDimensions = new Map<number, string>()
const visitDimensions = new Map<number, string>()

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

  // `_paq` est un tableau avant le chargement de `matomo.js`, puis le proxy
  // asynchrone de Matomo ensuite — seule la méthode `push` est pérenne.
  const ready = (): boolean =>
    isConfigured() &&
    typeof window !== 'undefined' &&
    typeof window._paq?.push === 'function' &&
    !inPreview()

  /**
   * Dimension de portée action (Gabarit, Famille, Département, Source) :
   * posée par la page/le plugin. La commande `setCustomDimension` part tout
   * de suite pour que les événements de la page courante la portent (un clic
   * `tel:` arrive avant la vue suivante) ; `trackPageView` la repose à chaque
   * vue. `null` ou `undefined` retire la dimension — une valeur périmée ne
   * doit pas survivre à la navigation (les dimensions Matomo persistent).
   */
  function setActionDimension(key: ActionDimensionKey, value?: string | null) {
    const id = ACTION_DIMENSION[key]
    if (value) actionDimensions.set(id, value)
    else actionDimensions.delete(id)
    if (ready()) {
      window._paq!.push(value ? ['setCustomDimension', id, value] : ['deleteCustomDimension', id])
    }
  }

  /**
   * Dimension de portée visite (Landing SEO, Cluster) : une seule valeur par
   * visite — le plugin la fige sur la page d'entrée. Envoyée immédiatement :
   * Matomo l'attache à la visite en cours quel que soit le hit.
   */
  function setVisitDimension(key: VisitDimensionKey, value?: string | null) {
    const id = VISIT_DIMENSION[key]
    if (value) visitDimensions.set(id, value)
    else visitDimensions.delete(id)
    if (ready()) {
      window._paq!.push(value ? ['setCustomDimension', id, value] : ['deleteCustomDimension', id])
    }
  }

  /**
   * Page vue — appelée par le plugin à chaque changement de route ; disponible
   * pour un suivi manuel (vue logique sans navigation). Les dimensions du
   * registre sont posées avant la vue (`dimensions` explicite prime) ; les
   * dimensions action sans valeur sont explicitement retirées pour ne pas
   * fuiter sur la vue suivante.
   */
  function trackPageView(dimensions?: AnalyticsPageDimensions) {
    if (!ready()) return
    const url = cleanTrackedUrl(window.location.pathname, window.location.search)
    window._paq!.push(['setCustomUrl', url])
    window._paq!.push(['setDocumentTitle', document.title])

    const merged = new Map([...actionDimensions, ...visitDimensions])
    for (const [id, value] of Object.entries(dimensions ?? {})) {
      merged.set(Number(id), value)
    }
    for (const id of Object.values(ACTION_DIMENSION)) {
      if (!merged.has(id)) window._paq!.push(['deleteCustomDimension', id])
    }
    for (const [id, value] of merged) {
      window._paq!.push(['setCustomDimension', id, value])
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

  // Droit d'opposition (ST-33) : le suivi est sans cookie, l'opt-out s'appuie
  // donc sur le marqueur first-party de Matomo (`optUserOut` dépose le cookie
  // « mtm_consent_removed » sur le domaine du site — seul cookie toléré par
  // l'exemption, il matérialise le choix). `isOptedOut` passe par une
  // commande fonction : la valeur se lit dans le contexte du tracker.
  function isOptedOut(callback: (optedOut: boolean) => void) {
    if (!ready()) {
      callback(false)
      return
    }
    window._paq!.push([
      function (this: { isUserOptedOut: () => boolean }) {
        callback(this.isUserOptedOut())
      }
    ])
  }

  function optOut() {
    if (ready()) window._paq!.push(['optUserOut'])
  }

  function optIn() {
    if (ready()) window._paq!.push(['forgetUserOptOut'])
  }

  return {
    trackPageView,
    trackEvent,
    pushEvent,
    getPageAttributes,
    setActionDimension,
    setVisitDimension,
    isOptedOut,
    optOut,
    optIn,
    enabled: isConfigured()
  }
}

/** Réinitialise les registres de dimensions — réservé aux specs. */
export function resetAnalyticsDimensions() {
  actionDimensions.clear()
  visitDimensions.clear()
}
