import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, onErrorCaptured, ref, Suspense, watchEffect } from 'vue'
import LegalSlugPage from '~/pages/[slug]/index.vue'

const requestMock = vi.fn()
const seoMock = vi.fn()
const routeStub = { params: { slug: 'mentions-legales' }, meta: {} as Record<string, unknown> }
const legalPages = ref([
  { slug: 'mentions-legales', label: 'Mentions légales', showInTabs: true },
  { slug: 'cookies', label: 'Cookies', showInTabs: false }
])
const capturedError = ref<unknown>()
let asyncDataOptions:
  { getCachedData?: (key: string, nuxtApp: unknown, ctx: { cause: string }) => unknown } | undefined

vi.mock('~/composables/useMenuData', () => ({ useMenuLegalPages: () => legalPages }))

vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('watchEffect', watchEffect)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useRoute', () => routeStub)
vi.stubGlobal('useDirectusClient', () => ({ request: requestMock }))
vi.stubGlobal('useContentSeo', seoMock)
vi.stubGlobal('logServerError', vi.fn())
vi.stubGlobal(
  'useAsyncData',
  async (_key: string, handler: () => Promise<unknown>, options?: typeof asyncDataOptions) => {
    asyncDataOptions = options
    try {
      return { data: ref(await handler()), error: ref(null) }
    } catch (error) {
      return { data: ref(null), error: ref(error) }
    }
  }
)
vi.stubGlobal('createError', (err: { statusCode: number; statusMessage: string }) => {
  const error = new Error(err.statusMessage) as Error & { statusCode: number }
  error.statusCode = err.statusCode
  return error
})

const stubs = {
  LegalPage: {
    name: 'LegalPage',
    props: ['page', 'tabs'],
    template: '<div class="legal-page">{{ page.title }}|{{ tabs.length }} tabs</div>'
  }
}

// Les erreurs lancées en async setup (createError 404/500) remontent via
// errorCaptured, pas via un throw synchrone de mount().
const Host = defineComponent({
  setup: () => {
    onErrorCaptured((error) => {
      capturedError.value = error
      return false
    })
    return () => h(Suspense, () => h(LegalSlugPage))
  }
})

const pageFixture = {
  slug: 'mentions-legales',
  label: 'Mentions légales',
  title: 'Mentions légales',
  updated_at: '2025-01-15T00:00:00Z',
  sections: [{ id: 's1', title: 'Éditeur', paragraphs: ['Paragraphe'], bullets: [] }],
  cta_label: null,
  cta_to: null,
  show_in_tabs: true
}

beforeEach(() => {
  requestMock.mockReset()
  seoMock.mockReset()
  capturedError.value = undefined
  routeStub.meta = {}
})

describe('pages/[slug] (pages légales)', () => {
  it('affiche la page légale et ses onglets', async () => {
    requestMock.mockResolvedValue([pageFixture])

    const wrapper = mount(Host, { global: { stubs } })
    await flushPromises()

    expect(requestMock).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Mentions légales')
    // Seule la page avec showInTabs passe dans les onglets.
    expect(wrapper.text()).toContain('1 tabs')
    // Le breadcrumb est posé dans route.meta pour le layout.
    expect(routeStub.meta.breadcrumb).toEqual([
      { label: 'Accueil', to: '/' },
      { label: 'Mentions légales' }
    ])
    expect(seoMock).toHaveBeenCalled()
  })

  it('expose les getters SEO résolus sur la page chargée', async () => {
    requestMock.mockResolvedValue([pageFixture])
    await mount(Host, { global: { stubs } })
    await flushPromises()

    const [source, fallback] = seoMock.mock.calls.at(-1)!
    expect((source as () => { title?: string })().title).toBe('Mentions légales')
    expect((fallback as () => string)()).toBe('Mentions légales — LEARN UP ACADEMY')
  })

  it('rejette avec une 500 quand le chargement échoue', async () => {
    requestMock.mockRejectedValue(new Error('down'))

    mount(Host, { global: { stubs } })
    await flushPromises()

    expect(capturedError.value).toMatchObject({ statusCode: 500 })
  })

  it('rejette avec une 404 quand la page est introuvable', async () => {
    requestMock.mockResolvedValue([])

    mount(Host, { global: { stubs } })
    await flushPromises()

    expect(capturedError.value).toMatchObject({ statusCode: 404 })
  })

  it('ne sert le payload SSR que pendant l’hydratation initiale', async () => {
    requestMock.mockResolvedValue([pageFixture])
    mount(Host, { global: { stubs } })
    await flushPromises()

    const nuxtApp = {
      isHydrating: true,
      payload: { data: { 'page-legale-mentions-legales': pageFixture } },
      static: { data: {} }
    }
    expect(
      asyncDataOptions!.getCachedData!('page-legale-mentions-legales', nuxtApp, {
        cause: 'initial'
      })
    ).toEqual(pageFixture)
    expect(
      asyncDataOptions!.getCachedData!('page-legale-mentions-legales', nuxtApp, { cause: 'watch' })
    ).toBeUndefined()
    expect(
      asyncDataOptions!.getCachedData!(
        'page-legale-mentions-legales',
        { ...nuxtApp, isHydrating: false },
        { cause: 'initial' }
      )
    ).toBeUndefined()
    // Repli vers les données statiques quand le payload n'a pas la clé.
    expect(
      asyncDataOptions!.getCachedData!(
        'page-legale-mentions-legales',
        {
          isHydrating: true,
          payload: { data: {} },
          static: { data: { 'page-legale-mentions-legales': pageFixture } }
        },
        { cause: 'initial' }
      )
    ).toEqual(pageFixture)
  })

  it('retombe sur created_at et les listes vides pour les champs manquants', async () => {
    requestMock.mockResolvedValue([
      {
        ...pageFixture,
        updated_at: null,
        created_at: '2024-06-01T00:00:00Z',
        sections: [
          { id: 's1', title: 'Sans contenu', paragraphs: null, bullets: null },
          { id: 's2', title: 'Avec contenu', paragraphs: ['p'], bullets: ['b'] }
        ]
      }
    ])
    const wrapper = mount(Host, { global: { stubs } })
    await flushPromises()

    const page = wrapper.findComponent({ name: 'LegalPage' }).props('page') as {
      sections: { paragraphs: unknown[]; bullets: unknown[] }[]
      lastUpdated: string
    }
    expect(page.sections[0]!.paragraphs).toEqual([])
    expect(page.sections[0]!.bullets).toEqual([])
    expect(page.sections[1]!.paragraphs).toEqual(['p'])
    expect(page.lastUpdated).toBeTruthy()
  })

  it('retombe sur une liste de sections vide quand sections est null', async () => {
    requestMock.mockResolvedValue([{ ...pageFixture, sections: null }])
    const wrapper = mount(Host, { global: { stubs } })
    await flushPromises()

    const page = wrapper.findComponent({ name: 'LegalPage' }).props('page') as {
      sections: unknown[]
    }
    expect(page.sections).toEqual([])
  })
})
