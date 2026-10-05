import { watch, type Ref } from 'vue'
import type { AssistantContext, AssistantReply, AssistantSource } from '@learnup/types'
import type { AssistantReplyMeta, useAssistant } from '~/composables/useAssistant'
import {
  isEscalationFrom,
  useAssistantAnalytics,
  type AssistantSelection,
  type AssistantSubmitVia
} from '~/composables/useAssistantAnalytics'

/** Ce que le suivi observe et déclenche sur la conversation. */
export type TrackedAssistant = Pick<
  ReturnType<typeof useAssistant>,
  | 'entries'
  | 'pending'
  | 'unavailable'
  | 'lastReply'
  | 'awaitingClarification'
  | 'send'
  | 'editAndSend'
>

/**
 * Classification analytics du parcours (DEV-CORE) et des états limites
 * (DEV-EDGE), séparée du widget : le composant ne fait que relayer les
 * actions, le composable décide du jalon. Testable sans monter
 * `AssistantChat`.
 */
export function useAssistantTracking(assistant: TrackedAssistant, context: Ref<AssistantContext>) {
  const analytics = useAssistantAnalytics()
  const userTurns = () => assistant.entries.value.filter((e) => e.role === 'user').length

  // Source de la recherche en cours, figée à son début : rouvrir le panneau
  // depuis un autre point d'entrée remplace le contexte du lanceur, pas
  // l'origine d'une recherche déjà commencée — sinon ses réponses et ses
  // sélections seraient attribuées à une seconde source.
  let activeSource: AssistantSource | undefined = context.value.source
  const source = () => activeSource

  /**
   * Ouverture du panneau : début de recherche seulement pour une conversation
   * sans tour utilisateur, ou quand un point d'entrée transmet un nouveau
   * besoin — rouvrir une conversation en cours n'en est pas un et garde sa
   * source.
   */
  function onOpen(options: { entryMessage?: boolean } = {}): void {
    if (!options.entryMessage && userTurns() > 0) return
    activeSource = context.value.source
    analytics.searchStart(activeSource)
  }

  /**
   * Jalons côté réponse : précision demandée, recommandations affichées,
   * impasses (aucun résultat, hors catalogue) et réponses produites en mode
   * dégradé.
   */
  function onReply(reply: AssistantReply, { turn }: AssistantReplyMeta): void {
    const params = { source: source(), turn }
    if (reply.kind === 'clarify') {
      analytics.clarificationRequested(params)
    } else if (reply.kind === 'recommend') {
      analytics.recommendationDisplay({
        ...params,
        count: reply.recommendations?.length ?? 0,
        mode: reply.mode
      })
    } else {
      analytics.noResults({ ...params, kind: reply.kind, mode: reply.mode })
    }
    if (reply.mode === 'fallback') analytics.fallbackMode({ ...params, kind: reply.kind })
  }

  // Moteur indisponible (E9) après un tour : jalon d'impasse.
  watch(assistant.unavailable, (value) => {
    if (value) analytics.unavailable({ source: source(), turn: userTurns() })
  })

  /**
   * Envoi tracé. Un message du panneau pendant l'analyse est ignoré (le
   * composer est désactivé, les chips aussi) ; un message de point d'entrée
   * est toujours un nouveau besoin, même après une question de précision, et
   * rejoint la file d'envoi.
   *
   * Le jalon part quand l'envoi quitte la file et démarre réellement
   * (`onStart`) : le rang est alors celui que portera sa réponse — deux
   * messages en file ne partagent plus le même tour — et un envoi abandonné
   * (stop, nouvelle recherche) n'est jamais compté.
   */
  function submit(message: string, via: AssistantSubmitVia = 'text'): Promise<void> {
    if (!message.trim()) return Promise.resolve()
    if (assistant.pending.value && via !== 'entry') return Promise.resolve()
    return assistant.send(message, {
      onStart: () => {
        const params = { source: source(), turn: userTurns() + 1, via }
        if (via !== 'entry' && assistant.awaitingClarification.value) {
          analytics.clarificationAnswer(params)
        } else {
          analytics.searchSubmit(params)
        }
      }
    })
  }

  /** Édition d'un tour : nouveau besoin au rang du message modifié. */
  function edit(id: string, message: string): Promise<void> {
    if (!message.trim()) return Promise.resolve()
    const index = assistant.entries.value
      .filter((e) => e.role === 'user')
      .findIndex((e) => e.id === id)
    // Tour introuvable : rien à modifier ni à attribuer.
    if (index < 0) return Promise.resolve()
    return assistant.editAndSend(id, message, {
      onStart: () => analytics.searchSubmit({ source: source(), turn: index + 1, via: 'edit' })
    })
  }

  function select(selection: AssistantSelection): void {
    analytics.recommendationSelect({ ...selection, source: source() })
  }

  /** Tableau comparatif ouvert (nombre de formations comparées). */
  function compare(count: number): void {
    analytics.recommendationCompare({ source: source(), count })
  }

  /**
   * Sortie conseiller cliquée : `from` est l'état porté par le lien
   * (`data-advisor-escalation`), le mode celui de la dernière réponse.
   */
  function escalate(from: string): void {
    analytics.advisorEscalation({
      source: source(),
      from: isEscalationFrom(from) ? from : undefined,
      mode: assistant.lastReply.value?.mode
    })
  }

  return { onOpen, onReply, submit, edit, select, compare, escalate }
}
