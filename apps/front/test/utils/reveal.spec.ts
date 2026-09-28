import { describe, expect, it } from 'vitest'
import { MOTION_PRESETS, heroStagger, revealStagger } from '~/utils/reveal'

describe('revealStagger', () => {
  it('delays the first item by 0', () => {
    expect(revealStagger(0).transition.delay).toBe(0)
  })

  it('caps the delay at index 5', () => {
    expect(revealStagger(99).transition.delay).toBe(revealStagger(5).transition.delay)
  })

  it('clamps negative indexes to 0', () => {
    expect(revealStagger(-3).transition.delay).toBe(0)
  })
})

describe('heroStagger', () => {
  it('caps the delay at index 6', () => {
    expect(heroStagger(99).transition.delay).toBe(heroStagger(6).transition.delay)
  })
})

describe('MOTION_PRESETS', () => {
  it('animates the hero preset on mount', () => {
    expect(MOTION_PRESETS.hero.animate).toEqual({ opacity: 1, y: 0 })
    expect(MOTION_PRESETS.hero).not.toHaveProperty('whileInView')
  })

  it.each(['reveal', 'reveal-soft', 'reveal-media'] as const)(
    '%s reveals once while scrolling into view',
    (name) => {
      const preset = MOTION_PRESETS[name]
      expect(preset.whileInView).toBeDefined()
      expect(preset.inViewOptions.once).toBe(true)
      expect(preset.initial.opacity).toBe(0)
    }
  )
})
