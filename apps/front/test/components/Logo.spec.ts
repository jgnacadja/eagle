import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import Logo from '~/components/Brand/Logo.vue'

describe('Logo', () => {
  it('renders the SVG logo', () => {
    const wrapper = mount(Logo)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
