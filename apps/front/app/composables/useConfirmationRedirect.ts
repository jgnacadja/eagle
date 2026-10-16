import { confirmationFlagKey, type ConfirmationType } from '~/utils/confirmation'

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
 * Le drapeau sessionStorage authentifie la conversion : la vue de la page
 * n'est émise que si le drapeau existe — un accès direct, un rechargement
 * ou un retour arrière ne compte jamais de conversion.
 */
export function useConfirmationRedirect() {
  async function confirmConversion(type: ConfirmationType, context: ConfirmationContext = {}) {
    try {
      window.sessionStorage.setItem(confirmationFlagKey(type), JSON.stringify(context))
    } catch {
      // Stockage indisponible (navigation privée, quota, politique) : sans
      // drapeau la page renvoie vers l'accueil — la sortie n'est pas bloquée.
    }
    await navigateTo(`/confirmation/${type}`)
  }
  return { confirmConversion }
}
