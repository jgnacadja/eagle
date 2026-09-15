import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ConfierCard from '~/components/Cards/ConfierCard.vue'

describe('ConfierCard', () => {
  it('renders tag, title, body and image labels', () => {
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
  })
})
