import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import Logo from '~/components/Brand/Logo.vue'

describe('Logo', () => {
  it('renders the SVG logo mark without embedded text paths', () => {
    const wrapper = mount(Logo)
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('viewBox')).toBe('185 10 420 420')
    expect(svg.attributes('aria-hidden')).toBe('true')
  })

  it('renders the brand name and tagline as stacked text under the mark', () => {
    const wrapper = mount(Logo)
    expect(wrapper.text()).toContain('Learn Up Academy')
    expect(wrapper.text()).toContain('Déclencheur de réussite')
    expect(wrapper.find('span.flex-col').exists()).toBe(true)
  })
})
