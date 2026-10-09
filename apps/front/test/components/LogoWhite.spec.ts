import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LogoWhite from '~/components/Brand/LogoWhite.vue'

describe('LogoWhite', () => {
  it('composes Logo with the white variant and renders real brand text', () => {
    const wrapper = mount(LogoWhite)
    const root = wrapper.find('.logo--white')
    expect(root.exists()).toBe(true)

    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('viewBox')).toBe('0 0 749 638')
    expect(svg.findAll('path')).toHaveLength(15)

    expect(wrapper.find('.logo-name').text()).toBe('Learn Up Academy')
    expect(wrapper.find('.logo-tagline').text()).toBe('Déclencheur de réussite')
    expect(wrapper.find('img').exists()).toBe(false)
  })
})
