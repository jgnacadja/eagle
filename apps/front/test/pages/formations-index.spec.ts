import type { CourseListItem, FamilleFormation } from '@learnup/types'
import type { CatalogQuery } from '~/composables/useCatalog'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  ref,
  Suspense,
  toValue,
  watch,
  watchEffect,
  type MaybeRefOrGetter
} from 'vue'
import FormationsPage from '~/pages/formations/index.vue'

interface CatalogResult {
  items: CourseListItem[]
  total: number
  page: number
  pageSize: number
}

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
    centerSlug: null,
    centerSlugs: [],
    modalities: [],
    sessions: null,
    imageUrl: null,
    generatedProgramUrl: null,
    status: 'published',
    seoTitle: null,
    seoDescription: null,
    seoCanonical: null
  },
  {
    id: 2,
    slug: 'sst',
    title: 'SST — Sauveteur Secouriste du Travail',
    description: 'Gestes de premiers secours.',
    durationDays: 2,
    durationHours: null,
    price: null,
    cpf: null,
    cpfCode: null,
    certification: 'Certification SST',
    certifierName: null,
    category: null,
    familySlug: 'securite-prevention',
    centerSlug: null,
    centerSlugs: [],
    modalities: [],
    sessions: null,
    imageUrl: null,
    generatedProgramUrl: null,
    status: 'published',
    seoTitle: null,
    seoDescription: null,
    seoCanonical: null
  },
  {
    id: 3,
    slug: 'h0-b0',
    title: 'Habilitation électrique H0-B0',
    description: 'Risques électriques.',
    durationDays: 1,
    durationHours: null,
    price: null,
    cpf: null,
    cpfCode: null,
    certification: 'Habilitation électrique',
    certifierName: null,
    category: null,
    familySlug: 'habilitations-electriques',
    centerSlug: null,
    centerSlugs: [],
    modalities: [],
    sessions: null,
    imageUrl: null,
    generatedProgramUrl: null,
    status: 'published',
    seoTitle: null,
    seoDescription: null,
    seoCanonical: null
  }
]

const families: FamilleFormation[] = [
  {
    id: 1,
    slug: 'caces-conduite-engins',
    name: "CACES & conduite d'engins",
    status: 'published',
    intro: null,
    icon: null,
    image: null,
    seo_title: null,
    seo_description: null,
    seo_canonical: null
  },
  {
    id: 2,
    slug: 'securite-prevention',
    name: 'Sécurité & prévention',
    status: 'published',
    intro: null,
    icon: null,
    image: null,
    seo_title: null,
    seo_description: null,
    seo_canonical: null
  },
  {
    id: 3,
    slug: 'habilitations-electriques',
    name: 'Habilitations électriques',
    status: 'published',
    intro: null,
    icon: null,
    image: null,
    seo_title: null,
    seo_description: null,
    seo_canonical: null
  }
]

const counts = [
  { slug: 'caces-conduite-engins', count: 8 },
  { slug: 'securite-prevention', count: 5 },
  { slug: 'habilitations-electriques', count: 2 }
]

const routerReplace = vi.fn()
const useContentSeoMock = vi.fn()
let routeQuery: Record<string, string> = {}

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('watchEffect', watchEffect)
vi.stubGlobal('nextTick', nextTick)
vi.stubGlobal('onBeforeUnmount', onBeforeUnmount)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.stubGlobal('useRoute', () => ({ query: routeQuery, path: '/formations', meta: {} }))
vi.stubGlobal('useRouter', () => ({ replace: routerReplace }))
vi.stubGlobal('useContentSeo', useContentSeoMock)
vi.stubGlobal('logServerError', vi.fn())

const catalogMocks = vi.hoisted(() => {
  function filterCatalog(query: MaybeRefOrGetter<CatalogQuery>): CatalogResult {
    const q = toValue(query)
    let items = [...courses]

    if (q.search) {
      const needle = q.search.toLowerCase()
      items = items.filter((c) => c.title.toLowerCase().includes(needle))
    }
    if (q.family) {
      items = items.filter((c) => c.familySlug === q.family)
    }
    if (q.cpf === true) {
      items = items.filter((c) => c.cpf)
    }
    if (q.certifying === true) {
      items = items.filter((c) => c.certification)
    }

    const page = q.page ?? 1
    const limit = q.limit ?? 9
    const start = (page - 1) * limit

    return {
      items: items.slice(start, start + limit),
      total: items.length,
      page,
      pageSize: limit
    }
  }

  function mapCourse(course: CourseListItem, familyName?: string) {
    return {
      slug: course.slug,
      title: course.title,
      family: familyName ?? course.familySlug ?? 'Autre',
      familyKey: course.familySlug ?? 'autre',
      description: course.description ?? '',
      meta: `${course.durationDays} jours`,
      days: course.durationDays ?? 0,
      duration: 'moyenne',
      certifications: [],
      to: course.familySlug ? `/formations/${course.familySlug}/${course.slug}` : null
    }
  }

  return {
    useCatalog: vi.fn((query) => {
      const data = computed(() => filterCatalog(query))
      return { data, pending: ref(false), error: ref(null), refresh: vi.fn() }
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
  useDirectusClient: () => ({ request: vi.fn() })
}))

vi.stubGlobal('useAsyncData', async (key: string) => {
  if (key === 'catalog-families') {
    return { data: ref(families), pending: ref(false), error: ref(null), refresh: vi.fn() }
  }
  if (key === 'family-counts') {
    return { data: ref(counts), pending: ref(false), error: ref(null), refresh: vi.fn() }
  }
  return { data: ref(null), pending: ref(false), error: ref(null), refresh: vi.fn() }
})

const stubs = {
  NuxtLink: { template: '<a><slot /></a>' },
  Button: { template: '<button><slot /></button>' },
  Label: { template: '<label><slot /></label>' },
  SearchInput: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'submit'],
    template:
      '<span><input class="catalogue-search" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /><button class="search-go" @click="$emit(\'submit\', modelValue)" /></span>'
  },
  Select: { template: '<div><slot /></div>' },
  SelectTrigger: { template: '<span><slot /></span>' },
  SelectContent: { template: '<span><slot /></span>' },
  SelectItem: { props: ['value'], template: '<span><slot /></span>' },
  Checkbox: { template: '<input type="checkbox" />' },
  CatalogueFilters: true,
  CenterFormationCard: {
    props: ['title'],
    template: '<div class="formation-card">{{ title }}</div>'
  },
  Pagination: { template: '<nav><slot /></nav>' },
  PaginationContent: { template: '<span><slot :items="[]" /></span>' },
  PaginationPrevious: true,
  PaginationItem: true,
  PaginationEllipsis: true,
  PaginationNext: true,
  CtaBanner: { template: '<div><slot /></div>' },
  LoadError: { template: '<div>Load error</div>' },
  NotFound: { template: '<div>Not found</div>' },
  IconSparkle: true,
  IconFilter: true,
  IconClose: true,
  IconSearchMinus: true
}

async function mountPage() {
  const Host = defineComponent({
    render() {
      return h(Suspense, () => h(FormationsPage))
    }
  })
  const wrapper = mount(Host, { global: { stubs } })
  await flushPromises()
  return wrapper
}

describe('pages/formations/index', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeQuery = {}
  })

  it('affiche le catalogue complet', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Trouvez la formation adaptée')
    expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)
    expect(wrapper.text()).toContain(`${courses.length} formations`)
  })

  it('filtre les formations par la recherche', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.catalogue-search').setValue('sst')
    await wrapper.find('.search-go').trigger('click')
    await flushPromises()

    const cards = wrapper.findAll('.formation-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.text()).toContain('SST')
    expect(wrapper.text()).toContain('1 formation')
  })

  it('affiche l’état vide quand aucune formation ne correspond', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.catalogue-search').setValue('zzzzzz')
    await flushPromises()

    expect(wrapper.findAll('.formation-card')).toHaveLength(0)
    expect(wrapper.text()).toContain('Aucune formation ne correspond exactement')
  })

  it('« Réinitialiser les filtres » restaure le catalogue complet', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.catalogue-search').setValue('zzzzzz')
    await flushPromises()
    expect(wrapper.findAll('.formation-card')).toHaveLength(0)

    const reset = wrapper.findAll('button').find((b) => b.text().includes('Réinitialiser'))
    await reset!.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)
  })

  it('hydrate la recherche depuis ?q=', async () => {
    routeQuery = { q: 'sst' }
    const wrapper = await mountPage()

    const cards = wrapper.findAll('.formation-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.text()).toContain('SST')
  })

  it('définit le SEO du catalogue', async () => {
    await mountPage()

    expect(useContentSeoMock).toHaveBeenCalledWith(
      expect.objectContaining({ seo_title: 'Catalogue de formations — LEARN UP ACADEMY' }),
      'Catalogue de formations — LEARN UP ACADEMY'
    )
  })
})
