import { markConfirmationFlag, type ConfirmationType } from '~/utils/confirmation'

export interface ConfirmationContext {
  /** Référence de suivi affichée (ex. numéro généré pour HubSpot). */
  reference?: string
  /** Ligne de détail sous le message (formation, projet, créneau…). */
  detail?: string
  /** CTA retour contextuel — ex. la fiche formation d'origine. */
  backTo?: string
  backLabel?: string
}

/**
 * Conversion d'un formulaire (ST-30) : après un envoi réussi, le visiteur
 * arrive sur `/confirmation/{type}` — l'URL mesurable par l'objectif Matomo.
 * Le drapeau de conversion (`markConfirmationFlag`, sessionStorage ou
 * secours mémoire) authentifie la conversion : la vue de la page n'est
 * émise que si le drapeau existe — un accès direct, un rechargement ou un
 * retour arrière ne compte jamais de conversion.
 */
export function useConfirmationRedirect() {
  async function confirmConversion(type: ConfirmationType, context: ConfirmationContext = {}) {
    // `markConfirmationFlag` retombe sur un drapeau en mémoire si le
    // stockage est indisponible : la sortie n'est jamais bloquée et la
    // conversion reste authentifiée.
    markConfirmationFlag(type, JSON.stringify(context))
    await navigateTo(`/confirmation/${type}`)
  }
  return { confirmConversion }
}
