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

const mountFooter = () =>
  mount(AppFooter, {
    global: {
      stubs: {
        NuxtLink: {
          props: ['to'],
          computed: {
            href() {
              if (typeof this.to === 'string') return this.to
              const query = new URLSearchParams(this.to.query).toString()
              return query ? `${this.to.path}?${query}` : this.to.path
            }
          },
          template: '<a :href="href"><slot /></a>'
        },
        Logo: { template: '<svg></svg>' },
        LogoWhite: { template: '<svg></svg>' }
      }
    }
  })

describe('AppFooter', () => {
  it('renders the brand name and the current year', () => {
    const wrapper = mountFooter()
    const year = new Date().getFullYear()

    expect(wrapper.find('[aria-label="LEARN UP ACADEMY — Accueil"]').exists()).toBe(true)
    expect(wrapper.text()).toContain(String(year))
  })

  it('links Rejoindre entries to the matching candidature voie', () => {
    const wrapper = mountFooter()
    const links = wrapper.findAll('a')

    const franchise = links.find((l) => l.text() === 'Devenir franchisé')
    const formateur = links.find((l) => l.text() === 'Formateur indépendant')

    expect(franchise?.attributes('href')).toBe('/rejoindre-le-reseau?voie=centre')
    expect(formateur?.attributes('href')).toBe('/rejoindre-le-reseau?voie=formateur')
  })

  it('links Qui sommes-nous to home and Contact to the advisor page', () => {
    const wrapper = mountFooter()
    const links = wrapper.findAll('a')

    expect(links.find((l) => l.text() === 'Qui sommes-nous')?.attributes('href')).toBe('/')
    expect(links.find((l) => l.text() === 'Contact')?.attributes('href')).toBe(
      '/parler-a-votre-conseiller'
    )
  })
})
