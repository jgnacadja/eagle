import type { CourseListItem, FamilleFormation } from '@learnup/types'
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
  seo_canonical: null
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

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('watchEffect', watchEffect)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.stubGlobal('useRoute', () => routeMock)
vi.stubGlobal('useRouter', () => ({ replace: vi.fn() }))
vi.stubGlobal('useContentSeo', useContentSeoMock)
vi.stubGlobal('useRequestEvent', () => undefined)
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
      const q = 'value' in query ? query.value : query
      let items = [...courses]
      if (q.family && typeof q.family === 'string') {
        items = items.filter((c) => c.familySlug === q.family)
      }
      const data = computed(() => ({
        items: items.map((c) => mapCourse(c, family.name)),
        total: items.length,
        page: q.page ?? 1,
        pageSize: q.limit ?? 9
      }))
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
  if (key === `famille-caces-conduite-engins`) {
    return { data: ref(family), pending: ref(false), error: ref(null), refresh: vi.fn() }
  }
  return { data: ref(null), pending: ref(false), error: ref(null), refresh: vi.fn() }
})

const stubs = {
  NuxtLink: { template: '<a><slot /></a>' },
  Button: { template: '<button><slot /></button>' },
  Badge: { template: '<span><slot /></span>' },
  CenterFormationCard: {
    props: ['title', 'family'],
    template: '<div class="formation-card">{{ family }} — {{ title }}</div>'
  },
  CtaBanner: { template: '<div><slot /></div>' },
  SearchInput: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'submit'],
    template: '<button class="search-stub" @click="$emit(\'submit\', \'caces\')" />'
  },
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
  })

  it('affiche la famille et la liste de formations', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain("CACES & conduite d'engins")
    expect(wrapper.text()).toContain('Conduite d’engins de manutention.')
    expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)
    expect(wrapper.text()).toContain('CACES R489 — chariots élévateurs')
    expect(wrapper.text()).toContain('CACES R490 — grues de chargement')
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
    vi.stubGlobal('useAsyncData', async (key: string) => {
      if (key === 'famille-famille-inconnue') {
        return { data: ref(null), pending: ref(false), error: ref(null), refresh: vi.fn() }
      }
      return { data: ref(null), pending: ref(false), error: ref(null), refresh: vi.fn() }
    })

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
    vi.stubGlobal('useAsyncData', async (key: string) => {
      if (key === 'famille-caces-conduite-engins') {
        return {
          data: ref(null),
          pending: ref(false),
          error: ref(new Error('down')),
          refresh: vi.fn()
        }
      }
      return { data: ref(null), pending: ref(false), error: ref(null), refresh: vi.fn() }
    })

    const wrapper = await mountPage()

    expect(wrapper.text()).toContain("Le contenu n'a pas pu être chargé.")
  })

  it('la recherche de l’état introuvable redirige vers /formations avec la requête', async () => {
    vi.stubGlobal('useAsyncData', async (key: string) => {
      if (key === 'famille-famille-inconnue') {
        return { data: ref(null), pending: ref(false), error: ref(null), refresh: vi.fn() }
      }
      return { data: ref(null), pending: ref(false), error: ref(null), refresh: vi.fn() }
    })

    routeMock.params.famille = 'famille-inconnue'
    routeMock.path = '/formations/famille-inconnue'
    const wrapper = await mountPage()

    await wrapper.find('.search-stub').trigger('click')

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/formations',
      query: { q: 'caces' }
    })
  })
})
