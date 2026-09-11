import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, ref, Suspense, watch } from 'vue'
import ActualitesPage from '~/pages/actualites/index.vue'

const seoMock = vi.fn()
const articles = [
  {
    id: 1,
    status: 'published',
    slug: 'recyclage-caces-echeances-2027',
    title: 'Recyclage CACES : échéance en 2027',
    excerpt: 'Les échéances de recyclage se rapprochent.',
    content: '<h2>Échéances</h2><p>À retenir.</p>',
    category: 'Réglementation & obligations',
    region: null,
    publish_at: '2026-09-02T00:00:00.000Z',
    cover_image: null
  },
  {
    id: 2,
    status: 'published',
    slug: 'plateau-technique-pemp',
    title: 'Nouveau plateau technique nacelles PEMP à Créteil',
    excerpt: 'Un nouveau plateau.',
    content: null,
    category: 'Nouvelles formations',
    region: null,
    publish_at: '2026-09-01T00:00:00.000Z',
    cover_image: null
  },
  {
    id: 3,
    status: 'published',
    slug: 'centre-cergy',
    title: 'Un nouveau centre ouvre à Cergy-Pontoise',
    excerpt: 'Un nouveau centre.',
    content: null,
    category: 'Vie du réseau',
    region: null,
    publish_at: '2026-08-31T00:00:00.000Z',
    cover_image: null
  },
  {
    id: 4,
    status: 'published',
    slug: 'habilitations-electriques',
    title: 'Habilitations électriques',
    excerpt: 'Habilitations.',
    content: null,
    category: 'Réglementation & obligations',
    region: null,
    publish_at: '2026-08-30T00:00:00.000Z',
    cover_image: null
  },
  {
    id: 5,
    status: 'published',
    slug: 'mac-sst',
    title: 'MAC SST',
    excerpt: 'MAC SST.',
    content: null,
    category: 'Nouvelles formations',
    region: null,
    publish_at: '2026-08-29T00:00:00.000Z',
    cover_image: null
  },
  {
    id: 6,
    status: 'published',
    slug: 'aipr-portes-ouvertes',
    title: 'AIPR',
    excerpt: 'Portes ouvertes.',
    content: null,
    category: 'Réglementation & obligations',
    region: null,
    publish_at: '2026-08-28T00:00:00.000Z',
    cover_image: null
  }
]

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useContentSeo', seoMock)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.stubGlobal('useDirectusClient', () => ({ request: vi.fn(async () => articles) }))
vi.stubGlobal('useAsyncData', async (_key: string, handler: () => Promise<unknown>) => ({
  data: ref(await handler()),
  pending: ref(false),
  error: ref(null),
  refresh: vi.fn()
}))

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  NuxtImg: { props: ['src', 'alt'], template: '<img :src="src" :alt="alt" />' },
  LoadError: { template: '<div><slot /></div>' },
  Button: { template: '<button><slot /></button>' },
  Card: { template: '<div><slot /></div>' },
  ArticleCard: {
    props: ['category', 'title', 'date', 'excerpt', 'imageLabel', 'to'],
    template:
      '<article><p>{{ category }} · {{ date }}</p><h3><a :href="to">{{ title }}</a></h3><p>{{ excerpt }}</p></article>'
  },
  Input: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  Label: { template: '<label><slot /></label>' },
  Select: { template: '<div><slot /></div>' },
  SelectTrigger: { template: '<button type="button"><slot /></button>' },
  SelectContent: { template: '<div><slot /></div>' },
  SelectItem: { props: ['value'], template: '<span><slot /></span>' },
  SelectValue: { props: ['placeholder'], template: '<span>{{ placeholder }}</span>' },
  Pagination: { template: '<nav><slot /></nav>' },
  PaginationContent: {
    template: '<ul><slot :items="[]" /></ul>'
  },
  PaginationItem: true,
  PaginationEllipsis: true,
  PaginationPrevious: true,
  PaginationNext: true
}

async function mountPage() {
  const Host = defineComponent({
    render() {
      return h(Suspense, () => h(ActualitesPage))
    }
  })
  const wrapper = mount(Host, { global: { stubs } })
  await flushPromises()
  return wrapper
}

describe('pages/actualites/index', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le bandeau d’intro avec le titre et les filtres', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('ACTUALITÉS DU RÉSEAU')
    expect(wrapper.text()).toContain('Réglementation, formations et vie du réseau')
    expect(wrapper.text()).toContain('Toutes les régions')
    expect(wrapper.text()).toContain('Réglementation & obligations')
    expect(wrapper.text()).toContain('Nouvelles formations')
    expect(wrapper.text()).toContain('Vie du réseau')
  })

  it('affiche l’article à la une avec son lien', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('À la une')
    expect(wrapper.text()).toContain('Recyclage CACES')
    const link = wrapper.find('a[href="/actualites/recyclage-caces-echeances-2027"]')
    expect(link.exists()).toBe(true)
  })

  it('affiche la grille d’articles', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Nouveau plateau technique nacelles PEMP à Créteil')
    expect(wrapper.text()).toContain('Un nouveau centre ouvre à Cergy-Pontoise')
    expect(wrapper.text()).toContain('Habilitations électriques')
    expect(wrapper.text()).toContain('MAC SST')
    expect(wrapper.text()).toContain('AIPR')
    expect(wrapper.text()).toContain('Portes ouvertes')
  })

  it('filtre les articles par catégorie', async () => {
    const wrapper = await mountPage()

    const buttons = wrapper.findAll('nav[aria-label] button')
    const reglementation = buttons.find((b) => b.text() === 'Réglementation & obligations')
    await reglementation!.trigger('click')

    expect(wrapper.text()).toContain('Habilitations électriques')
    expect(wrapper.text()).toContain('AIPR')
    expect(wrapper.text()).not.toContain('Nouveau plateau technique nacelles PEMP')
  })

  it('charge tous les articles au clic sur "Afficher plus"', async () => {
    const wrapper = await mountPage()

    const button = wrapper.findAll('button').find((b) => b.text() === "Afficher plus d'articles")
    expect(button).toBeTruthy()

    await button!.trigger('click')

    expect(wrapper.findAll('button').some((b) => b.text() === "Afficher plus d'articles")).toBe(
      false
    )
  })

  it('affiche le bandeau newsletter avec le formulaire', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Recevez les échéances réglementaires')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.text()).toContain("S'abonner")
  })

  it('applique le SEO de la page', async () => {
    await mountPage()

    expect(seoMock).toHaveBeenCalledWith(
      expect.objectContaining({ seo_title: 'Actualités — LEARN UP ACADEMY' }),
      'Actualités — LEARN UP ACADEMY'
    )
  })
})
