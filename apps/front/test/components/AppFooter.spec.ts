import { mount } from '@vue/test-utils'
import AppFooter from '~/components/AppFooter.vue'

describe('AppFooter', () => {
  it('renders the brand name and the current year', () => {
    const wrapper = mount(AppFooter, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          AppLogo: { template: '<svg></svg>' }
        }
      }
    })
    const year = new Date().getFullYear()

    expect(wrapper.text()).toContain('LEARN UP ACADEMY')
    expect(wrapper.text()).toContain(String(year))
  })
})
