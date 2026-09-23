import { DOMWrapper, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, Suspense } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGeolocation } from '~/composables/useGeolocation'
import HomePage from '~/pages/index.vue'

const seoMock = vi.fn()
const headMock = vi.fn()
const navigateMock = vi.fn()
const geoFetchMock = vi.fn().mockResolvedValue([])

vi.stubGlobal('useContentSeo', seoMock)
vi.stubGlobal('useHead', headMock)
vi.stubGlobal('navigateTo', navigateMock)
vi.stubGlobal('$fetch', geoFetchMock)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))

vi.mock('~/composables/useCatalog', () => ({
  upcomingSessions: (c: { sessions?: unknown[] }) => c.sessions ?? [],
  mapCourse: (c: { slug: string; title: string; familySlug?: string | null }) => ({
    slug: c.slug,
    title: c.title,
    family: c.familySlug ?? 'Autre',
    meta: '',
    to: c.familySlug ? `/formations/${c.familySlug}/${c.slug}` : null
  }),
  useCatalog: vi.fn(async () => ({
    data: ref({
      items: [
        { slug: 'formation-1', title: 'Formation 1', familySlug: 'management' },
        { slug: 'formation-2', title: 'Formation 2', familySlug: 'sante' },
        { slug: 'formation-3', title: 'Formation 3', familySlug: 'finance' },
        { slug: 'formation-4', title: 'Formation 4', familySlug: 'informatique' }
      ],
      total: 15,
      page: 1,
      pages: 4
    }),
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn()
  }))
}))

const directusCentres = ref([
  {
    slug: 'creteil',
    name: 'Centre de Créteil',
    city: 'Créteil',
    department: '94',
    region: 'Île-de-France',
    specialties: ['CACES', 'SST'],
    latitude: 48.7909,
    longitude: 2.4534
  },
  {
    slug: 'lyon',
    name: 'Centre de Lyon',
    city: 'Lyon',
    department: '69',
    region: 'Auvergne-Rhône-Alpes',
    specialties: ['Hauteur'],
    latitude: 45.764,
    longitude: 4.8357
  },
  {
    slug: 'lille',
    name: 'Centre de Lille',
    city: 'Lille',
    department: '59',
    region: 'Hauts-de-France',
    specialties: ['Incendie'],
    latitude: 50.6292,
    longitude: 3.0573
  }
])

const directusArticles = ref([
  {
    id: 1,
    status: 'published',
    slug: 'article-1',
    title: 'Article 1',
    excerpt: 'Extrait article 1',
    category: 'Réglementation',
    publish_at: '2026-01-01T00:00:00.000Z',
    cover_image: 'cover-1'
  },
  {
    id: 2,
    status: 'published',
    slug: 'article-2',
    title: 'Article 2',
    excerpt: 'Extrait article 2',
    category: 'Conseil',
    publish_at: '2026-01-02T00:00:00.000Z',
    cover_image: 'cover-2'
  },
  {
    id: 3,
    status: 'published',
    slug: 'article-3',
    title: 'Article 3',
    excerpt: 'Extrait article 3',
    category: 'Formation',
    publish_at: '2026-01-03T00:00:00.000Z',
    cover_image: 'cover-3'
  }
])

vi.stubGlobal(
  'useDirectusList',
  vi.fn(async (_collection: string, _cacheKey: string) =>
    _collection === 'articles' ? directusArticles : directusCentres
  )
)

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  SearchInput: {
    props: ['modelValue', 'suggestions'],
    emits: ['update:modelValue', 'submit', 'input'],
    template:
      '<span><input v-bind="$attrs" :value="modelValue" @input="$emit(\'input\', $event.target.value)" @keydown.enter="$emit(\'submit\', $event.target.value)" /><datalist v-if="suggestions"><option v-for="s in suggestions" :key="s" :value="s" /></datalist><slot name="action" /></span>'
  },
  NetworkCard: {
    props: ['title', 'to'],
    template: '<div class="network-card">{{ title }}<a class="network-cta" :href="to" /></div>'
  },
  FormationCard: {
    props: ['title', 'to'],
    template: '<div class="formation-card">{{ title }}<a class="formation-cta" :href="to" /></div>'
  },
  CenterCard: {
    props: ['name', 'to', 'distance'],
    template:
      '<div class="center-card">{{ name }} <span class="centre-distance">{{ distance }}</span><a class="centre-cta" :href="to" /></div>'
  },
  ConfierCard: { props: ['title'], template: '<div class="confier-card">{{ title }}</div>' },
  StatItem: {
    props: ['value', 'label'],
    template: '<div class="stat">{{ value }} {{ label }}</div>'
  },
  TestimonialCard: { props: ['author'], template: '<div class="testimonial">{{ author }}</div>' },
  ArticleCard: { props: ['title'], template: '<div class="article">{{ title }}</div>' },
  IconSparkle: true,
  IconSearch: true,
  ProcessSteps: true
}

const Host = defineComponent({
  setup: () => () => h(Suspense, () => h(HomePage))
})

async function mountPage() {
  const wrapper = mount(Host, { global: { stubs } })
  await new Promise((r) => setTimeout(r, 0))
  return wrapper
}

describe('pages/index', () => {
  beforeEach(() => {
    // État géo partagé au niveau module : reset entre tests. `navigator`
    // sans `permissions` : happy-dom résoudrait `granted`, ce qui court-
    // circuite le dialog de consentement (permission déjà accordée).
    vi.stubGlobal('navigator', {})
    const geo = useGeolocation()
    geo.clear()
    geo.permission.value = null
    geoFetchMock.mockReset().mockResolvedValue([])
    navigateMock.mockReset()
  })

  it('affiche le hero et les sections principales', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('orchestrés')
    expect(wrapper.text()).toContain('Construisons ensemble le réseau Learn Up Academy')
    expect(wrapper.text()).toContain('Comment ça marche')
    expect(wrapper.text()).toContain('Nos formations')
    expect(wrapper.text()).toContain('Le réseau Learn Up Academy')
    expect(wrapper.text()).toContain('Confier mes formations')
    expect(wrapper.text()).toContain("Ce qu'en disent les entreprises")
    expect(wrapper.text()).toContain('Actualités')
  })

  it('rend les cartes réseau, formations, centres et articles', async () => {
    const wrapper = await mountPage()

    expect(wrapper.findAll('.network-card')).toHaveLength(3)
    expect(wrapper.findAll('.formation-card')).toHaveLength(4)
    // La fixture contient 3 centres : l'affichage est plafonné à 2.
    expect(wrapper.findAll('.center-card')).toHaveLength(2)
    expect(wrapper.findAll('.confier-card')).toHaveLength(9)
    expect(wrapper.findAll('.stat')).toHaveLength(4)
    expect(wrapper.findAll('.testimonial')).toHaveLength(3)
    expect(wrapper.findAll('.article')).toHaveLength(3)
  })

  it('pointe les CTA vers la page de demande et le catalogue', async () => {
    const wrapper = await mountPage()
    const links = wrapper.findAll('a')
    const hrefs = links.map((l) => l.attributes('href'))

    expect(hrefs).toContain('/centres/demande-de-formation')
    expect(hrefs).toContain('/centres/demande-de-formation?sujet=franchise')
    expect(hrefs).toContain('/referencer-mon-organisme')
    expect(hrefs).toContain('/centres/demande-de-formation?sujet=formateur')
    expect(hrefs).toContain('/parler-a-votre-conseiller')
    expect(hrefs).toContain('/formations')
    expect(hrefs).toContain('/centres')
  })

  it('le badge « Près de moi » déclenche la géolocalisation et affiche les distances réelles', async () => {
    const getCurrentPosition = vi.fn(
      (success: (pos: { coords: { latitude: number; longitude: number } }) => void) => {
        success({ coords: { latitude: 48.7909, longitude: 2.4534 } })
      }
    )
    const originalNavigator = globalThis.navigator
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })

    try {
      const wrapper = await mountPage()

      // Jamais automatique : clic badge → dialog → « Autoriser la géolocalisation ».
      // Le Dialog reka-ui est téléporté dans document.body.
      expect(getCurrentPosition).not.toHaveBeenCalled()
      await wrapper.find('button[aria-label="Activer la géolocalisation"]').trigger('click')
      await nextTick()
      const confirmEl = [...document.body.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Autoriser la géolocalisation')
      )
      expect(confirmEl, 'le dialog de consentement doit être ouvert').toBeTruthy()
      await new DOMWrapper(confirmEl!).trigger('click')
      await nextTick()

      expect(getCurrentPosition).toHaveBeenCalled()
      // Position = Créteil : la carte affiche la distance réelle, pas ville·dept.
      expect(wrapper.findAll('.centre-distance')[0]!.text()).toMatch(/à .*(km|m)/)
    } finally {
      vi.stubGlobal('navigator', originalNavigator)
    }
  })

  it('envoie la recherche carte en query q vers /centres', async () => {
    const wrapper = await mountPage()

    const input = wrapper.find('input[input-id="map-search"]')
    await input.setValue('vitry')
    await input.trigger('keydown.enter')

    expect(navigateMock).toHaveBeenCalledWith({ path: '/centres', query: { q: 'vitry' } })
  })

  it('autocomplète la recherche carte et soumet le terme de la suggestion', async () => {
    geoFetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.endsWith('/communes')
          ? [{ nom: 'Lyon', codeDepartement: '69', centre: { coordinates: [4.8357, 45.764] } }]
          : []
      )
    )
    const wrapper = await mountPage()
    vi.useFakeTimers()

    try {
      const input = wrapper.find('input[input-id="map-search"]')
      await input.setValue('lyon')
      await vi.advanceTimersByTimeAsync(250)

      expect(wrapper.findAll('datalist option').map((o) => o.attributes('value'))).toContain(
        'Lyon (69)'
      )

      await input.setValue('Lyon (69)')
      await input.trigger('keydown.enter')

      expect(navigateMock).toHaveBeenCalledWith({ path: '/centres', query: { q: 'Lyon' } })
    } finally {
      vi.useRealTimers()
    }
  })

  it('une suggestion département part en query dept vers /centres', async () => {
    geoFetchMock.mockImplementation((url: string) =>
      Promise.resolve(url.endsWith('/departements') ? [{ code: '76', nom: 'Seine-Maritime' }] : [])
    )
    const wrapper = await mountPage()
    vi.useFakeTimers()

    try {
      const input = wrapper.find('input[input-id="map-search"]')
      await input.setValue('seine')
      await vi.advanceTimersByTimeAsync(250)

      await input.setValue('Seine-Maritime (département 76)')
      await input.trigger('keydown.enter')

      expect(navigateMock).toHaveBeenCalledWith({
        path: '/centres',
        query: { dept: 'Seine-Maritime' }
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('définit le SEO et le JSON-LD', async () => {
    await mountPage()

    expect(seoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        seo_title: 'LEARN UP ACADEMY — Plateforme de conseil en formation professionnelle'
      }),
      'LEARN UP ACADEMY'
    )
    expect(headMock).toHaveBeenCalledWith(expect.objectContaining({ script: expect.any(Array) }))
    const ldJson = headMock.mock.calls[0]![0].script[0].innerHTML
    expect(JSON.parse(ldJson)['@graph']).toHaveLength(2)
  })
})
