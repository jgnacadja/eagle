import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import Badge from '~/components/ui/badge/Badge.vue'

describe('Badge', () => {
  it('renders slot content in a span with the default variant', () => {
    const wrapper = mount(Badge, {
      slots: { default: 'Sessions ce mois-ci' }
    })

    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.text()).toContain('Sessions ce mois-ci')
    expect(wrapper.classes()).toContain('bg-primary-soft')
  })

  it('applies the variant classes and a custom element', () => {
    const wrapper = mount(Badge, {
      props: { variant: 'warning', as: 'li' },
      slots: { default: '▲ 2 places' }
    })

    expect(wrapper.element.tagName).toBe('LI')
    expect(wrapper.classes()).toContain('bg-warning-soft')
    expect(wrapper.text()).toContain('2 places')
  })

  it('merges extra classes via cn', () => {
    const wrapper = mount(Badge, {
      props: { variant: 'chip', class: 'uppercase' },
      slots: { default: 'CACES' }
    })

    expect(wrapper.classes()).toContain('bg-primary-faint')
    expect(wrapper.classes()).toContain('uppercase')
  })
})
