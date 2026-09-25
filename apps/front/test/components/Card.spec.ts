import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants
} from '~/components/ui/card'

describe('ui/Card', () => {
  it('rend un conteneur avec les classes du variant par défaut', () => {
    const wrapper = mount(Card, { slots: { default: 'Contenu' } })

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.text()).toBe('Contenu')
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['rounded-md', 'border', 'bg-card']))
  })

  it.each([
    ['surface', 'bg-surface'],
    ['panel', 'border-rule'],
    ['dark', 'bg-primary-dark'],
    ['paper', 'bg-paper']
  ] as const)('applique le variant %s', (variant, expected) => {
    const wrapper = mount(Card, { props: { variant }, slots: { default: 'x' } })

    expect(wrapper.classes()).toContain(expected)
  })

  it('fusionne les classes additionnelles via cn', () => {
    const wrapper = mount(Card, { props: { class: 'mt-md' }, slots: { default: 'x' } })

    expect(wrapper.classes()).toContain('mt-md')
  })
})

describe('ui/Card subcomponents', () => {
  it('CardHeader rend son slot avec les espacements attendus', () => {
    const wrapper = mount(CardHeader, { slots: { default: 'En-tête' } })

    expect(wrapper.text()).toBe('En-tête')
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['flex', 'flex-col', 'p-6']))
  })

  it('CardTitle rend un h3', () => {
    const wrapper = mount(CardTitle, { slots: { default: 'Titre' } })

    expect(wrapper.element.tagName).toBe('H3')
    expect(wrapper.classes()).toContain('font-semibold')
  })

  it('CardDescription rend un paragraphe muted', () => {
    const wrapper = mount(CardDescription, { slots: { default: 'Description' } })

    expect(wrapper.element.tagName).toBe('P')
    expect(wrapper.classes()).toContain('text-muted-foreground')
  })

  it('CardContent et CardFooter rendent leur slot', () => {
    const content = mount(CardContent, { slots: { default: 'Corps' } })
    const footer = mount(CardFooter, { slots: { default: 'Pied' } })

    expect(content.text()).toBe('Corps')
    expect(content.classes()).toContain('p-6')
    expect(footer.text()).toBe('Pied')
    expect(footer.classes()).toContain('p-6')
  })
})

describe('cardVariants', () => {
  it('retombe sur le variant default', () => {
    expect(cardVariants()).toContain('bg-card')
  })
})
