/**
 * Événements analytics du site : poussés dans `window.dataLayer` (convention
 * Google Tag Manager — le gestionnaire de tags, soumis au consentement,
 * décide de ce qui part et vers où). Côté serveur ou sans `window` : aucun
 * effet. Les paramètres ne portent jamais de donnée personnelle ni de texte
 * saisi par le visiteur — uniquement des jalons (source, rang du tour, type
 * de réponse, slug de formation).
 */
export type AnalyticsValue = string | number | boolean

export type AnalyticsParams = Record<string, AnalyticsValue | null | undefined>

export interface AnalyticsEvent {
  event: string
  [param: string]: AnalyticsValue
}

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

/** Pousse un événement ; renvoie l'objet poussé (null côté serveur). */
export function trackEvent(name: string, params: AnalyticsParams = {}): AnalyticsEvent | null {
  if (import.meta.server || typeof window === 'undefined') return null

  const event: AnalyticsEvent = { event: name }
  for (const [key, value] of Object.entries(params)) {
    if (value != null) event[key] = value
  }

  window.dataLayer ??= []
  window.dataLayer.push(event)
  return event
}
