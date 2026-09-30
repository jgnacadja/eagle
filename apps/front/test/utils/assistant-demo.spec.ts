import { describe, expect, it } from 'vitest'
import { ASSISTANT_DEMO_STATES, isAssistantStateId } from '~/data/assistant-demo'

describe('assistant demo fixtures', () => {
  it('couvre les 11 états de la maquette', () => {
    expect(Object.keys(ASSISTANT_DEMO_STATES)).toHaveLength(11)
    expect(isAssistantStateId('recommendation')).toBe(true)
    expect(isAssistantStateId('unknown')).toBe(false)
    expect(isAssistantStateId(['analyzing'])).toBe(false)
    expect(isAssistantStateId('constructor')).toBe(false)
  })

  it('ne recommande que des formations liées au catalogue, avec au plus deux alternatives', () => {
    for (const view of Object.values(ASSISTANT_DEMO_STATES)) {
      if (view.kind !== 'conversation') continue
      for (const turn of view.conversation.turns) {
        if (turn.role !== 'assistant' || turn.kind !== 'recommendations') continue
        const { principal, alternatives } = turn.recommendations
        expect(alternatives.length).toBeLessThanOrEqual(2)
        for (const recommendation of [principal, ...alternatives]) {
          expect(recommendation.course.to.startsWith('/formations/')).toBe(true)
          expect(recommendation.justification).toMatch(/semble/i)
        }
      }
    }
  })
})
