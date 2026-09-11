import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, Suspense } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import HomePage from '~/pages/index.vue'

const seoMock = vi.fn()
const headMock = vi.fn()
const navigateMock = vi.fn()

vi.stubGlobal('useContentSeo', seoMock)
vi.stubGlobal('useHead', headMock)
vi.stubGlobal('navigateTo', navigateMock)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))

vi.mock('~/composables/useCatalog', () => ({
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
    specialties: ['CACES', 'SST']
  },
  {
    slug: 'lyon',
    name: 'Centre de Lyon',
    city: 'Lyon',
    department: '69',
    region: 'Auvergne-Rhône-Alpes',
    specialties: ['Hauteur']
  },
  {
    slug: 'lille',
    name: 'Centre de Lille',
    city: 'Lille',
    department: '59',
    region: 'Hauts-de-France',
    specialties: ['Incendie']
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
    props: ['modelValue'],
    emits: ['update:modelValue', 'submit'],
    template: '<input :value="modelValue" @keydown.enter="$emit(\'submit\', \'vitry\')" />'
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
    props: ['name', 'to'],
    template: '<div class="center-card">{{ name }}<a class="centre-cta" :href="to" /></div>'
  },
  ConfierCard: { props: ['title'], template: '<div class="confier-card">{{ title }}</div>' },
  StatItem: {
    props: ['value', 'label'],
    template: '<div class="stat">{{ value }} {{ label }}</div>'
  },
  TestimonialCard: { props: ['author'], template: '<div class="testimonial">{{ author }}</div>' },
  ArticleCard: { props: ['title'], template: '<div class="article">{{ title }}</div>' },
  IconSparkle: true,
  IconSearch: true
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
    expect(hrefs).toContain('/centres/demande-de-formation?sujet=organisme')
    expect(hrefs).toContain('/centres/demande-de-formation?sujet=formateur')
    expect(hrefs).toContain('/formations')
    expect(hrefs).toContain('/centres')
  })

  it('envoie la recherche carte en query q vers /centres', async () => {
    const wrapper = await mountPage()

    await wrapper.find('input[input-id="map-search"]').trigger('keydown.enter')

    expect(navigateMock).toHaveBeenCalledWith({ path: '/centres', query: { q: 'vitry' } })
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
