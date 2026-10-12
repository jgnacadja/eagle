import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import DefaultLayout from '~/layouts/default.vue'
import WithBreadcrumbLayout from '~/layouts/with-breadcrumb.vue'

const routeStub = { meta: {} as Record<string, unknown>, path: '/mentions-legales/' }
vi.stubGlobal('useRoute', () => routeStub)
const headMock = vi.fn()
vi.stubGlobal('useHead', headMock)
vi.stubGlobal('useRequestURL', () => new URL('https://learnup.test/mentions-legales/'))

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

  it('émet le BreadcrumbList JSON-LD miroir du fil affiché', () => {
    routeStub.meta = {
      breadcrumb: [
        { label: 'Accueil', to: '/' },
        { label: 'Actualités', to: '/actualites/' },
        { label: 'Mon article' }
      ]
    }
    mount(WithBreadcrumbLayout, { global: { stubs } })

    const head = headMock.mock.calls.at(-1)![0] as {
      value: { script: { innerHTML: string; type: string }[] }
    }
    const script = head.value.script[0]!
    expect(script.type).toBe('application/ld+json')
    const ld = JSON.parse(script.innerHTML) as {
      '@type': string
      itemListElement: { position: number; name: string; item: string }[]
    }
    expect(ld['@type']).toBe('BreadcrumbList')
    expect(ld.itemListElement.map((i) => i.item)).toEqual([
      'https://learnup.test/',
      'https://learnup.test/actualites/',
      'https://learnup.test/mentions-legales/'
    ])
  })

  it('n’émet pas de BreadcrumbList sans fil d’Ariane', () => {
    routeStub.meta = {}
    mount(WithBreadcrumbLayout, { global: { stubs } })
    const head = headMock.mock.calls.at(-1)![0] as { value: { script: unknown[] } }
    expect(head.value.script).toHaveLength(0)
  })
})
