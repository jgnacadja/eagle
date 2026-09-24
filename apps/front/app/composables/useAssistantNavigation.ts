import { ASSISTANT_ROUTE, assistantRoute } from '~/utils/assistant-route'

export interface AssistantOrigin {
  /** `fullPath` de la page depuis laquelle le moteur a été ouvert. */
  path: string
  /** Id DOM de l'élément déclencheur : le focus y revient à la fermeture. */
  triggerId?: string
}

export interface OpenAssistantOptions {
  /** Requête initiale transmise en `?q=` (deep-link de l'entrée). */
  query?: string
  /** Id DOM du bouton déclencheur (retour du focus à la fermeture). */
  triggerId?: string
}

// vue-router mémorise l'entrée d'historique précédente dans
// `history.state.back` : elle survit au rechargement de la page,
// contrairement à l'état applicatif.
function hasPreviousEntry(): boolean {
  if (import.meta.server) return false
  const state = window.history.state as { back?: string | null } | null
  return typeof state?.back === 'string' && state.back.length > 0
}

/**
 * Entrée / sortie de la vue pleine page du moteur (« Recherche assistée »).
 *
 * - `open()` mémorise la page d'origine (et le déclencheur) puis navigue
 *   côté client vers la route dédiée, requête initiale en `?q=` — sans
 *   rechargement ni perte de la saisie.
 * - `reset()` (« Nouvelle recherche ») reste dans le moteur : la requête
 *   initiale est retirée de l'URL en remplaçant l'entrée courante — aucune
 *   entrée d'historique ajoutée.
 * - `close()` (« Quitter ») revient à la page précédente exacte : l'entrée
 *   d'historique précédente quand elle existe (le bouton précédent du
 *   navigateur produit le même résultat), sinon l'origine mémorisée ou la
 *   Home, en remplaçant l'entrée courante (deep-link, rechargement).
 * - `restoreFocus()` rend le focus au déclencheur une fois revenu sur la
 *   page d'origine.
 *
 * Les échanges de la conversation ne touchent jamais à l'URL : pas
 * d'accumulation d'entrées par message.
 */
export function useAssistantNavigation() {
  const origin = useState<AssistantOrigin | null>('assistant-origin', () => null)
  const route = useRoute()
  const router = useRouter()
  const nuxtApp = useNuxtApp()

  async function open(options: OpenAssistantOptions = {}): Promise<void> {
    if (route.path !== ASSISTANT_ROUTE) {
      origin.value = options.triggerId
        ? { path: route.fullPath, triggerId: options.triggerId }
        : { path: route.fullPath }
    }
    await navigateTo(assistantRoute(options.query))
  }

  async function reset(): Promise<void> {
    await navigateTo({ path: ASSISTANT_ROUTE }, { replace: true })
  }

  async function close(): Promise<void> {
    if (hasPreviousEntry()) {
      router.back()
      return
    }
    await navigateTo(origin.value?.path ?? '/', { replace: true })
  }

  /**
   * À appeler quand la page du moteur se démonte (« Fermer » ou bouton
   * précédent) : rend le focus à l'élément déclencheur une fois la page
   * d'origine affichée — seulement si l'on y revient réellement (une
   * recommandation ouverte depuis le moteur mène ailleurs).
   */
  function restoreFocus(): void {
    const target = origin.value
    if (!target?.triggerId || import.meta.server) return

    const { path, triggerId } = target
    nuxtApp.hooks.hookOnce('page:finish', () => {
      if (route.fullPath !== path) return
      document.getElementById(triggerId)?.focus()
      origin.value = null
    })
  }

  return { origin, open, reset, close, restoreFocus }
}
