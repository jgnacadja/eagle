import type { Course, CourseListItem, FamilleFormation } from '@learnup/types'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, ref, Suspense, watch, watchEffect } from 'vue'
import LoadError from '~/components/ErrorState/LoadError.vue'
import NotFound from '~/components/ErrorState/NotFound.vue'
import FormationPage from '~/pages/formations/[famille]/[slug].vue'

const family: FamilleFormation = {
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
}

const course: Course = {
  id: 1,
  slug: 'caces-r489-chariots-elevateurs',
  title: 'CACES R489 — chariots élévateurs',
  description: 'Conduite de chariots élévateurs.',
  durationDays: 3,
  durationHours: 21,
  price: 1500,
  cpf: true,
  cpfCode: 'CPF-123',
  certification: 'Certification CACES',
  certifierName: 'Opérateur réglementaire',
  category: null,
  familySlug: 'caces-conduite-engins',
  centerSlug: 'creteil',
  centerSlugs: ['creteil'],
  modalities: ['inter', 'presentiel'],
  sessions: [
    {
      id: 'sess-1',
      startDate: '2026-10-12',
      endDate: '2026-10-14',
      modality: 'presentiel',
      seatsRemaining: 5,
      location: {
        name: 'Centre de Créteil',
        city: 'Créteil',
        postalCode: '94000',
        department: 'Val-de-Marne',
        region: 'Île-de-France',
        centreSlug: 'creteil'
      }
    }
  ],
  imageUrl: null,
  generatedProgramUrl: 'https://digiforma.example/program/caces-r489',
  status: 'published',
  targets: ['Caristes, conducteurs d engins'],
  prerequisites: ['Aucun prérequis particulier'],
  evaluation: ['Épreuve pratique de conduite'],
  blocks: [
    {
      name: 'Conduite sécurisée',
      description: '<p>Les fondamentaux.</p>',
      durationInHours: 14,
      goals: [{ text: 'Manœuvrer en sécurité' }, { text: 'Respecter les consignes' }]
    },
    {
      name: 'Vérifications quotidiennes',
      description: '<p>Contrôles obligatoires.</p>',
      durationInHours: 7,
      goals: [{ text: 'Réaliser les vérifications' }]
    }
  ],
  seoTitle: 'CACES R489 — chariots élévateurs',
  seoDescription: 'Formation CACES R489.',
  seoCanonical: null,
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-20T10:00:00.000Z'
}

const similar: CourseListItem[] = [
  {
    ...course,
    id: 1
  } as CourseListItem,
  {
    id: 2,
    slug: 'caces-r490-grues-chargement',
    title: 'CACES R490 — grues de chargement',
    description: 'Conduite de grues.',
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
  },
  {
    id: 3,
    slug: 'caces-r486-pemp',
    title: 'CACES R486 — PEMP',
    description: 'Conduite de PEMP.',
    durationDays: 3,
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
  },
  {
    id: 4,
    slug: 'caces-r489m',
    title: 'CACES R489 — maintenance',
    description: 'Maintenance.',
    durationDays: 1,
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
  params: { famille: string; slug: string }
  query: Record<string, string>
  path: string
  meta: Record<string, unknown>
}

let routeMock: RouteMock
const navigateToMock = vi.fn()
const setResponseStatusMock = vi.fn()
const useContentSeoMock = vi.fn()
const headMock = vi.fn()

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('watchEffect', watchEffect)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.stubGlobal('useRoute', () => routeMock)
vi.stubGlobal('useRouter', () => ({ replace: vi.fn() }))
vi.stubGlobal('useContentSeo', useContentSeoMock)
vi.stubGlobal('useHead', headMock)
vi.stubGlobal('useRequestEvent', () => undefined)
vi.stubGlobal('setResponseStatus', setResponseStatusMock)
vi.stubGlobal('navigateTo', navigateToMock)
vi.stubGlobal('logServerError', vi.fn())

vi.mock('@vueuse/core', () => ({
  useElementSize: () => ({ height: { value: 0 } })
}))

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
      let items = [...similar]
      if (q.family && typeof q.family === 'string') {
        items = items.filter((c) => c.familySlug === q.family)
      }
      if (q.slugToExclude && typeof q.slugToExclude === 'string') {
        items = items.filter((c) => c.slug !== q.slugToExclude)
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
  buildSessionBadge: vi.fn(() => null),
  upcomingSessions: (course: { sessions?: { startDate?: string | null }[] | null }) => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    return (course.sessions ?? []).filter(
      (s) => s.startDate && new Date(`${s.startDate}T00:00:00Z`) >= today
    )
  }
}))

vi.mock('~/composables/useDirectus', () => ({
  useDirectusClient: () => ({ request: vi.fn() })
}))

vi.stubGlobal('useAsyncData', async (key: string) => {
  if (
    routeMock?.query.error === '1' &&
    key === `course-${routeMock.params.famille}-${routeMock.params.slug}`
  ) {
    return { data: ref(null), pending: ref(false), error: ref(new Error('down')), refresh: vi.fn() }
  }
  if (key === 'course-caces-conduite-engins-caces-r489-chariots-elevateurs') {
    return { data: ref(course), pending: ref(false), error: ref(null), refresh: vi.fn() }
  }
  if (key === 'famille-name-caces-conduite-engins') {
    return { data: ref(family), pending: ref(false), error: ref(null), refresh: vi.fn() }
  }
  if (key === 'course-caces-conduite-engins-inconnu') {
    return { data: ref(null), pending: ref(false), error: ref(null), refresh: vi.fn() }
  }
  if (key === 'famille-name-inconnue') {
    return { data: ref(null), pending: ref(false), error: ref(null), refresh: vi.fn() }
  }
  return { data: ref(null), pending: ref(false), error: ref(null), refresh: vi.fn() }
})

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  Button: { template: '<button><slot /></button>' },
  Badge: { template: '<span><slot /></span>' },
  Card: { template: '<div><slot /></div>' },
  CardHeader: { template: '<div><slot /></div>' },
  CardContent: { template: '<div><slot /></div>' },
  CardTitle: { template: '<h3><slot /></h3>' },
  CardDescription: { template: '<p><slot /></p>' },
  CardFooter: { template: '<div><slot /></div>' },
  CenterFormationCard: {
    props: ['title', 'family'],
    template: '<div class="similaire-card">{{ family }} — {{ title }}</div>'
  },
  CtaBanner: { template: '<div><slot /></div>' },
  SearchInput: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'submit'],
    template: '<button class="search-stub" @click="$emit(\'submit\', \'caces\')" />'
  },
  LoadError,
  NotFound,
  SessionCard: {
    props: ['title', 'meta', 'places'],
    template: '<div class="session-card">{{ title }} — {{ meta }} — {{ places }}</div>'
  },
  IconMapPin: true,
  IconDownload: true,
  IconCheck: true,
  IconAward: true,
  IconLink: true,
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
      return h(Suspense, () => h(FormationPage))
    }
  })
  const wrapper = mount(Host, { global: { stubs } })
  await flushPromises()
  return wrapper
}

describe('pages/formations/[famille]/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeMock = {
      params: { famille: 'caces-conduite-engins', slug: 'caces-r489-chariots-elevateurs' },
      query: {},
      path: '/formations/caces-conduite-engins/caces-r489-chariots-elevateurs',
      meta: {}
    }
  })

  it('affiche la fiche formation', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('CACES R489 — chariots élévateurs')
    expect(wrapper.text()).toContain('À propos de cette formation')
    expect(wrapper.text()).toContain('Objectifs pédagogiques')
    expect(wrapper.text()).toContain('Manœuvrer en sécurité')
    expect(wrapper.text()).toContain('Programme')
    expect(wrapper.text()).toContain('Conduite sécurisée')
    expect(wrapper.text()).toContain('Formations similaires')
    expect(wrapper.findAll('.similaire-card')).toHaveLength(similar.length - 1)
    expect(wrapper.text()).toContain('Voir les sessions')
  })

  it('restaure les sections sessions, lieux et modalités/évaluation', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Prochaines sessions')
    expect(wrapper.findAll('.session-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('Session en présentiel')
    expect(wrapper.text()).toContain('Où suivre cette formation')
    expect(wrapper.find('a[href="/centres/creteil"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Modalités & évaluation')
    expect(wrapper.text()).toContain('Épreuve pratique de conduite')
  })

  it('définit le SEO et le JSON-LD Course', async () => {
    await mountPage()

    const [source, fallback] = seoArgs()
    expect(source).toEqual(
      expect.objectContaining({
        seo_title: 'CACES R489 — chariots élévateurs'
      })
    )
    expect(fallback).toBe('CACES R489 — chariots élévateurs')

    const headArgs = headMock.mock.calls[0]![0]
    const scripts = headArgs.script.value ?? headArgs.script
    const ldJson = scripts[0].innerHTML
    const parsed = JSON.parse(ldJson)
    expect(parsed['@type']).toBe('Course')
    expect(parsed.name).toBe(course.title)
  })

  it('affiche l’état indisponible et adapte breadcrumb/SEO pour un slug inconnu', async () => {
    routeMock.params.slug = 'inconnu'
    routeMock.path = '/formations/caces-conduite-engins/inconnu'
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain("Cette formation n'est pas disponible.")
    expect(routeMock.meta.breadcrumb).toEqual([
      { label: 'Accueil', to: '/' },
      { label: 'Formations', to: '/formations' },
      { label: 'Formation indisponible' }
    ])

    const [source, fallback] = seoArgs()
    expect(source).toEqual(
      expect.objectContaining({
        seo_title: 'Formation indisponible',
        seo_noindex: true
      })
    )
    expect(fallback).toBe('Formation indisponible')
  })

  it('affiche l’état indisponible pour une famille inconnue', async () => {
    routeMock.params.famille = 'inconnue'
    routeMock.params.slug = 'caces-r489-chariots-elevateurs'
    routeMock.path = '/formations/inconnue/caces-r489-chariots-elevateurs'
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain("Cette formation n'est pas disponible.")
  })

  it('affiche l’état erreur quand le chargement échoue', async () => {
    routeMock.query = { error: '1' }
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain("Le contenu n'a pas pu être chargé.")
    expect(routeMock.meta.breadcrumb).toEqual([
      { label: 'Accueil', to: '/' },
      { label: 'Formations', to: '/formations' },
      { label: 'Erreur de chargement' }
    ])

    const [source, fallback] = seoArgs()
    expect(source).toEqual(
      expect.objectContaining({
        seo_title: 'Erreur de chargement',
        seo_noindex: true
      })
    )
    expect(fallback).toBe('Erreur de chargement')
  })

  it('« Réessayer » retire le paramètre ?error=1 au lieu de relancer un appel voué à échouer', async () => {
    routeMock.query = { error: '1', autre: 'x' }
    const wrapper = await mountPage()

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Réessayer'))!
      .trigger('click')

    expect(navigateToMock).toHaveBeenCalledWith({
      path: routeMock.path,
      query: { autre: 'x' }
    })
  })

  it('la recherche de l’état indisponible redirige vers /formations avec la requête', async () => {
    routeMock.params.slug = 'inconnu'
    routeMock.path = '/formations/caces-conduite-engins/inconnu'
    const wrapper = await mountPage()

    await wrapper.find('.search-stub').trigger('click')

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/formations',
      query: { q: 'caces' }
    })
  })
})
