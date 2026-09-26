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
    cover_image: null as string | null
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
    cover_image: null as string | null
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
    cover_image: null as string | null
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
    cover_image: null as string | null
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
    cover_image: null as string | null
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
    cover_image: null as string | null
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
    cover_image: null as string | null
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
    cover_image: null as string | null
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

const directusRequestMock = vi.fn(async (command: () => MockCommand) => {
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

const asyncState = { pending: false, error: null as Error | null }

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
vi.stubGlobal('useDirectusClient', () => ({ request: directusRequestMock }))
// Stub du composable de soumission : le mock contrôle le résultat de l'appel API.
const leadSubmitMock = vi.fn<(endpoint: string, payload: unknown) => Promise<boolean>>()
const leadError = ref<string | null>(null)
const leadSending = ref(false)
vi.stubGlobal('useLeadSubmit', () => ({
  submit: leadSubmitMock,
  sending: leadSending,
  error: leadError
}))

vi.stubGlobal(
  'useAsyncData',
  async (
    key: unknown,
    handler: () => Promise<unknown>,
    options?: {
      getCachedData?: (key: unknown, nuxtApp: unknown, ctx: { cause?: string }) => unknown
    }
  ) => {
    const nuxtApp = { isHydrating: true, payload: { data: {} }, static: { data: {} } }
    options?.getCachedData?.(key, nuxtApp, { cause: 'initial' })
    options?.getCachedData?.(key, nuxtApp, { cause: 'navigation' })
    options?.getCachedData?.(key, { ...nuxtApp, isHydrating: false }, { cause: 'initial' })
    const listKey = typeof key === 'function' || isRef(key)
    const data = ref<unknown>(null)
    const error = ref<Error | null>(null)
    const run = async () => {
      try {
        data.value = await handler()
      } catch (e) {
        error.value = e as Error
      }
    }
    await run()
    if (listKey) {
      watch(() => toValue(key as Parameters<typeof toValue>[0]), run)
    }
    return {
      data,
      pending: computed(() => (listKey ? asyncState.pending : false)),
      error: computed(() => (listKey ? (error.value ?? asyncState.error) : null)),
      refresh: vi.fn()
    }
  }
)

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
  Select: {
    emits: ['update:modelValue'],
    template:
      '<button class="region-select" @click="$emit(\'update:modelValue\', \'bretagne\')"><slot /></button>'
  },
  SelectTrigger: { template: '<button type="button"><slot /></button>' },
  SelectContent: { template: '<div><slot /></div>' },
  SelectItem: { props: ['value'], template: '<span><slot /></span>' },
  SelectValue: { props: ['placeholder'], template: '<span>{{ placeholder }}</span>' },
  Pagination: {
    emits: ['update:page'],
    template: '<nav><button class="page-next" @click="$emit(\'update:page\', 2)" /><slot /></nav>'
  },
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
    leadSending.value = false
    asyncState.pending = false
    asyncState.error = null
    directusRequestMock.mockImplementation(async (command: () => MockCommand) => {
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

  it('affiche le squelette pendant le chargement', async () => {
    asyncState.pending = true
    const wrapper = await mountPage()

    expect(wrapper.find('[aria-label="Chargement des actualités"]').exists()).toBe(true)
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('affiche l’état erreur quand le chargement échoue', async () => {
    directusRequestMock.mockRejectedValue(new Error('down'))
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Vérifiez votre connexion, puis réessayez')
    expect(wrapper.text()).not.toContain('À la une')
  })

  it('dégrade les filtres quand l’agrégation échoue', async () => {
    directusRequestMock.mockImplementation(async (command: () => MockCommand) => {
      const { params } = command()
      if (params?.aggregate && params.groupBy) throw new Error('down')
      if (params?.aggregate) return [{ count: String(articles.length) }]
      if (params?.limit === 1) return [articles[0]]
      return articles
    })
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('ACTUALITÉS DU RÉSEAU')
    expect(wrapper.text()).toContain('Recyclage CACES')
  })

  it('affiche l’image de couverture de l’article à la une', async () => {
    articles[0]!.cover_image = 'cover-id'
    const wrapper = await mountPage()

    expect(wrapper.find('img[alt="Recyclage CACES : échéance en 2027"]').exists()).toBe(true)
    articles[0]!.cover_image = null
  })

  it('affiche l’état vide quand aucun article ne correspond', async () => {
    route.query = { category: 'Catégorie inexistante' }
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Aucun article ne correspond à ces filtres')
  })

  it('affiche « Envoi en cours… » pendant l’inscription newsletter', async () => {
    leadSending.value = true
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Envoi en cours…')
    expect(
      wrapper
        .findAll('button')
        .find((b) => b.text().includes('Envoi en cours'))!
        .attributes('disabled')
    ).toBeDefined()
  })

  it('pousse le filtre région dans l’URL', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.region-select').trigger('click')
    await flushPromises()

    expect(route.query.region).toBe('bretagne')
    expect(wrapper.text()).toContain('Renouvellement Qualiopi')
  })

  it('pousse la page dans l’URL via la pagination', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.page-next').trigger('click')
    await flushPromises()

    expect(route.query.page).toBe('2')
  })

  it('retombe sur les libellés par défaut pour un article sans catégorie ni extrait', async () => {
    const saved = { ...articles[1]! }
    Object.assign(articles[1]!, { category: null, excerpt: null })
    try {
      const wrapper = await mountPage()
      expect(wrapper.findAll('article').length).toBeGreaterThan(0)
    } finally {
      Object.assign(articles[1]!, saved)
    }
  })

  it('se passe d’article à la une quand la requête est vide', async () => {
    directusRequestMock.mockImplementation(async (command: () => MockCommand) => {
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
      if (params?.limit === 1) return []
      return applyFilter(articles, params?.filter)
    })

    const wrapper = await mountPage()

    expect(wrapper.text()).not.toContain('À la une')
  })

  it('dégrade les filtres quand les facettes sont null', async () => {
    const original = (globalThis as Record<string, unknown>).useAsyncData as (
      key: unknown,
      handler?: () => Promise<unknown>,
      options?: unknown
    ) => Promise<unknown>
    vi.stubGlobal(
      'useAsyncData',
      async (key: unknown, handler?: () => Promise<unknown>, options?: unknown) => {
        if (key === 'actualites-facets') {
          return { data: ref(null), pending: ref(false), error: ref(null), refresh: vi.fn() }
        }
        return original(key, handler, options)
      }
    )

    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Filtrer par région')
  })

  it('retombe sur un total nul quand le comptage renvoie vide', async () => {
    directusRequestMock.mockImplementation(async (command: () => MockCommand) => {
      const { params } = command()
      if (params?.aggregate) {
        if (params.groupBy) {
          return articles.map((article) => ({
            category: article.category,
            region: article.region,
            count: '1'
          }))
        }
        return []
      }
      if (params?.limit === 1) return [articles[0]]
      return applyFilter(articles, params?.filter)
    })

    const wrapper = await mountPage()

    expect(wrapper.text()).not.toContain('page')
  })

  it('retombe sur les listes vides quand la liste est null', async () => {
    const original = (globalThis as Record<string, unknown>).useAsyncData as (
      key: unknown,
      handler?: () => Promise<unknown>,
      options?: unknown
    ) => Promise<unknown>
    vi.stubGlobal(
      'useAsyncData',
      async (key: unknown, handler?: () => Promise<unknown>, options?: unknown) => {
        const resolved = toValue(key as Parameters<typeof toValue>[0])
        if (typeof resolved === 'string' && resolved.startsWith('actualites-list')) {
          return { data: ref(null), pending: ref(false), error: ref(null), refresh: vi.fn() }
        }
        return original(key, handler, options)
      }
    )

    const wrapper = await mountPage()

    expect(wrapper.findAll('article')).toHaveLength(0)
  })
})
