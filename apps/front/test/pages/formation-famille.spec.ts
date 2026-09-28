import type { CourseListItem, FamilleFormation, SousFamilleFormation } from '@learnup/types'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, ref, Suspense, watch, watchEffect } from 'vue'
import LoadError from '~/components/ErrorState/LoadError.vue'
import NotFound from '~/components/ErrorState/NotFound.vue'
import FamillePage from '~/pages/formations/[famille]/index.vue'

const family: FamilleFormation = {
  id: 1,
  slug: 'caces-conduite-engins',
  name: "CACES & conduite d'engins",
  status: 'published',
  intro: '<p>Conduite d’engins de manutention.</p>',
  icon: null,
  image: null,
  seo_title: 'CACES & conduite d’engins — LEARN UP ACADEMY',
  seo_description: 'Formations CACES.',
  seo_canonical: null,
  subnav_title: "Parcourir par type d'engin",
  audience_text:
    "Tout salarié amené à conduire un engin de la famille concernée : caristes, conducteurs d'engins de chantier, opérateurs nacelle, grutiers.",
  validity_text:
    'Les CACES® de cette famille sont valables 5 ans (10 ans pour le R482). Le renouvellement passe par une formation de recyclage et de nouveaux tests.'
}

const sousFamilles: SousFamilleFormation[] = [
  {
    id: 1,
    status: 'published',
    slug: 'chariots',
    name: 'Chariots & gerbeurs',
    caption: 'R489 · R485',
    famille: 1
  },
  { id: 2, status: 'published', slug: 'grues', name: 'Grues & levage', caption: null, famille: 1 },
  // Sous-famille sans formation publiée — ne doit pas produire de carte
  // « 0 formation ».
  { id: 3, status: 'published', slug: 'nacelles', name: 'Nacelles', caption: null, famille: 1 }
]

const courses: CourseListItem[] = [
  {
    id: 1,
    slug: 'caces-r489-chariots-elevateurs',
    title: 'CACES R489 — chariots élévateurs',
    description: 'Conduite de chariots élévateurs.',
    durationDays: 3,
    durationHours: null,
    price: null,
    cpf: null,
    cpfCode: null,
    certification: 'Certification CACES',
    certifierName: 'Opérateur réglementaire',
    category: null,
    familySlug: 'caces-conduite-engins',
    subFamilySlug: 'chariots',
    subFamilyName: 'Chariots & gerbeurs',
    centerSlug: null,
    centerSlugs: [],
    modalities: ['presentiel'],
    sessions: null,
    image: null,
    imageUrl: null,
    generatedProgramUrl: null,
    status: 'published',
    seoTitle: null,
    seoDescription: null,
    seoCanonical: null
  },
  {
    id: 2,
    slug: 'caces-r490-grues-chargement',
    title: 'CACES R490 — grues de chargement',
    description: 'Conduite de grues de chargement.',
    durationDays: 5,
    durationHours: null,
    price: null,
    cpf: null,
    cpfCode: null,
    certification: 'Certification CACES',
    certifierName: null,
    category: null,
    familySlug: 'caces-conduite-engins',
    subFamilySlug: 'grues',
    subFamilyName: 'Grues & levage',
    centerSlug: null,
    centerSlugs: [],
    modalities: ['presentiel'],
    sessions: null,
    image: null,
    imageUrl: null,
    generatedProgramUrl: null,
    status: 'published',
    seoTitle: null,
    seoDescription: null,
    seoCanonical: null
  }
]

interface RouteMock {
  params: { famille: string }
  query: Record<string, string>
  path: string
  meta: Record<string, unknown>
}

let routeMock: RouteMock
const navigateToMock = vi.fn()
const setResponseStatusMock = vi.fn()
const useContentSeoMock = vi.fn()
const directusRequest = vi.fn()
const requestEvent = { name: 'event' }

const catalogState = vi.hoisted(() => ({
  pending: false,
  error: null as Error | null,
  empty: false,
  total: null as number | null,
  locations: {} as Record<string, number>,
  dataNull: false,
  toNull: false
}))

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('watchEffect', watchEffect)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.stubGlobal('useRoute', () => routeMock)
vi.stubGlobal('useRouter', () => ({ replace: vi.fn() }))
vi.stubGlobal('useContentSeo', useContentSeoMock)
vi.stubGlobal('useRequestEvent', () => requestEvent)
vi.stubGlobal('setResponseStatus', setResponseStatusMock)
vi.stubGlobal('navigateTo', navigateToMock)
vi.stubGlobal('logServerError', vi.fn())

const catalogMocks = vi.hoisted(() => {
  function mapCourse(course: CourseListItem, familyName?: string) {
    return {
      slug: course.slug,
      title: course.title,
      family: familyName ?? course.familySlug ?? 'Autre',
      familyKey: course.familySlug ?? 'autre',
      subFamily: course.subFamilyName ?? null,
      description: course.description ?? '',
      meta: `${course.durationDays} jours`,
      days: course.durationDays ?? 0,
      duration: 'moyenne',
      certifications: [],
      to: catalogState.toNull
        ? null
        : course.familySlug
          ? `/formations/${course.familySlug}/${course.slug}`
          : null
    }
  }

  return {
    useCatalog: vi.fn((query) => {
      const data = computed(() => {
        if (catalogState.dataNull) return null
        const q = 'value' in query ? query.value : query
        let items = catalogState.empty ? [] : [...courses]
        if (q.family && typeof q.family === 'string') {
          items = items.filter((c) => c.familySlug === q.family)
        }
        // Facettes calculées avant le filtre subFamily (sémantique de
        // facettage : une dimension ignore son propre filtre).
        const subFamilies: Record<string, number> = {}
        const modalities: Record<string, number> = {}
        for (const c of items) {
          if (c.subFamilySlug)
            subFamilies[c.subFamilySlug] = (subFamilies[c.subFamilySlug] ?? 0) + 1
          for (const m of c.modalities ?? []) modalities[m] = (modalities[m] ?? 0) + 1
        }
        if (q.subFamily && typeof q.subFamily === 'string') {
          items = items.filter((c) => c.subFamilySlug === q.subFamily)
        }
        if (Array.isArray(q.modalities) && q.modalities.length) {
          items = items.filter((c) => (c.modalities ?? []).some((m) => q.modalities!.includes(m)))
        }
        return {
          items,
          total: catalogState.total ?? items.length,
          page: q.page ?? 1,
          pageSize: q.limit ?? 9,
          facets: {
            families: {},
            subFamilies,
            modalities,
            durations: {},
            locations: catalogState.locations,
            cpf: 0,
            certifying: 0
          }
        }
      })
      return {
        data,
        pending: computed(() => catalogState.pending),
        error: computed(() => catalogState.error),
        refresh: vi.fn()
      }
    }),
    mapCourse
  }
})

vi.mock('~/composables/useCatalog', () => ({
  useCatalog: catalogMocks.useCatalog,
  mapCourse: catalogMocks.mapCourse,
  buildDuration: vi.fn(),
  buildMeta: vi.fn(),
  buildCertifications: vi.fn(),
  buildSessionBadge: vi.fn(() => null)
}))

vi.mock('~/composables/useDirectus', () => ({
  useDirectusClient: () => ({ request: directusRequest })
}))

vi.stubGlobal('useDirectusList', async (_collection: string, key: string) =>
  ref(key.startsWith('sous-familles-') ? sousFamilles : [])
)

vi.stubGlobal(
  'useAsyncData',
  async (
    key: string,
    handler: () => Promise<unknown>,
    options?: {
      getCachedData?: (key: string, nuxtApp: unknown, ctx: { cause?: string }) => unknown
    }
  ) => {
    const nuxtApp = { isHydrating: true, payload: { data: {} }, static: { data: {} } }
    options?.getCachedData?.(key, nuxtApp, { cause: 'initial' })
    options?.getCachedData?.(key, { ...nuxtApp, isHydrating: false }, { cause: 'navigation' })
    try {
      const data = await handler()
      return { data: ref(data), pending: ref(false), error: ref(null), refresh: vi.fn() }
    } catch (error) {
      return { data: ref(null), pending: ref(false), error: ref(error), refresh: vi.fn() }
    }
  }
)

const stubs = {
  NuxtLink: { template: '<a><slot /></a>' },
  Button: { template: '<button><slot /></button>' },
  SubFamilyCard: {
    props: ['name', 'caption'],
    emits: ['select'],
    template:
      '<div class="subfamily-card"><h3>{{ name }}</h3><p>{{ caption }}</p>' +
      '<button @click="$emit(\'select\')">Voir la sous-famille →</button></div>'
  },
  Badge: { template: '<span><slot /></span>' },
  CenterFormationCard: {
    props: ['title', 'subFamily'],
    template: '<div class="formation-card">{{ subFamily }} — {{ title }}</div>'
  },
  CtaBanner: { template: '<div><slot /></div>' },
  SearchInput: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'submit'],
    template:
      '<button class="search-stub" @click="$emit(\'submit\', \'caces\')" />' +
      '<button class="search-empty" @click="$emit(\'submit\', \'\')" />'
  },
  Select: {
    emits: ['update:modelValue'],
    template:
      '<button class="select-stub" @click="$emit(\'update:modelValue\', \'intra\')"><slot /></button>'
  },
  SelectTrigger: { template: '<span><slot /></span>' },
  SelectContent: { template: '<span><slot /></span>' },
  SelectItem: { props: ['value'], template: '<span><slot /></span>' },
  Pagination: {
    name: 'Pagination',
    props: ['total', 'page', 'itemsPerPage'],
    emits: ['update:page'],
    template: '<nav><button class="page-btn" @click="$emit(\'update:page\', 2)" /><slot /></nav>'
  },
  PaginationContent: { template: '<span><slot :items="[]" /></span>' },
  PaginationPrevious: true,
  PaginationItem: true,
  PaginationEllipsis: true,
  PaginationNext: true,
  LoadError,
  NotFound,
  IconSearchMinus: true,
  IconFileOff: true,
  IconRefresh: true,
  IconSparkle: true
}

function seoArgs() {
  const [source, fallback] = useContentSeoMock.mock.calls[0]!
  const resolve = (v: unknown) => (typeof v === 'function' ? (v as () => unknown)() : v)
  return [resolve(source), resolve(fallback)] as const
}

async function mountPage() {
  const Host = defineComponent({
    render() {
      return h(Suspense, () => h(FamillePage))
    }
  })
  const wrapper = mount(Host, { global: { stubs } })
  await flushPromises()
  return wrapper
}

describe('pages/formations/[famille]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeMock = {
      params: { famille: 'caces-conduite-engins' },
      query: {},
      path: '/formations/caces-conduite-engins',
      meta: {}
    }
    catalogState.pending = false
    catalogState.error = null
    catalogState.empty = false
    catalogState.total = null
    catalogState.locations = {}
    catalogState.dataNull = false
    catalogState.toNull = false
    family.image = null
    family.seo_description = 'Formations CACES.'
    family.seo_title = 'CACES & conduite d’engins — LEARN UP ACADEMY'
    family.subnav_title = "Parcourir par type d'engin"
    family.audience_text =
      "Tout salarié amené à conduire un engin de la famille concernée : caristes, conducteurs d'engins de chantier, opérateurs nacelle, grutiers."
    family.validity_text =
      'Les CACES® de cette famille sont valables 5 ans (10 ans pour le R482). Le renouvellement passe par une formation de recyclage et de nouveaux tests.'
    directusRequest.mockResolvedValue([family])
  })

  it('affiche la famille et la liste de formations', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain("CACES & conduite d'engins")
    expect(wrapper.text()).toContain('Conduite d’engins de manutention.')
    expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)
    expect(wrapper.text()).toContain('CACES R489 — chariots élévateurs')
    expect(wrapper.text()).toContain('CACES R490 — grues de chargement')
  })

  it('affiche les cartes informations public concerné et validité', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Qui est concerné ?')
    expect(wrapper.text()).toContain('Validité et renouvellement')
    expect(wrapper.text()).toContain('Tout salarié amené à conduire un engin')
    expect(wrapper.text()).toContain('valables 5 ans')
  })

  it('affiche la section sous-familles et filtre la liste via les cartes', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain("Parcourir par type d'engin")
    expect(wrapper.findAll('.subfamily-card')).toHaveLength(2)
    expect(wrapper.text()).toContain('Chariots & gerbeurs')
    expect(wrapper.text()).toContain('R489 · R485')
    expect(wrapper.text()).toContain('Grues & levage')
    expect(wrapper.text()).not.toContain('Nacelles')
    expect(wrapper.text()).not.toContain('0 formation')
    expect(wrapper.findAll('.formation-card')).toHaveLength(2)

    const buttons = wrapper
      .findAll('button')
      .filter((b) => b.text().includes('Voir la sous-famille'))
    await buttons[0]!.trigger('click')
    await flushPromises()

    const cards = wrapper.findAll('.formation-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.text()).toContain('Chariots & gerbeurs')
  })

  it('définit le breadcrumb et le SEO', async () => {
    await mountPage()

    expect(routeMock.meta.breadcrumb).toEqual([
      { label: 'Accueil', to: '/' },
      { label: 'Formations', to: '/formations' },
      { label: "CACES & conduite d'engins" }
    ])

    const [source, fallback] = seoArgs()
    expect(source).toEqual(
      expect.objectContaining({
        seo_title: 'CACES & conduite d’engins — LEARN UP ACADEMY'
      })
    )
    expect(fallback).toBe("CACES & conduite d'engins — Formations | LEARN UP ACADEMY")
  })

  it('affiche l’état introuvable et adapte breadcrumb/SEO pour un slug inconnu', async () => {
    directusRequest.mockResolvedValue([])

    routeMock.params.famille = 'famille-inconnue'
    routeMock.path = '/formations/famille-inconnue'
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain("Cette famille de formations n'est pas disponible.")
    expect(routeMock.meta.breadcrumb).toEqual([
      { label: 'Accueil', to: '/' },
      { label: 'Formations', to: '/formations' },
      { label: 'Famille introuvable' }
    ])

    const [source, fallback] = seoArgs()
    expect(source).toEqual(
      expect.objectContaining({
        seo_title: 'Famille introuvable',
        seo_noindex: true
      })
    )
    expect(fallback).toBe('Famille introuvable')
  })

  it('affiche l’état erreur quand le chargement échoue', async () => {
    directusRequest.mockRejectedValue(new Error('down'))

    const wrapper = await mountPage()

    expect(wrapper.text()).toContain("Le contenu n'a pas pu être chargé.")
  })

  it('la recherche de l’état introuvable redirige vers /formations avec la requête', async () => {
    directusRequest.mockResolvedValue([])

    routeMock.params.famille = 'famille-inconnue'
    routeMock.path = '/formations/famille-inconnue'
    const wrapper = await mountPage()

    await wrapper.find('.search-stub').trigger('click')

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/formations',
      query: { q: 'caces' }
    })
  })

  it('passe le statut 404 quand la famille est introuvable', async () => {
    directusRequest.mockResolvedValue([])
    routeMock.params.famille = 'famille-inconnue'
    routeMock.path = '/formations/famille-inconnue'
    await mountPage()

    expect(setResponseStatusMock).toHaveBeenCalledWith(requestEvent, 404, 'Famille introuvable')
  })

  it('passe le statut 500 quand le chargement échoue', async () => {
    directusRequest.mockRejectedValue(new Error('down'))
    await mountPage()

    expect(setResponseStatusMock).toHaveBeenCalledWith(
      requestEvent,
      500,
      'Erreur de chargement de la famille'
    )
  })

  it('retry() relance le chargement hors ?error=1', async () => {
    directusRequest.mockRejectedValue(new Error('down'))
    const wrapper = await mountPage()

    wrapper.findComponent(LoadError).vm.$emit('retry')
    await flushPromises()

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(catalogMocks.useCatalog.mock.results[1]?.value.refresh).toBeDefined()
  })

  it('retry() nettoie la query ?error=1', async () => {
    directusRequest.mockRejectedValue(new Error('down'))
    routeMock.query = { error: '1', autre: 'x' }
    const wrapper = await mountPage()

    wrapper.findComponent(LoadError).vm.$emit('retry')
    await flushPromises()

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/formations/caces-conduite-engins',
      query: { autre: 'x' }
    })
  })

  it('affiche le skeleton pendant le chargement du catalogue', async () => {
    catalogState.pending = true
    const wrapper = await mountPage()

    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.formation-card')).toHaveLength(0)
  })

  it('affiche l’erreur du catalogue', async () => {
    catalogState.error = new Error('boom')
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain("Le catalogue n'a pas pu être chargé")
  })

  it('filtre par modalité puis « Réinitialiser » restaure la liste', async () => {
    const wrapper = await mountPage()

    const selects = wrapper.findAll('.select-stub')
    await selects[1]!.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.formation-card')).toHaveLength(0)
    expect(wrapper.text()).toContain('Aucune formation ne correspond à ces critères')

    const reset = wrapper.findAll('button').find((b) => b.text().includes('Réinitialiser'))
    await reset!.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)
  })

  it('badge « Sessions ce mois-ci » prioritaire dans le hero', async () => {
    const { buildSessionBadge } = await import('~/composables/useCatalog')
    vi.mocked(buildSessionBadge).mockReturnValue('Sessions ce mois-ci')
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Sessions ce mois-ci')
    vi.mocked(buildSessionBadge).mockReturnValue(null)
  })

  it('badge session secondaire « programmées » dans le hero', async () => {
    const { buildSessionBadge } = await import('~/composables/useCatalog')
    vi.mocked(buildSessionBadge).mockReturnValue('Sessions programmées')
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Sessions programmées')
    vi.mocked(buildSessionBadge).mockReturnValue(null)
  })

  it('affiche l’image hero quand la famille en a une', async () => {
    family.image = 'hero-file-id'
    const wrapper = await mountPage()

    expect(wrapper.find('figure img').exists()).toBe(true)
  })

  it('retombe sur la description SEO générique sans seo_description', async () => {
    family.seo_description = null
    await mountPage()

    const [source] = seoArgs()
    expect((source as { seo_description?: string }).seo_description).toContain(
      'en centre ou sur site'
    )
  })

  it('rend le select localisation et met à jour les filtres', async () => {
    catalogState.locations = { creteil: 2, lyon: 1 }
    const wrapper = await mountPage()

    const selects = wrapper.findAll('.select-stub')
    for (const select of selects) await select.trigger('click')
    await flushPromises()

    // Sous-famille + modalité + localisation + disponibilité.
    expect(selects.length).toBeGreaterThanOrEqual(4)
  })

  it('appelle refresh sur « Réinitialiser » quand rien n’a changé', async () => {
    catalogState.empty = true
    const wrapper = await mountPage()

    const reset = wrapper.findAll('button').find((b) => b.text().includes('Réinitialiser'))
    await reset!.trigger('click')
    await flushPromises()

    const refreshes = catalogMocks.useCatalog.mock.results.map((r) => r.value.refresh)
    expect(refreshes.some((r) => r.mock.calls.length > 0)).toBe(true)
  })

  it('change de page via la pagination', async () => {
    catalogState.total = 30
    const wrapper = await mountPage()

    await wrapper.find('.page-btn').trigger('click')
    await flushPromises()

    expect(wrapper.findComponent({ name: 'Pagination' }).props('page')).toBe(2)
  })

  it('retombe sur les valeurs par défaut quand le catalogue ne renvoie aucune donnée', async () => {
    catalogState.dataNull = true
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Aucune formation ne correspond')
  })

  it('passe une cible indéfinie à la carte formation sans slug de famille', async () => {
    catalogState.toNull = true
    const wrapper = await mountPage()

    expect(wrapper.findAll('.formation-card').length).toBeGreaterThan(0)
  })

  it('lit la sous-famille depuis la query de l’URL', async () => {
    routeMock.query = { subFamily: 'grues' }
    await mountPage()

    const queries = catalogMocks.useCatalog.mock.calls.map((c) => {
      const q = c[0] as { value?: { subFamily?: string }; subFamily?: string }
      return 'value' in q && q.value !== undefined ? q.value.subFamily : q.subFamily
    })
    expect(queries).toContain('grues')
  })

  it('construit le titre SEO générique sans seo_title', async () => {
    family.seo_title = null
    await mountPage()

    const [source] = seoArgs()
    expect((source as { seo_title: string }).seo_title).toContain('— Formations | LEARN UP ACADEMY')
  })

  it('affiche le bloc infos avec seulement la validité', async () => {
    family.audience_text = null
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('valables 5 ans')
    expect(wrapper.text()).not.toContain('Tout salarié')
  })

  it('masque le bloc infos sans audience ni validité', async () => {
    family.audience_text = null
    family.validity_text = null
    const wrapper = await mountPage()

    expect(wrapper.text()).not.toContain('valables 5 ans')
  })

  it('retombe sur le titre de sous-navigation générique', async () => {
    family.subnav_title = null
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Parcourir par sous-famille')
  })

  it('retombe sur le libellé brut pour une modalité inconnue', async () => {
    courses.push({
      ...courses[0]!,
      slug: 'caces-x',
      title: 'CACES X',
      modalities: ['telepresence']
    })
    try {
      const wrapper = await mountPage()
      expect(wrapper.text()).toContain('telepresence')
    } finally {
      courses.pop()
    }
  })

  it('la recherche vide redirige sans query', async () => {
    directusRequest.mockResolvedValue([])
    const wrapper = await mountPage()

    await wrapper.find('.search-empty').trigger('click')
    await flushPromises()

    expect(navigateToMock).toHaveBeenCalledWith({ path: '/formations', query: {} })
  })

  it('réessaie le chargement du catalogue sur retry', async () => {
    catalogState.error = new Error('down')
    const wrapper = await mountPage()

    await wrapper.findComponent(LoadError).vm.$emit('retry')
    await flushPromises()

    const refreshes = catalogMocks.useCatalog.mock.results.map((r) => r.value.refresh)
    expect(refreshes.some((r) => r.mock.calls.length > 0)).toBe(true)
  })

  it('retombe sur une liste vide sans sous-familles', async () => {
    vi.stubGlobal('useDirectusList', async () => ref(null))
    const wrapper = await mountPage()

    expect(wrapper.findAll('.subfamily-card').length).toBe(0)
  })
})
