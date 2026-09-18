import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ConfierCard from '~/components/Cards/ConfierCard.vue'

describe('ConfierCard', () => {
  it('renders tag, title, body and image labels (placeholder)', () => {
    const wrapper = mount(ConfierCard, {
      props: {
        tag: 'Conseil',
        title: 'Qualifier le besoin réglementaire',
        body: 'Diagnostic des obligations.',
        imageLabel: 'Photo terrain à fournir',
        imageSub: 'chantier BTP — casque & harnais'
      }
    })

    expect(wrapper.text()).toContain('Conseil')
    expect(wrapper.text()).toContain('Qualifier le besoin réglementaire')
    expect(wrapper.text()).toContain('Diagnostic des obligations.')
    expect(wrapper.text()).toContain('Photo terrain à fournir')
    expect(wrapper.text()).toContain('chantier BTP — casque & harnais')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  describe('image présente', () => {
    it.each(['full', 'image'] as const)(
      'variant="%s" : rend un <img> avec src et alt = imageSub',
      (variant) => {
        const wrapper = mount(ConfierCard, {
          props: {
            tag: 'Conseil',
            title: 'Qualifier le besoin réglementaire',
            body: 'Diagnostic des obligations.',
            imageLabel: 'Photo terrain à fournir',
            imageSub: 'chantier BTP — casque & harnais',
            image: 'https://cdn.example.com/chantier.jpg',
            variant
          }
        })

        const img = wrapper.find('img')
        expect(img.exists()).toBe(true)
        expect(img.attributes('src')).toBe('https://cdn.example.com/chantier.jpg')
        expect(img.attributes('alt')).toBe('chantier BTP — casque & harnais')
        expect(img.attributes('loading')).toBe('lazy')

        // Le placeholder ne doit plus apparaître
        expect(wrapper.text()).not.toContain('Photo terrain à fournir')
      }
    )

    it.each(['full', 'image'] as const)(
      'variant="%s" : alt retombe sur title quand imageSub est absent',
      (variant) => {
        const wrapper = mount(ConfierCard, {
          props: {
            tag: 'Conseil',
            title: 'Qualifier le besoin réglementaire',
            body: 'Diagnostic des obligations.',
            imageLabel: 'Photo terrain à fournir',
            image: 'https://cdn.example.com/chantier.jpg',
            variant
          }
        })

        expect(wrapper.find('img').attributes('alt')).toBe('Qualifier le besoin réglementaire')
      }
    )
  })

  it('variant="detail" : n\'affiche jamais d\'image ni de placeholder', () => {
    const wrapper = mount(ConfierCard, {
      props: {
        tag: 'Conseil',
        title: 'Qualifier le besoin réglementaire',
        body: 'Diagnostic des obligations.',
        imageLabel: 'Photo terrain à fournir',
        image: 'https://cdn.example.com/chantier.jpg',
        variant: 'detail'
      }
    })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Photo terrain à fournir')
  })
})
