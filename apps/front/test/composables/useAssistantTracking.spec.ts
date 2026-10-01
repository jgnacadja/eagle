import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import type { AssistantContext } from '@learnup/types'
import type { AssistantEntry } from '~/composables/useAssistant'
import { useAssistantTracking } from '~/composables/useAssistantTracking'

/** Conversation factice : seuls les signaux observés par le suivi existent. */
function fakeAssistant(entries: AssistantEntry[] = []) {
  const list = ref(entries)
  const pending = ref(false)
  const awaiting = ref(false)
  return {
    list,
    pendingState: pending,
    awaitingState: awaiting,
    assistant: {
      entries: computed(() => list.value),
      pending: computed(() => pending.value),
      awaitingClarification: computed(() => awaiting.value),
      send: vi.fn().mockResolvedValue(undefined),
      editAndSend: vi.fn().mockResolvedValue(undefined)
    }
  }
}

const userTurn = (id: string, content: string): AssistantEntry => ({ id, role: 'user', content })

function events(): unknown[] {
  return window.dataLayer ?? []
}

beforeEach(() => {
  window.dataLayer = []
})

afterEach(() => {
  delete window.dataLayer
})

describe('useAssistantTracking', () => {
  it('classe un message comme réponse à une précision seulement quand elle est attendue', async () => {
    const { assistant, awaitingState } = fakeAssistant([userTurn('u1', 'sst')])
    const tracking = useAssistantTracking(assistant, ref<AssistantContext>({ source: 'home' }))

    await tracking.submit('8 salariés', 'suggestion')
    awaitingState.value = true
    await tracking.submit('à Créteil', 'text')

    expect(events()).toEqual([
      { event: 'ai_search_submit', source: 'home', turn: 2, via: 'suggestion' },
      { event: 'ai_clarification_answer', source: 'home', turn: 2, via: 'text' }
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

    expect(events()).toEqual([
      { event: 'ai_search_submit', source: 'catalogue', turn: 2, via: 'entry' }
    ])
    expect(assistant.send).toHaveBeenCalledWith('un autre besoin')
  })

  it("ignore les envois vides et ceux du panneau pendant l'analyse", async () => {
    const { assistant, pendingState } = fakeAssistant()
    const tracking = useAssistantTracking(assistant, ref<AssistantContext>({}))

    await tracking.submit('   ', 'text')
    pendingState.value = true
    await tracking.submit('pendant', 'text')
    await tracking.submit('pendant', 'suggestion')

    expect(events()).toEqual([])
    expect(assistant.send).not.toHaveBeenCalled()
  })

  it("ne compte un début de recherche qu'à l'ouverture d'une conversation vierge ou sur message d'entrée", () => {
    const { assistant, list } = fakeAssistant()
    const tracking = useAssistantTracking(assistant, ref<AssistantContext>({ source: 'header' }))

    tracking.onOpen()
    list.value = [userTurn('u1', 'sst')]
    tracking.onOpen()
    tracking.onOpen({ entryMessage: true })

    expect(events()).toEqual([
      { event: 'ai_search_start', source: 'header' },
      { event: 'ai_search_start', source: 'header' }
    ])
  })

  it('attribue une édition au rang du message modifié et ignore un identifiant inconnu', async () => {
    const { assistant } = fakeAssistant([userTurn('u1', 'sst'), userTurn('u2', '8 salariés')])
    const tracking = useAssistantTracking(assistant, ref<AssistantContext>({ source: 'home' }))

    await tracking.edit('u1', 'sst pour 8 salariés')
    await tracking.edit('nope', 'x')
    await tracking.edit('u2', '   ')

    expect(events()).toEqual([{ event: 'ai_search_submit', source: 'home', turn: 1, via: 'edit' }])
    expect(assistant.editAndSend).toHaveBeenCalledTimes(1)
    expect(assistant.editAndSend).toHaveBeenCalledWith('u1', 'sst pour 8 salariés')
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
      { event: 'ai_clarification_requested', source: 'formation', turn: 1 },
      { event: 'ai_recommendation_display', source: 'formation', turn: 2, count: 0, mode: 'ai' },
      {
        event: 'ai_recommendation_select',
        slug: 'sst',
        rank: 'primary',
        action: 'formation',
        source: 'formation'
      }
    ])
  })
})
