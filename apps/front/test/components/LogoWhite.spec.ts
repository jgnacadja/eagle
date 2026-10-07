import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LogoWhite from '~/components/Brand/LogoWhite.vue'

describe('LogoWhite', () => {
  it('renders the NuxtImg logo with correct attributes', () => {
    const wrapper = mount(LogoWhite, {
      global: {
        stubs: {
          NuxtImg: {
            template: '<img :src="src" :alt="alt" />',
            props: ['src', 'alt']
          }
        }
      }
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/learn-up-academy.svg')
    expect(img.attributes('alt')).toBe('LEARN UP ACADEMY')
  })
})
