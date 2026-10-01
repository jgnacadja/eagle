import { afterEach, describe, expect, it } from 'vitest'
import { trackEvent } from '~/utils/analytics'

afterEach(() => {
  delete window.dataLayer
})

describe('trackEvent', () => {
  it('pushes the event into an existing dataLayer', () => {
    window.dataLayer = [{ event: 'existing' }]

    const event = trackEvent('ai_search_start', { source: 'home' })

    expect(event).toEqual({ event: 'ai_search_start', source: 'home' })
    expect(window.dataLayer).toEqual([{ event: 'existing' }, event])
  })

  it('creates the dataLayer when the tag manager is not loaded yet', () => {
    trackEvent('ai_search_submit', { turn: 1, via: 'text' })

    expect(window.dataLayer).toEqual([{ event: 'ai_search_submit', turn: 1, via: 'text' }])
  })

  it('drops undefined and null parameters', () => {
    const event = trackEvent('ai_recommendation_display', {
      source: undefined,
      mode: null,
      count: 3,
      fallback: false
    })

    expect(event).toEqual({ event: 'ai_recommendation_display', count: 3, fallback: false })
  })

  it('never throws when the dataLayer rejects the push', () => {
    // dataLayer surchargé par un script tiers : l'analytics ne casse pas l'UX.
    window.dataLayer = {
      push() {
        throw new Error('boom')
      }
    } as unknown as unknown[]

    expect(() => trackEvent('ai_search_start', { source: 'home' })).not.toThrow()
    expect(trackEvent('ai_search_start', { source: 'home' })).toBeNull()
  })
})
