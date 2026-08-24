import { mount } from '@vue/test-utils'
import AppHeader from '~/components/AppHeader.vue'

describe('AppHeader', () => {
  it('renders the brand name and nav links', () => {
    const wrapper = mount(AppHeader, {
      global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } }
    })

    expect(wrapper.text()).toContain('LEARN UP ACADEMY')
    expect(wrapper.text()).toContain('Accueil')
    expect(wrapper.text()).toContain('Blog')
  })
})
