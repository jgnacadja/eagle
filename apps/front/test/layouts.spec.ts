import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import DefaultLayout from '~/layouts/default.vue'
import WithBreadcrumbLayout from '~/layouts/with-breadcrumb.vue'

const routeStub = { meta: {} as Record<string, unknown> }
vi.stubGlobal('useRoute', () => routeStub)

const stubs = {
  AppHeader: { template: '<header>header</header>' },
  AppFooter: { template: '<footer>footer</footer>' },
  Breadcrumbs: { props: ['items'], template: '<nav>{{ items.length }} items</nav>' }
}

describe('layouts/default', () => {
  it('affiche header, slot et footer', () => {
    const wrapper = mount(DefaultLayout, {
      slots: { default: '<p>contenu</p>' },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('header')
    expect(wrapper.text()).toContain('contenu')
    expect(wrapper.text()).toContain('footer')
  })
})

describe('layouts/with-breadcrumb', () => {
  it('affiche le fil d’Ariane quand route.meta.breadcrumb est renseigné', () => {
    routeStub.meta = {
      breadcrumb: [{ label: 'Accueil', to: '/' }, { label: 'Mentions légales' }]
    }
    const wrapper = mount(WithBreadcrumbLayout, {
      slots: { default: '<p>contenu</p>' },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('2 items')
    expect(wrapper.find('section').classes()).toContain('bg-surface')
  })

  it('applique la couleur de route.meta.layoutProps', () => {
    routeStub.meta = {
      breadcrumb: [{ label: 'Accueil', to: '/' }],
      layoutProps: { color: 'bg-paper' }
    }
    const wrapper = mount(WithBreadcrumbLayout, { global: { stubs } })
    expect(wrapper.find('section').classes()).toContain('bg-paper')
  })

  it('masque la section sans breadcrumb', () => {
    routeStub.meta = {}
    const wrapper = mount(WithBreadcrumbLayout, { global: { stubs } })
    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('ignore un breadcrumb non tableau', () => {
    routeStub.meta = { breadcrumb: 'x' }
    const wrapper = mount(WithBreadcrumbLayout, { global: { stubs } })
    expect(wrapper.find('section').exists()).toBe(false)
  })
})
