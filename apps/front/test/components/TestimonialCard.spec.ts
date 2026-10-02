import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TestimonialCard from '~/components/Cards/TestimonialCard.vue'

describe('TestimonialCard', () => {
  it('affiche étoiles, citation et auteur en variante surface', () => {
    const wrapper = mount(TestimonialCard, {
      props: {
        stars: '★★★★★',
        quote: 'Une équipe très réactive.',
        author: 'Chargée QHSE'
      }
    })

    expect(wrapper.text()).toContain('★★★★★')
    expect(wrapper.text()).toContain('Une équipe très réactive.')
    expect(wrapper.text()).toContain('Chargée QHSE')
    expect(wrapper.find('figure').classes()).toContain('bg-surface')
  })

  it('applique la variante paper', () => {
    const wrapper = mount(TestimonialCard, {
      props: {
        stars: '★★★★',
        quote: 'Bon accompagnement.',
        author: 'DRH',
        variant: 'paper'
      }
    })

    expect(wrapper.find('figure').classes()).toContain('bg-paper')
  })
})
