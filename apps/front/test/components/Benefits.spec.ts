import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Benefits from '~/components/Benefits/index.vue'

const benefits = [
  { label: 'Rapide', title: 'Livraison express', body: 'Reçu sous 24h.' },
  { label: 'Simple', title: 'Sans engagement', body: 'Annulez à tout moment.' },
  { label: 'Sûr', title: 'Paiement sécurisé', body: 'Chiffrement bout en bout.' }
]

describe('Benefits', () => {
  it('affiche le titre principal', () => {
    const wrapper = mount(Benefits, {
      props: { title: 'Nos avantages', benefits }
    })

    const heading = wrapper.get('h2')
    expect(heading.text()).toBe('Nos avantages')
  })

  it('utilise les valeurs par défaut pour id et sectionClass', () => {
    const wrapper = mount(Benefits, {
      props: { title: 'Nos avantages', benefits }
    })

    expect(wrapper.attributes('id')).toBe('modele')
    expect(wrapper.classes()).toContain('mt-4xl')
  })

  it('permet de surcharger id et sectionClass via les props', () => {
    const wrapper = mount(Benefits, {
      props: {
        id: 'avantages',
        title: 'Nos avantages',
        benefits,
        sectionClass: 'mt-lg custom-class'
      }
    })

    expect(wrapper.attributes('id')).toBe('avantages')
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['mt-lg', 'custom-class']))
  })

  it('relie correctement le titre via aria-labelledby', () => {
    const wrapper = mount(Benefits, {
      props: { id: 'avantages', title: 'Nos avantages', benefits }
    })

    expect(wrapper.attributes('aria-labelledby')).toBe('avantages-title')
    expect(wrapper.get('h2').attributes('id')).toBe('avantages-title')
  })

  it("affiche autant de cartes qu'il y a de benefits", () => {
    const wrapper = mount(Benefits, {
      props: { title: 'Nos avantages', benefits }
    })

    const articles = wrapper.findAll('article')
    expect(articles).toHaveLength(benefits.length)
  })

  it('ne rend aucune carte quand benefits est un tableau vide', () => {
    const wrapper = mount(Benefits, {
      props: { title: 'Nos avantages', benefits: [] }
    })

    expect(wrapper.findAll('article')).toHaveLength(0)
  })

  it('utilise le label comme clé (pas de warning de duplication pour des labels uniques)', () => {
    const wrapper = mount(Benefits, {
      props: { title: 'Nos avantages', benefits }
    })

    expect(wrapper.findAll('article').map((a) => a.text())).toHaveLength(benefits.length)
  })
})
