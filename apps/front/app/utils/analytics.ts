/**
 * Événements analytics du site : poussés dans `window.dataLayer` (convention
 * Google Tag Manager). Aucun conteneur GTM ni CMP n'est chargé à ce jour :
 * les événements s'accumulent sans effet. Exigence pour le ticket
 * d'intégration GTM : Consent Mode `default` à `denied` poussé **avant** le
 * chargement du conteneur, puis `update` depuis la CMP — c'est le
 * gestionnaire de tags qui décide de ce qui part et vers où.
 *
 * Côté serveur ou sans `window` : aucun effet. Une erreur du `dataLayer`
 * (surchargé par un script tiers) ne remonte jamais : l'analytics ne doit pas
 * pouvoir casser le parcours. Les paramètres ne portent jamais de donnée
 * personnelle ni de texte saisi par le visiteur — uniquement des jalons
 * (source, rang du tour, type de réponse, slug de formation).
 */

/** Plan de marquage du site — une entrée par événement poussé. */
export type AnalyticsEventName =
  | 'ai_search_start'
  | 'ai_search_submit'
  | 'ai_clarification_requested'
  | 'ai_clarification_answer'
  | 'ai_recommendation_display'
  | 'ai_recommendation_select'
  | 'ai_recommendation_compare'
  | 'ai_no_results'
  | 'ai_unavailable'
  | 'ai_fallback_mode'
  | 'ai_advisor_escalation'

export type AnalyticsValue = string | number | boolean

export type AnalyticsParams = Record<string, AnalyticsValue | null | undefined>

export interface AnalyticsEvent {
  event: AnalyticsEventName
  [param: string]: AnalyticsValue
}

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

/** Pousse un événement ; renvoie l'objet poussé, `null` sans effet. */
export function trackEvent(
  name: AnalyticsEventName,
  params: AnalyticsParams = {}
): AnalyticsEvent | null {
  if (import.meta.server || typeof window === 'undefined') return null

  const event: AnalyticsEvent = { event: name }
  for (const [key, value] of Object.entries(params)) {
    if (value != null) event[key] = value
  }

  try {
    window.dataLayer ??= []
    window.dataLayer.push(event)
  } catch {
    // no-op : l'analytics ne doit jamais casser l'UX.
    return null
  }
  return event
}
