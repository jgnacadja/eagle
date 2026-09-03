import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppLogo from '~/components/AppLogo.vue'

describe('AppLogo', () => {
  it('renders the SVG logo', () => {
    const wrapper = mount(AppLogo)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
