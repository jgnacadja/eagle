import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, isRef, reactive, ref, Suspense, toValue, watch } from 'vue'
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
    region: 'ile-de-france',
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
  },
  {
    id: 7,
    status: 'published',
    slug: 'qualiopi-renouvellement',
    title: 'Renouvellement Qualiopi',
    excerpt: 'Audit de renouvellement.',
    content: null,
    category: 'Vie du réseau',
    region: 'bretagne',
    publish_at: '2026-08-27T00:00:00.000Z',
    cover_image: null
  },
  {
    id: 8,
    status: 'published',
    slug: 'session-travaux-hauteur',
    title: 'Nouvelle session travaux en hauteur',
    excerpt: 'Une session supplémentaire.',
    content: null,
    category: 'Nouvelles formations',
    region: null,
    publish_at: '2026-08-26T00:00:00.000Z',
    cover_image: null
  }
]

interface MockCommand {
  path: string
  params?: {
    aggregate?: Record<string, unknown>
    groupBy?: string[]
    limit?: number
    filter?: {
      _and?: Array<Record<string, Record<string, string>>>
    }
  }
}

type Article = (typeof articles)[number]
type ArticleFilter = NonNullable<NonNullable<MockCommand['params']>['filter']>

function applyFilter(items: Article[], filter: ArticleFilter | undefined): Article[] {
  return items.filter((item) =>
    (filter?._and ?? []).every((condition) => {
      if (condition.status) return item.status === condition.status._eq
      if (condition.slug) return item.slug !== condition.slug._neq
      if (condition.category) return item.category === condition.category._eq
      if (condition.region) return item.region === condition.region._eq
      return true
    })
  )
}

const route = reactive({ path: '/actualites', query: {} as Record<string, string> })

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useContentSeo', seoMock)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.stubGlobal('useRoute', () => route)
vi.stubGlobal(
  'navigateTo',
  vi.fn(async (to: { query?: Record<string, string> }) => {
    if (to.query) route.query = to.query
  })
)
vi.stubGlobal('useDirectusClient', () => ({
  request: vi.fn(async (command: () => MockCommand) => {
    const { params } = command()
    if (params?.aggregate) {
      if (params.groupBy) {
        return articles.map((article) => ({
          category: article.category,
          region: article.region,
          count: '1'
        }))
      }
      return [{ count: String(applyFilter(articles, params.filter).length) }]
    }
    if (params?.limit === 1) return [articles[0]]
    return applyFilter(articles, params?.filter)
  })
}))
// Stub du composable de soumission : le mock contrôle le résultat de l'appel API.
const leadSubmitMock = vi.fn<(endpoint: string, payload: unknown) => Promise<boolean>>()
const leadError = ref<string | null>(null)
vi.stubGlobal('useLeadSubmit', () => ({
  submit: leadSubmitMock,
  sending: ref(false),
  error: leadError
}))

vi.stubGlobal('useAsyncData', async (key: unknown, handler: () => Promise<unknown>) => {
  const data = ref(await handler())
  if (typeof key === 'function' || isRef(key)) {
    watch(
      () => toValue(key as Parameters<typeof toValue>[0]),
      async () => {
        data.value = await handler()
      }
    )
  }
  return { data, pending: ref(false), error: ref(null), refresh: vi.fn() }
})

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
    route.query = {}
    vi.clearAllMocks()
    leadSubmitMock.mockReset().mockResolvedValue(true)
    leadError.value = null
  })

  it('affiche le bandeau d’intro avec le titre et les filtres', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('ACTUALITÉS DU RÉSEAU')
    expect(wrapper.text()).toContain('Réglementation, formations et vie du réseau')
    expect(wrapper.text()).toContain('Toutes les régions')
    expect(wrapper.text()).toContain('Île-de-France')
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
    expect(
      wrapper
        .find('section[aria-label="Dernières actualités"]')
        .findAll('a[href="/actualites/recyclage-caces-echeances-2027"]')
    ).toHaveLength(0)
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

  it('filtre les articles par catégorie via la query', async () => {
    const wrapper = await mountPage()

    const buttons = wrapper.findAll('nav[aria-label] button')
    const reglementation = buttons.find((b) => b.text() === 'Réglementation & obligations')
    await reglementation!.trigger('click')
    await flushPromises()

    expect(route.query.category).toBe('Réglementation & obligations')
    expect(wrapper.text()).toContain('Habilitations électriques')
    expect(wrapper.text()).toContain('AIPR')
    expect(wrapper.text()).not.toContain('Nouveau plateau technique nacelles PEMP')
  })

  it('affiche la pagination quand le total dépasse la page', async () => {
    const wrapper = await mountPage()

    // 7 articles hors à-la-une > perPage (6) : la pagination est visible.
    expect(wrapper.find('nav[aria-label="Pagination des actualités"]').exists()).toBe(true)
  })

  it('affiche le bandeau newsletter avec le formulaire', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Recevez les échéances réglementaires')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.text()).toContain("S'abonner")
  })

  it('poste l’inscription newsletter au module leads puis confirme', async () => {
    const wrapper = await mountPage()

    await wrapper.find('input[type="email"]').setValue('abonne@site.fr')
    await wrapper.find('section[aria-labelledby="newsletter-heading"] form').trigger('submit')
    // vee-validate valide en async : attendre que handleSubmit appelle l'API.
    await vi.waitFor(() => expect(leadSubmitMock).toHaveBeenCalledTimes(1))

    expect(leadSubmitMock).toHaveBeenCalledWith(
      'newsletter',
      expect.objectContaining({ email: 'abonne@site.fr' })
    )
    expect(wrapper.text()).toContain('Inscription confirmée')
    // v-show : le formulaire reste monté mais masqué après confirmation.
    expect(wrapper.find('form').attributes('style')).toContain('display: none')
  })

  it('bloque la soumission et affiche l’erreur si l’e-mail est invalide', async () => {
    const wrapper = await mountPage()

    await wrapper.find('input[type="email"]').setValue('pas-un-email')
    await wrapper.find('section[aria-labelledby="newsletter-heading"] form').trigger('submit')
    // Attendre que la validation rejette et affiche l'erreur.
    await vi.waitFor(() => expect(wrapper.text()).toContain('Format d’e-mail invalide'))

    expect(leadSubmitMock).not.toHaveBeenCalled()
  })

  it('affiche l’erreur et garde le formulaire si l’inscription échoue', async () => {
    leadSubmitMock.mockResolvedValue(false)
    leadError.value = 'L’envoi a échoué — réessayez dans un instant.'
    const wrapper = await mountPage()

    await wrapper.find('input[type="email"]').setValue('abonne@site.fr')
    await wrapper.find('section[aria-labelledby="newsletter-heading"] form').trigger('submit')
    await vi.waitFor(() => expect(leadSubmitMock).toHaveBeenCalledTimes(1))
    await flushPromises()

    expect(wrapper.text()).toContain('envoi a échoué')
    expect(wrapper.text()).not.toContain('Inscription confirmée')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })

  it('applique le SEO de la page', async () => {
    await mountPage()

    expect(seoMock).toHaveBeenCalledWith(
      expect.objectContaining({ seo_title: 'Actualités — LEARN UP ACADEMY' }),
      'Actualités — LEARN UP ACADEMY'
    )
  })
})
