import type { Ref } from 'vue'
import type { AssistantContext, AssistantReply } from '@learnup/types'
import type { AssistantReplyMeta, useAssistant } from '~/composables/useAssistant'
import {
  useAssistantAnalytics,
  type AssistantSelection,
  type AssistantSubmitVia
} from '~/composables/useAssistantAnalytics'

/** Ce que le suivi observe et déclenche sur la conversation. */
export type TrackedAssistant = Pick<
  ReturnType<typeof useAssistant>,
  'entries' | 'pending' | 'awaitingClarification' | 'send' | 'editAndSend'
>

/**
 * Classification analytics du parcours (DEV-CORE), séparée du widget : le
 * composant ne fait que relayer les actions, le composable décide du jalon.
 * Testable sans monter `AssistantChat`.
 */
export function useAssistantTracking(assistant: TrackedAssistant, context: Ref<AssistantContext>) {
  const analytics = useAssistantAnalytics()
  const source = () => context.value.source
  const userTurns = () => assistant.entries.value.filter((e) => e.role === 'user').length

  /**
   * Ouverture du panneau : début de recherche seulement pour une conversation
   * sans tour utilisateur, ou quand un point d'entrée transmet un nouveau
   * besoin — rouvrir une conversation en cours n'en est pas un.
   */
  function onOpen(options: { entryMessage?: boolean } = {}): void {
    if (options.entryMessage || userTurns() === 0) analytics.searchStart(source())
  }

  /** Jalons côté réponse : précision demandée, recommandations affichées. */
  function onReply(reply: AssistantReply, { turn }: AssistantReplyMeta): void {
    if (reply.kind === 'clarify') {
      analytics.clarificationRequested({ source: source(), turn })
    } else if (reply.kind === 'recommend') {
      analytics.recommendationDisplay({
        source: source(),
        turn,
        count: reply.recommendations?.length ?? 0,
        mode: reply.mode
      })
    }
  }

  /**
   * Envoi tracé. Un message du panneau pendant l'analyse est ignoré (le
   * composer est désactivé, les chips aussi) ; un message de point d'entrée
   * est toujours un nouveau besoin, même après une question de précision, et
   * rejoint la file d'envoi.
   */
  function submit(message: string, via: AssistantSubmitVia = 'text'): Promise<void> {
    if (!message.trim()) return Promise.resolve()
    if (assistant.pending.value && via !== 'entry') return Promise.resolve()
    const params = { source: source(), turn: userTurns() + 1, via }
    if (via !== 'entry' && assistant.awaitingClarification.value) {
      analytics.clarificationAnswer(params)
    } else {
      analytics.searchSubmit(params)
    }
    return assistant.send(message)
  }

  /** Édition d'un tour : nouveau besoin au rang du message modifié. */
  function edit(id: string, message: string): Promise<void> {
    if (!message.trim()) return Promise.resolve()
    const index = assistant.entries.value
      .filter((e) => e.role === 'user')
      .findIndex((e) => e.id === id)
    // Tour introuvable : rien à modifier ni à attribuer.
    if (index < 0) return Promise.resolve()
    analytics.searchSubmit({ source: source(), turn: index + 1, via: 'edit' })
    return assistant.editAndSend(id, message)
  }

  function select(selection: AssistantSelection): void {
    analytics.recommendationSelect({ ...selection, source: source() })
  }

  return { onOpen, onReply, submit, edit, select }
}
