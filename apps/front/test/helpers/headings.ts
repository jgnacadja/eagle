// Audit Hn (ST-06) : un seul <h1> et aucun niveau sauté dans l'arbre rendu.
// Utilisé par les specs de gabarits — vérifie la structure réellement montée.
import type { VueWrapper } from '@vue/test-utils'
import { expect } from 'vitest'

export function assertHeadingStructure(wrapper: VueWrapper) {
  const headings = wrapper.findAll('h1, h2, h3, h4, h5, h6')
  const h1Count = headings.filter((node) => node.element.tagName === 'H1').length
  expect(h1Count).toBe(1)

  let previousLevel = 0
  for (const node of headings) {
    const level = Number(node.element.tagName.slice(1))
    if (previousLevel > 0) {
      expect(
        level,
        `niveau sauté : h${previousLevel} → h${level} (« ${node.text().slice(0, 60)} »)`
      ).toBeLessThanOrEqual(previousLevel + 1)
    }
    previousLevel = level
  }
}
