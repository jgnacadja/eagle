import { confirmationFlagKey, type ConfirmationType } from '~/utils/confirmation'

export interface ConfirmationContext {
  /** Référence de suivi affichée (ex. numéro généré pour HubSpot). */
  reference?: string
  /** CTA retour contextuel — ex. la fiche formation d'origine. */
  backTo?: string
  backLabel?: string
}

/**
 * Conversion d'un formulaire (ST-30) : après un envoi réussi, le visiteur
 * arrive sur `/confirmation/{type}/` — l'URL mesurable par l'objectif Matomo.
 * Le drapeau sessionStorage authentifie la conversion : un accès direct,
 * un rechargement ou un retour arrière sur la page de confirmation
 * redirige vers l'accueil sans compter de conversion.
 */
export function useConfirmationRedirect() {
  async function confirmConversion(type: ConfirmationType, context: ConfirmationContext = {}) {
    window.sessionStorage.setItem(confirmationFlagKey(type), JSON.stringify(context))
    await navigateTo(`/confirmation/${type}/`)
  }
  return { confirmConversion }
}
