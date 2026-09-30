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
})
