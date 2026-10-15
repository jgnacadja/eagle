import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAssistantAnalytics } from '~/composables/useAssistantAnalytics'
import type { MatomoCommand } from '~/utils/matomo'

const events = () => (window._paq ?? []).filter((c): c is MatomoCommand => c[0] === 'trackEvent')

const event = (action: string, name?: string, value?: number): MatomoCommand => {
  const command: MatomoCommand = ['trackEvent', 'Assistant IA', action]
  if (name !== undefined || value !== undefined) command.push(name ?? '')
  if (value !== undefined) command.push(value)
  return command
}

const chatbotEvent = (action: string, name?: string, value?: number): MatomoCommand => {
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

describe('useAssistantAnalytics', () => {
  it('émet les jalons du parcours nominal avec leurs paramètres', () => {
    const analytics = useAssistantAnalytics()

    analytics.searchStart('home')
    analytics.searchSubmit({ source: 'home', turn: 1, via: 'entry' })
    analytics.clarificationRequested({ source: 'home', turn: 1 })
    analytics.clarificationAnswer({ source: 'home', turn: 2, via: 'suggestion' })
    analytics.recommendationDisplay({ source: 'home', turn: 2, count: 3, mode: 'ai' })
    analytics.recommendationSelect({
      source: 'home',
      slug: 'sst',
      rank: 'primary',
      action: 'sessions'
    })

    expect(events()).toEqual([
      event('ai_search_start', 'home'),
      event('ai_search_submit', 'home:entry', 1),
      event('ai_clarification_requested', 'home', 1),
      event('ai_clarification_answer', 'home:suggestion', 2),
      event('ai_recommendation_display', 'home:ai', 3),
      event('ai_recommendation_select', 'sst:primary:sessions')
    ])
  })

  it("n'exige pas de source (lanceur flottant)", () => {
    useAssistantAnalytics().searchStart()

    expect(events()).toEqual([event('ai_search_start')])
  })

  it('émet les jalons des états limites', () => {
    const analytics = useAssistantAnalytics()

    analytics.recommendationCompare({ source: 'home', count: 3 })
    analytics.noResults({ source: 'home', turn: 2, kind: 'no_results', mode: 'ai' })
    analytics.unavailable({ source: 'home', turn: 2 })
    analytics.fallbackMode({ source: 'home', turn: 3, kind: 'recommend' })
    analytics.advisorEscalation({ source: 'home', from: 'unavailable' })

    expect(events()).toEqual([
      event('ai_recommendation_compare', 'home', 3),
      event('ai_no_results', 'no_results:home', 2),
      event('ai_unavailable', 'home', 2),
      event('ai_fallback_mode', 'recommend:home', 3),
      event('ai_advisor_escalation', 'unavailable:home')
    ])
  })

  it('émet les jalons du module Chatbot du plan', () => {
    const analytics = useAssistantAnalytics()

    analytics.chatbotOpen({ trigger_type: 'manuel', conversation_id: 'c1' })
    analytics.chatbotMessageSent({ conversation_id: 'c1', message_index: 1 })
    analytics.chatbotSuggestedActionClick({
      conversation_id: 'c1',
      action_type: 'suggestion',
      action_label: '8 salariés'
    })
    analytics.chatbotHandoffToAdvisor({
      conversation_id: 'c1',
      reason: 'compare_advisor',
      messages_count: 3
    })
    analytics.chatbotConversationEnd({
      conversation_id: 'c1',
      messages_count: 4,
      resolved: false,
      duration_seconds: 42
    })

    expect(events()).toEqual([
      chatbotEvent('chatbot_open', 'manuel'),
      chatbotEvent('chatbot_message_sent', undefined, 1),
      chatbotEvent('chatbot_suggested_action_click', 'suggestion:8 salariés'),
      chatbotEvent('chatbot_handoff_to_advisor', 'compare_advisor', 3),
      chatbotEvent('chatbot_conversation_end', undefined, 42)
    ])
  })

  it('ne laisse pas une erreur du tracker remonter dans la conversation', () => {
    // Un script tiers peut remplacer la file par un objet qui rejette.
    window._paq = []
    window._paq.push = () => {
      throw new Error('_paq tiers')
    }

    expect(() => useAssistantAnalytics().searchStart('home')).not.toThrow()
  })
})
