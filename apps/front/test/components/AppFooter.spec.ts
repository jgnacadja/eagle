import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import AppFooter from '~/components/Menu/AppFooter.vue'

vi.mock('~/composables/useMenuData', async () => {
  const { ref } = await import('vue')
  return {
    useMenuFamilles: () => ref([]),
    useMenuLegalPages: () =>
      ref([
        { slug: 'mentions-legales', label: 'Mentions légales', showInTabs: true },
        { slug: 'confidentialite', label: 'Politique de confidentialité', showInTabs: true }
      ])
  }
})

describe('AppFooter', () => {
  it('renders the brand name and the current year', () => {
    const wrapper = mount(AppFooter, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          Logo: { template: '<svg></svg>' },
          LogoWhite: { template: '<svg></svg>' }
        }
      }
    })
    const year = new Date().getFullYear()

    expect(wrapper.find('[aria-label="LEARN UP ACADEMY — Accueil"]').exists()).toBe(true)
    expect(wrapper.text()).toContain(String(year))
  })
})
