import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'
import type { AssistantContext, AssistantReply } from '@learnup/types'
import type { AssistantEntry, AssistantSendOptions } from '~/composables/useAssistant'
import { useAssistantTracking } from '~/composables/useAssistantTracking'
import type { MatomoCommand } from '~/utils/matomo'

/**
 * Conversation factice : seuls les signaux observés par le suivi existent.
 * Par défaut un envoi démarre aussitôt (`onStart`) ; `deferStarts` le laisse
 * en file pour simuler des messages qui attendent leur tour.
 */
function fakeAssistant(entries: AssistantEntry[] = [], options: { deferStarts?: boolean } = {}) {
  const list = ref(entries)
  const pending = ref(false)
  const unavailable = ref(false)
  const awaiting = ref(false)
  const lastReply = ref<AssistantReply>()
  const starts: (() => void)[] = []
  const start = (sendOptions?: AssistantSendOptions) => {
    if (options.deferStarts) starts.push(() => sendOptions?.onStart?.())
    else sendOptions?.onStart?.()
    return Promise.resolve()
  }
  return {
    list,
    starts,
    pendingState: pending,
    unavailableState: unavailable,
    awaitingState: awaiting,
    lastReplyState: lastReply,
    assistant: {
      entries: computed(() => list.value),
      pending: computed(() => pending.value),
      unavailable: computed(() => unavailable.value),
      lastReply: computed(() => lastReply.value),
      awaitingClarification: computed(() => awaiting.value),
      send: vi.fn((_message: string, sendOptions?: AssistantSendOptions) => start(sendOptions)),
      editAndSend: vi.fn((_id: string, _message: string, sendOptions?: AssistantSendOptions) =>
        start(sendOptions)
      )
    }
  }
}

const userTurn = (id: string, content: string): AssistantEntry => ({ id, role: 'user', content })
const assistantTurn = (id: string, reply: AssistantReply): AssistantEntry => ({
  id,
  role: 'assistant',
  content: reply.text,
  reply
})

function pushed(): MatomoCommand[] {
  return (window._paq ?? []).filter((c): c is MatomoCommand => c[0] === 'trackEvent')
}

/** Jalons `ai_*` poussés (action = nom de l'événement du plan). */
function events(): MatomoCommand[] {
  return pushed().filter((c) => String(c[2]).startsWith('ai_'))
}

/** Jalons du module Chatbot. */
function chatbotEvents(): MatomoCommand[] {
  return pushed().filter((c) => String(c[2]).startsWith('chatbot_'))
}

const ai = (action: string, name?: string, value?: number): MatomoCommand => {
  const command: MatomoCommand = ['trackEvent', 'Assistant IA', action]
  if (name !== undefined || value !== undefined) command.push(name ?? '')
  if (value !== undefined) command.push(value)
  return command
}

const bot = (action: string, name?: string, value?: number): MatomoCommand => {
  const command: MatomoCommand = ['trackEvent', 'Chatbot', action]
  if (name !== undefined || value !== undefined) command.push(name ?? '')
  if (value !== undefined) command.push(value)
  return command
}

beforeEach(() => {
  window._paq = []
})

afterEach(() => {
  delete window._paq
})

describe('useAssistantTracking', () => {
  it('classe un message comme réponse à une précision seulement quand elle est attendue', async () => {
    const { assistant, awaitingState } = fakeAssistant([userTurn('u1', 'sst')])
    const tracking = useAssistantTracking(assistant, ref<AssistantContext>({ source: 'home' }))

    await tracking.submit('8 salariés', 'suggestion')
    awaitingState.value = true
    await tracking.submit('à Créteil', 'text')

    expect(events()).toEqual([
      ai('ai_search_submit', 'home:suggestion', 2),
      ai('ai_clarification_answer', 'home:text', 2)
    ])
    expect(assistant.send).toHaveBeenCalledTimes(2)
  })

  it("compte un message de point d'entrée comme nouveau besoin, même en attente de précision", async () => {
    const { assistant, awaitingState, pendingState } = fakeAssistant([userTurn('u1', 'sst')])
    const tracking = useAssistantTracking(assistant, ref<AssistantContext>({ source: 'catalogue' }))
    awaitingState.value = true
    pendingState.value = true

    // Le message d'entrée rejoint la file d'envoi même pendant l'analyse.
    await tracking.submit('un autre besoin', 'entry')

    expect(events()).toEqual([ai('ai_search_submit', 'catalogue:entry', 2)])
    expect(assistant.send).toHaveBeenCalledWith('un autre besoin', expect.any(Object))
  })

  it("ignore les envois vides et ceux du panneau pendant l'analyse", async () => {
    const { assistant, pendingState } = fakeAssistant()
    const tracking = useAssistantTracking(assistant, ref<AssistantContext>({}))

    await tracking.submit('   ', 'text')
    pendingState.value = true
    await tracking.submit('pendant', 'text')
    await tracking.submit('pendant', 'suggestion')

    expect(pushed()).toEqual([])
    expect(assistant.send).not.toHaveBeenCalled()
  })

  it('numérote les messages en file par le tour qu’ils prennent réellement', async () => {
    // Un tour est en cours ; deux besoins arrivent de points d'entrée.
    const { assistant, list, starts, pendingState } = fakeAssistant([userTurn('u1', 'premier')], {
      deferStarts: true
    })
    const tracking = useAssistantTracking(assistant, ref<AssistantContext>({ source: 'home' }))
    pendingState.value = true

    void tracking.submit('deuxième', 'entry')
    void tracking.submit('troisième', 'entry')
    // Rien n'est compté tant que les envois attendent en file.
    expect(pushed()).toEqual([])

    starts[0]!()
    list.value = [...list.value, userTurn('u2', 'deuxième')]
    starts[1]!()

    expect(events()).toEqual([
      ai('ai_search_submit', 'home:entry', 2),
      ai('ai_search_submit', 'home:entry', 3)
    ])
    expect(chatbotEvents().map((c) => c[4])).toEqual([2, 3])
  })

  it('ne compte pas un envoi abandonné avant son départ', async () => {
    // `onStart` n'est jamais appelé pour un envoi retiré de la file (stop, reset).
    const { assistant } = fakeAssistant([], { deferStarts: true })
    const tracking = useAssistantTracking(assistant, ref<AssistantContext>({ source: 'home' }))

    await tracking.submit('abandonné', 'text')

    expect(assistant.send).toHaveBeenCalledOnce()
    expect(pushed()).toEqual([])
  })

  it("ne compte un début de recherche qu'à l'ouverture d'une conversation vierge ou sur message d'entrée", () => {
    const { assistant, list } = fakeAssistant()
    const tracking = useAssistantTracking(assistant, ref<AssistantContext>({ source: 'header' }))

    tracking.onOpen()
    list.value = [userTurn('u1', 'sst')]
    tracking.onOpen()
    tracking.onOpen({ entryMessage: true })

    expect(events()).toEqual([ai('ai_search_start', 'header'), ai('ai_search_start', 'header')])
  })

  it('garde la source de la recherche en cours quand le panneau est rouvert ailleurs', async () => {
    const { assistant, list } = fakeAssistant()
    const context = ref<AssistantContext>({ source: 'home' })
    const tracking = useAssistantTracking(assistant, context)

    tracking.onOpen()
    await tracking.submit('former au SST', 'text')
    list.value = [userTurn('u1', 'former au SST')]

    // Le lanceur remplace le contexte : la recherche commencée reste « home ».
    context.value = { source: 'header' }
    tracking.onOpen()
    tracking.onReply({ kind: 'recommend', text: 'ok', recommendations: [] }, { turn: 1 })
    tracking.select({ slug: 'sst', rank: 'primary', action: 'formation' })
    tracking.escalate('recommend')

    expect(events().slice(2)).toEqual([
      ai('ai_recommendation_display', 'home', 0),
      ai('ai_recommendation_select', 'sst:primary:formation'),
      ai('ai_advisor_escalation', 'recommend:home')
    ])

    // Un nouveau besoin transmis par un point d'entrée ouvre une recherche : la source suit.
    context.value = { source: 'catalogue' }
    tracking.onOpen({ entryMessage: true })
    await tracking.submit('autre besoin', 'entry')

    expect(events().slice(-2)).toEqual([
      ai('ai_search_start', 'catalogue'),
      ai('ai_search_submit', 'catalogue:entry', 2)
    ])
  })

  it('attribue une édition au rang du message modifié et ignore un identifiant inconnu', async () => {
    const { assistant } = fakeAssistant([userTurn('u1', 'sst'), userTurn('u2', '8 salariés')])
    const tracking = useAssistantTracking(assistant, ref<AssistantContext>({ source: 'home' }))

    await tracking.edit('u1', 'sst pour 8 salariés')
    await tracking.edit('nope', 'x')
    await tracking.edit('u2', '   ')

    expect(events()).toEqual([ai('ai_search_submit', 'home:edit', 1)])
    expect(chatbotEvents()).toEqual([bot('chatbot_message_sent', undefined, 1)])
    expect(assistant.editAndSend).toHaveBeenCalledTimes(1)
    expect(assistant.editAndSend).toHaveBeenCalledWith(
      'u1',
      'sst pour 8 salariés',
      expect.any(Object)
    )
  })

  it('relaie les réponses et les sélections avec la source', () => {
    const { assistant } = fakeAssistant()
    const tracking = useAssistantTracking(assistant, ref<AssistantContext>({ source: 'formation' }))

    tracking.onReply({ kind: 'clarify', text: 'Précisez.' }, { turn: 1 })
    tracking.onReply(
      { kind: 'recommend', text: 'ok', mode: 'ai', recommendations: [] },
      { turn: 2 }
    )
    tracking.onReply({ kind: 'no_results', text: 'rien' }, { turn: 3 })
    tracking.select({ slug: 'sst', rank: 'primary', action: 'formation' })

    expect(events()).toEqual([
      ai('ai_clarification_requested', 'formation', 1),
      ai('ai_recommendation_display', 'formation:ai', 0),
      ai('ai_no_results', 'no_results:formation', 3),
      ai('ai_recommendation_select', 'sst:primary:formation')
    ])
  })

  it('trace les impasses et les réponses produites en mode dégradé', () => {
    const { assistant } = fakeAssistant()
    const tracking = useAssistantTracking(assistant, ref<AssistantContext>({ source: 'home' }))

    tracking.onReply({ kind: 'no_results', text: 'rien', mode: 'ai' }, { turn: 1 })
    tracking.onReply(
      { kind: 'recommend', text: 'ok', mode: 'fallback', recommendations: [] },
      { turn: 2 }
    )

    expect(events()).toEqual([
      ai('ai_no_results', 'no_results:home', 1),
      ai('ai_recommendation_display', 'home:fallback', 0),
      ai('ai_fallback_mode', 'recommend:home', 2)
    ])
  })

  it("trace l'indisponibilité du moteur au tour courant", async () => {
    const { assistant, unavailableState } = fakeAssistant([userTurn('u1', 'sst')])
    useAssistantTracking(assistant, ref<AssistantContext>({ source: 'centre' }))

    unavailableState.value = true
    await nextTick()
    unavailableState.value = false
    await nextTick()

    expect(events()).toEqual([ai('ai_unavailable', 'centre', 1)])
  })

  it("trace la comparaison et la sortie conseiller avec son état d'origine", () => {
    const { assistant, lastReplyState } = fakeAssistant()
    const tracking = useAssistantTracking(assistant, ref<AssistantContext>({ source: 'home' }))
    lastReplyState.value = { kind: 'recommend', text: 'ok', mode: 'fallback' }

    tracking.compare(3)
    tracking.escalate('degraded')
    // Un état inconnu n'est pas transmis : le jalon part sans origine.
    tracking.escalate('nope')

    expect(events()).toEqual([
      ai('ai_recommendation_compare', 'home', 3),
      ai('ai_advisor_escalation', 'degraded:home'),
      ai('ai_advisor_escalation', 'home')
    ])
  })

  describe('module Chatbot du plan de tracking', () => {
    it("trace l'ouverture, la durée et l'issue de la conversation", async () => {
      let now = 10_000
      const clock = vi.spyOn(Date, 'now').mockImplementation(() => now)
      try {
        const { assistant, list } = fakeAssistant()
        const tracking = useAssistantTracking(assistant, ref<AssistantContext>({ source: 'home' }))

        // Fermeture sans ouverture : rien à conclure.
        tracking.panelClosed()
        tracking.panelOpened('manuel')
        await tracking.submit('former au SST', 'text')
        list.value = [
          userTurn('u1', 'former au SST'),
          assistantTurn('a1', { kind: 'recommend', text: 'ok', recommendations: [] })
        ]
        now += 42_000
        tracking.panelClosed()
        // Une seule fin par ouverture.
        tracking.panelClosed()
      } finally {
        clock.mockRestore()
      }

      const [open, sent, end] = chatbotEvents()
      expect(open).toEqual(bot('chatbot_open', 'manuel'))
      expect(sent).toEqual(bot('chatbot_message_sent', undefined, 1))
      expect(end).toEqual(bot('chatbot_conversation_end', undefined, 42))
      expect(chatbotEvents()).toHaveLength(3)
    })

    it('ré-émet les réponses rapides, les sélections et le passage conseiller', async () => {
      const { assistant, list } = fakeAssistant([userTurn('u1', 'sst')])
      const tracking = useAssistantTracking(assistant, ref<AssistantContext>({ source: 'home' }))

      await tracking.submit('8 salariés', 'suggestion')
      list.value = [...list.value, userTurn('u2', '8 salariés')]
      tracking.select({ slug: 'sst', rank: 'primary', action: 'formation' })
      tracking.escalate('compare')
      tracking.escalate('unavailable')
      tracking.escalate('recommend')
      // Un état inconnu : passage sans motif.
      tracking.escalate('nope')

      expect(chatbotEvents()).toEqual([
        bot('chatbot_suggested_action_click', 'suggestion:8 salariés'),
        bot('chatbot_message_sent', undefined, 2),
        bot('chatbot_suggested_action_click', 'recommendation_formation:sst'),
        bot('chatbot_handoff_to_advisor', 'compare_advisor', 2),
        bot('chatbot_handoff_to_advisor', 'error_advisor', 2),
        bot('chatbot_handoff_to_advisor', 'recommend', 2),
        bot('chatbot_handoff_to_advisor', undefined, 2)
      ])
    })

    it('une nouvelle recherche trace un nouvel envoi au tour courant', async () => {
      const { assistant } = fakeAssistant()
      const tracking = useAssistantTracking(assistant, ref<AssistantContext>({}))

      tracking.panelOpened('auto')
      tracking.newConversation()
      await tracking.submit('autre besoin', 'text')

      const [open, sent] = chatbotEvents()
      expect(open).toEqual(bot('chatbot_open', 'auto'))
      expect(sent).toEqual(bot('chatbot_message_sent', undefined, 1))
    })
  })
})
