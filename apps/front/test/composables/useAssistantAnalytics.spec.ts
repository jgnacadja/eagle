import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAssistantAnalytics } from '~/composables/useAssistantAnalytics'

beforeEach(() => {
  window.dataLayer = []
})

afterEach(() => {
  delete window.dataLayer
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

    expect(window.dataLayer).toEqual([
      { event: 'ai_search_start', source: 'home' },
      { event: 'ai_search_submit', source: 'home', turn: 1, via: 'entry' },
      { event: 'ai_clarification_requested', source: 'home', turn: 1 },
      { event: 'ai_clarification_answer', source: 'home', turn: 2, via: 'suggestion' },
      { event: 'ai_recommendation_display', source: 'home', turn: 2, count: 3, mode: 'ai' },
      {
        event: 'ai_recommendation_select',
        source: 'home',
        slug: 'sst',
        rank: 'primary',
        action: 'sessions'
      }
    ])
  })

  it("n'exige pas de source (lanceur flottant)", () => {
    useAssistantAnalytics().searchStart()

    expect(window.dataLayer).toEqual([{ event: 'ai_search_start' }])
  })

  it('émet les jalons des états limites', () => {
    const analytics = useAssistantAnalytics()

    analytics.recommendationCompare({ source: 'home', count: 3 })
    analytics.noResults({ source: 'home', turn: 2, kind: 'no_results', mode: 'ai' })
    analytics.unavailable({ source: 'home', turn: 2 })
    analytics.fallbackMode({ source: 'home', turn: 3, kind: 'recommend' })
    analytics.advisorEscalation({ source: 'home', from: 'unavailable' })

    expect(window.dataLayer).toEqual([
      { event: 'ai_recommendation_compare', source: 'home', count: 3 },
      { event: 'ai_no_results', source: 'home', turn: 2, kind: 'no_results', mode: 'ai' },
      { event: 'ai_unavailable', source: 'home', turn: 2 },
      { event: 'ai_fallback_mode', source: 'home', turn: 3, kind: 'recommend' },
      { event: 'ai_advisor_escalation', source: 'home', from: 'unavailable' }
    ])
  })
})
