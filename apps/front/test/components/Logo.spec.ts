import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import Logo from '~/components/Brand/Logo.vue'

describe('Logo', () => {
  it('renders the 15 logo mark paths on the full original canvas, decorative only', () => {
    const wrapper = mount(Logo)
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('viewBox')).toBe('0 0 749 638')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('focusable')).toBe('false')
    expect(svg.findAll('path')).toHaveLength(15)
    expect(svg.find('text').exists()).toBe(false)
  })

  it('renders brand name and tagline as separate HTML spans after the mark', () => {
    const wrapper = mount(Logo)
    const svg = wrapper.find('svg')
    const name = wrapper.find('.logo-name')
    const tagline = wrapper.find('.logo-tagline')
    expect(name.exists()).toBe(true)
    expect(name.text()).toBe('Learn Up Academy')
    expect(tagline.exists()).toBe(true)
    expect(tagline.text()).toBe('Déclencheur de réussite')
    expect(svg.element.nextElementSibling).toBe(name.element)
    expect(name.element.nextElementSibling).toBe(tagline.element)
  })

  it('does not use the old oversized typography or gap utilities', () => {
    const wrapper = mount(Logo)
    expect(wrapper.find('.gap-xs').exists()).toBe(false)
    expect(wrapper.find('.text-small').exists()).toBe(false)
    expect(wrapper.find('.text-overline').exists()).toBe(false)
    expect(wrapper.find('.flex-col').exists()).toBe(false)
  })

  it('defaults to the color variant and exposes the white variant class', () => {
    const color = mount(Logo)
    expect(color.find('.logo--white').exists()).toBe(false)

    const white = mount(Logo, { props: { variant: 'white' } })
    expect(white.find('.logo--white').exists()).toBe(true)
  })
})
