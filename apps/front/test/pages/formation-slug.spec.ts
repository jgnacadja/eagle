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
  subnav_title: "Parcourir par type d'engin",
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
  subFamilySlug: null,
  subFamilyName: null,
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
  image: null,
  imageUrl: null,
  generatedProgramUrl: 'https://digiforma.example/program/caces-r489',
  status: 'published',
  targets: ['Caristes, conducteurs d engins'],
  prerequisites: ['Aucun prérequis particulier'],
  pedagogy: [
    { title: 'Inter, en centre.', description: 'Sessions sur plateau technique.' },
    { title: 'Intra, sur site.', description: 'Dans votre entreprise.' }
  ],
  evaluation: ['Épreuve pratique de conduite'],
  validity: '5 ans · recyclage',
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
    subFamilySlug: null,
    subFamilyName: null,
    centerSlug: null,
    centerSlugs: [],
    modalities: [],
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
    subFamilySlug: null,
    subFamilyName: null,
    centerSlug: null,
    centerSlugs: [],
    modalities: [],
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
    subFamilySlug: null,
    subFamilyName: null,
    centerSlug: null,
    centerSlugs: [],
    modalities: [],
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
const fetchMock = vi.fn()
const directusRequest = vi.fn()
const refreshMock = vi.fn()
const requestEvent = { name: 'event' }

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('watchEffect', watchEffect)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { apiBase: 'http://api.test', siteUrl: 'https://learnup.test' }
}))
vi.stubGlobal('useRoute', () => routeMock)
vi.stubGlobal('useRouter', () => ({ replace: vi.fn() }))
vi.stubGlobal('useContentSeo', useContentSeoMock)
vi.stubGlobal('useHead', headMock)
vi.stubGlobal('useRequestEvent', () => requestEvent)
vi.stubGlobal('setResponseStatus', setResponseStatusMock)
vi.stubGlobal('navigateTo', navigateToMock)
vi.stubGlobal('logServerError', vi.fn())
vi.stubGlobal('$fetch', fetchMock)

const mockHeight = vi.hoisted(() => ({ value: 0 }))

vi.mock('@vueuse/core', () => ({
  useElementSize: () => ({ height: mockHeight })
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
  useDirectusClient: () => ({ request: directusRequest })
}))

const defaultUseAsyncData = async (
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
    return { data: ref(data), pending: ref(false), error: ref(null), refresh: refreshMock }
  } catch (error) {
    return { data: ref(null), pending: ref(false), error: ref(error), refresh: refreshMock }
  }
}

vi.stubGlobal('useAsyncData', defaultUseAsyncData)

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
    props: ['title', 'subFamily'],
    template: '<div class="similaire-card">{{ subFamily }} — {{ title }}</div>'
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
    props: ['title', 'meta', 'places', 'ctaLabel', 'to'],
    template:
      '<div class="session-card">{{ title }} — {{ meta }} — {{ places }} — {{ ctaLabel }}</div>'
  },
  CenterCard: {
    props: ['name', 'distance', 'formations', 'status', 'to'],
    template:
      '<div class="lieu-card"><a :href="to">{{ name }} — {{ distance }} — {{ formations }} — {{ status?.label }}</a></div>'
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
  const [source, fallback, options] = useContentSeoMock.mock.calls[0]!
  const resolve = (v: unknown) => (typeof v === 'function' ? (v as () => unknown)() : v)
  return [resolve(source), resolve(fallback), options] as const
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
    vi.stubGlobal('useAsyncData', defaultUseAsyncData)
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('inconnu')) {
        return Promise.reject(Object.assign(new Error('nf'), { statusCode: 404 }))
      }
      if (routeMock?.query.error === '1') {
        return Promise.reject(Object.assign(new Error('down'), { statusCode: 500 }))
      }
      return Promise.resolve(course)
    })
    directusRequest.mockImplementation((command: () => { params?: Record<string, unknown> }) => {
      const slug = (command().params?.filter as { slug?: { _eq?: string } } | undefined)?.slug?._eq
      return Promise.resolve(slug === 'caces-conduite-engins' ? [family] : [])
    })
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
    expect(wrapper.text()).toContain('Télécharger le programme détaillé')
  })

  it('rend la description WYSIWYG en HTML sans balises littérales', async () => {
    const richCourse: Course = {
      ...course,
      description: '<p>Initiez-vous au march&eacute; du <strong>cloud</strong>.</p>'
    }
    vi.stubGlobal(
      'useAsyncData',
      async (key: string, handler?: () => Promise<unknown>, options?: unknown) => {
        if (key === 'course-caces-conduite-engins-caces-r489-chariots-elevateurs') {
          return { data: ref(richCourse), pending: ref(false), error: ref(null), refresh: vi.fn() }
        }
        return defaultUseAsyncData(key, handler, options)
      }
    )

    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('marché du cloud.')
    expect(wrapper.text()).not.toContain('&eacute;')
    expect(wrapper.html()).not.toContain('&lt;p&gt;')
    expect(wrapper.html()).toContain('<strong>cloud</strong>')
  })

  it('restaure les sections sessions, lieux et modalités/évaluation', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Prochaines sessions')
    expect(wrapper.findAll('.session-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('Session en présentiel')
    expect(wrapper.text()).toContain('Où suivre cette formation ?')
    expect(wrapper.find('a[href="/centres/creteil"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Centre de Créteil')
    expect(wrapper.text()).toContain('Val-de-Marne')
    expect(wrapper.text()).toContain('Prochaine session le 12/10')
    expect(wrapper.text()).toContain('Modalités pédagogiques')
    expect(wrapper.text()).toContain('Inter, en centre.')
    expect(wrapper.text()).toContain('Évaluation')
    expect(wrapper.text()).toContain('Épreuve pratique de conduite')
  })

  it('affiche la carte intra uniquement quand la modalité est proposée', async () => {
    const wrapper = await mountPage()
    expect(wrapper.text()).not.toContain('Formation en intra')

    const intraCourse: Course = { ...course, modalities: ['inter', 'intra'] }
    vi.stubGlobal(
      'useAsyncData',
      async (key: string, handler?: () => Promise<unknown>, options?: unknown) => {
        if (key === 'course-caces-conduite-engins-caces-r489-chariots-elevateurs') {
          return { data: ref(intraCourse), pending: ref(false), error: ref(null), refresh: vi.fn() }
        }
        return defaultUseAsyncData(key, handler, options)
      }
    )

    const intraWrapper = await mountPage()
    expect(intraWrapper.text()).toContain('Formation en intra')
    const intraLink = intraWrapper.find('a[href*="intra=1"]')
    expect(intraLink.exists()).toBe(true)
    expect(intraLink.attributes('href')).toContain(
      'famille=caces-conduite-engins&formation=caces-r489-chariots-elevateurs'
    )
  })

  it('sert le visuel Directus via le proxy avant imageUrl', async () => {
    const withImage: Course = {
      ...course,
      image: 'file-abc-123',
      imageUrl: 'https://digiforma.example/visuel.jpg'
    }
    vi.stubGlobal(
      'useAsyncData',
      async (key: string, handler?: () => Promise<unknown>, options?: unknown) => {
        if (key === 'course-caces-conduite-engins-caces-r489-chariots-elevateurs') {
          return { data: ref(withImage), pending: ref(false), error: ref(null), refresh: vi.fn() }
        }
        return defaultUseAsyncData(key, handler, options)
      }
    )

    const wrapper = await mountPage()

    expect(wrapper.find('img').attributes('src')).toBe(
      'http://api.test/directus/assets/file-abc-123'
    )
  })

  it('retombe sur imageUrl quand aucun fichier Directus n’est lié', async () => {
    const withoutFile: Course = { ...course, image: null, imageUrl: 'https://cdn.example/v.jpg' }
    vi.stubGlobal(
      'useAsyncData',
      async (key: string, handler?: () => Promise<unknown>, options?: unknown) => {
        if (key === 'course-caces-conduite-engins-caces-r489-chariots-elevateurs') {
          return { data: ref(withoutFile), pending: ref(false), error: ref(null), refresh: vi.fn() }
        }
        return defaultUseAsyncData(key, handler, options)
      }
    )

    const wrapper = await mountPage()

    expect(wrapper.find('img').attributes('src')).toBe('https://cdn.example/v.jpg')
  })

  it('affiche l’état vide des sessions quand aucune session n’est publiée', async () => {
    const emptyCourse: Course = { ...course, sessions: null }
    vi.stubGlobal(
      'useAsyncData',
      async (key: string, handler?: () => Promise<unknown>, options?: unknown) => {
        if (key === 'course-caces-conduite-engins-caces-r489-chariots-elevateurs') {
          return { data: ref(emptyCourse), pending: ref(false), error: ref(null), refresh: vi.fn() }
        }
        if (key === 'famille-name-caces-conduite-engins') {
          return { data: ref(family), pending: ref(false), error: ref(null), refresh: vi.fn() }
        }
        return { data: ref(null), pending: ref(false), error: ref(null), refresh: vi.fn() }
      }
    )

    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Prochaines sessions')
    expect(wrapper.text()).toContain('Aucune session programmée pour le moment.')
    expect(wrapper.findAll('.session-card')).toHaveLength(0)
    expect(wrapper.text()).toContain('Demander une session')
    expect(wrapper.text()).not.toContain('Voir les sessions')
  })

  it('gère le déploiement progressif (2 -> 6 -> tout) et le repli avec aria-expanded', async () => {
    const multiSessionCourse: Course = {
      ...course,
      sessions: Array.from({ length: 8 }, (_, i) => ({
        id: `sess-${i + 1}`,
        startDate: `2026-${String(10 + Math.floor(i / 3)).padStart(2, '0')}-${String(10 + (i % 20)).padStart(2, '0')}`,
        endDate: `2026-${String(10 + Math.floor(i / 3)).padStart(2, '0')}-${String(11 + (i % 20)).padStart(2, '0')}`,
        modality: 'presentiel',
        seatsRemaining: 5,
        location: {
          name: 'Centre Créteil',
          city: 'Créteil',
          postalCode: '94000',
          department: '94',
          region: 'IDF',
          centreSlug: 'creteil'
        }
      }))
    }
    vi.stubGlobal(
      'useAsyncData',
      async (key: string, handler?: () => Promise<unknown>, options?: unknown) => {
        if (key === 'course-caces-conduite-engins-caces-r489-chariots-elevateurs') {
          return {
            data: ref(multiSessionCourse),
            pending: ref(false),
            error: ref(null),
            refresh: vi.fn()
          }
        }
        return defaultUseAsyncData(key, handler, options)
      }
    )

    const wrapper = await mountPage()

    // 1. Initial : 2 sessions affichées, bouton Voir plus, aria-expanded false
    expect(wrapper.findAll('.session-card')).toHaveLength(2)
    const button = wrapper.find('button.text-h4')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Voir plus')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-controls')).toBe('formation-sessions-list')

    // 2. Premier clic : déploie jusqu'à 6 sessions, bouton toujours Voir plus
    await button.trigger('click')
    expect(wrapper.findAll('.session-card')).toHaveLength(6)
    expect(button.text()).toContain('Voir plus')
    expect(button.attributes('aria-expanded')).toBe('false')

    // 3. Deuxième clic : déploie les 8 sessions, bouton bascule sur Voir moins
    await button.trigger('click')
    expect(wrapper.findAll('.session-card')).toHaveLength(8)
    expect(button.text()).toContain('Voir moins')
    expect(button.attributes('aria-expanded')).toBe('true')

    // 4. Troisième clic : replie à 2 sessions
    await button.trigger('click')
    expect(wrapper.findAll('.session-card')).toHaveLength(2)
    expect(button.text()).toContain('Voir plus')
    expect(button.attributes('aria-expanded')).toBe('false')
  })

  it('définit le SEO et le JSON-LD Course', async () => {
    await mountPage()

    const [source, fallback, options] = seoArgs()
    expect(source).toEqual(
      expect.objectContaining({
        seo_title: 'CACES R489 — chariots élévateurs'
      })
    )
    expect(fallback).toBe('CACES R489 — chariots élévateurs')

    // Le document est construit par l'option jsonLd de useContentSeo (le
    // composable sérialise/injecte — couvert par useContentSeo.spec.ts).
    const jsonLd = (options as { jsonLd?: () => Record<string, unknown> | null }).jsonLd?.()
    expect(jsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'CACES R489 — chariots élévateurs',
      description: 'Formation CACES R489.',
      inLanguage: 'fr',
      url: 'https://learnup.test/formations/caces-conduite-engins/caces-r489-chariots-elevateurs',
      provider: { '@type': 'Organization', name: 'LEARN UP ACADEMY' },
      about: { '@type': 'Thing', name: "CACES & conduite d'engins" },
      hasCourseInstance: { '@type': 'CourseInstance', courseWorkload: 'PT21H' },
      offers: { '@type': 'Offer', price: 1500, priceCurrency: 'EUR' }
    })
  })

  it('aligne le JSON-LD url sur la canonical éditoriale si présente', async () => {
    const canonicalCourse: Course = {
      ...course,
      seoCanonical: 'https://learnup.test/formations/custom-canonical'
    }
    vi.stubGlobal(
      'useAsyncData',
      async (key: string, handler?: () => Promise<unknown>, options?: unknown) => {
        if (key === 'course-caces-conduite-engins-caces-r489-chariots-elevateurs') {
          return {
            data: ref(canonicalCourse),
            pending: ref(false),
            error: ref(null),
            refresh: vi.fn()
          }
        }
        return defaultUseAsyncData(key, handler, options)
      }
    )
    await mountPage()

    const [, , options] = seoArgs()
    const jsonLd = (options as { jsonLd?: () => Record<string, unknown> | null }).jsonLd?.()
    expect(jsonLd?.url).toBe('https://learnup.test/formations/custom-canonical')
  })

  it('n’émet pas de JSON-LD sur une fiche introuvable', async () => {
    routeMock.params.slug = 'inconnu'
    routeMock.path = '/formations/caces-conduite-engins/inconnu'
    await mountPage()

    const [, , options] = seoArgs()
    expect((options as { jsonLd?: () => Record<string, unknown> | null }).jsonLd?.()).toBeNull()
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

  it('passe le statut 404 quand la formation est introuvable', async () => {
    routeMock.params.slug = 'inconnu'
    routeMock.path = '/formations/caces-conduite-engins/inconnu'
    await mountPage()

    expect(setResponseStatusMock).toHaveBeenCalledWith(requestEvent, 404, 'Formation introuvable')
  })

  it('passe le statut 500 quand le chargement échoue', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('down'), { statusCode: 500 }))
    await mountPage()

    expect(setResponseStatusMock).toHaveBeenCalledWith(
      requestEvent,
      500,
      'Erreur de chargement de la formation'
    )
  })

  it('« Réessayer » relance le chargement hors ?error=1', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('down'), { statusCode: 500 }))
    const wrapper = await mountPage()

    wrapper.findComponent(LoadError).vm.$emit('retry')
    await flushPromises()

    expect(refreshMock).toHaveBeenCalled()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('affiche le badge session du hero', async () => {
    const { buildSessionBadge } = await import('~/composables/useCatalog')
    vi.mocked(buildSessionBadge).mockReturnValue('Sessions ce mois-ci')
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Sessions ce mois-ci')
    vi.mocked(buildSessionBadge).mockReturnValue(null)
  })

  it('« Voir plus » déplie les sessions puis « Voir moins » replie', async () => {
    const manySessions: Course = {
      ...course,
      sessions: Array.from({ length: 6 }, (_, i) => ({
        id: `sess-${i}`,
        startDate: `2026-1${i}-10`,
        endDate: null,
        modality: i % 2 ? 'distanciel' : null,
        seatsRemaining: null,
        location: null
      }))
    }
    vi.stubGlobal(
      'useAsyncData',
      async (key: string, handler?: () => Promise<unknown>, options?: unknown) => {
        if (key === 'course-caces-conduite-engins-caces-r489-chariots-elevateurs') {
          return {
            data: ref(manySessions),
            pending: ref(false),
            error: ref(null),
            refresh: refreshMock
          }
        }
        return defaultUseAsyncData(key, handler, options)
      }
    )
    const wrapper = await mountPage()

    const before = wrapper.findAll('.session-card').length
    expect(before).toBeLessThanOrEqual(2)

    const more = wrapper.findAll('button').find((b) => b.text().includes('Voir plus'))
    await more!.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.session-card').length).toBeGreaterThan(before)

    const less = wrapper.findAll('button').find((b) => b.text().includes('Voir moins'))
    await less!.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.session-card')).toHaveLength(before)
  })

  it('espace le CTA mobile de la hauteur mesurée', async () => {
    mockHeight.value = 48
    const wrapper = await mountPage()

    expect(wrapper.html()).toContain('height: 48px')
    mockHeight.value = 0
  })

  it('retombe sur le slug famille quand le nom de famille échoue', async () => {
    directusRequest.mockRejectedValue(new Error('down'))
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('CACES R489 — chariots élévateurs')
  })

  it('passe les en-têtes internes au fetch quand disponibles', async () => {
    vi.stubGlobal('internalSsrHeaders', () => ({ 'x-internal-ssr': 'token' }))
    const wrapper = await mountPage()

    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), {
      headers: { 'x-internal-ssr': 'token' }
    })
    expect(wrapper.text()).toContain('CACES R489')
    vi.stubGlobal('internalSsrHeaders', () => undefined)
  })

  it('joint certification et certificateur quand la validité manque', async () => {
    fetchMock.mockImplementation(() => Promise.resolve({ ...course, validity: null }))
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Certification CACES · Opérateur réglementaire')
  })

  it('affiche la durée en jours d’un module du programme', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ...course,
        blocks: [{ name: 'Théorie', description: 'd', durationInDays: 3, goals: [] }]
      })
    )
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('3 jours')
  })

  it('affiche une pédagogie générique avec l’icône livre', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ...course,
        pedagogy: [{ title: 'Apports théoriques', description: 'd' }]
      })
    )
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Apports théoriques')
  })

  it('retombe sur les modalités de la formation quand la session n’en précise pas', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ...course,
        sessions: [
          {
            id: 'sess-1',
            startDate: '2026-10-12',
            endDate: '2026-10-14',
            modality: null,
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
        ]
      })
    )
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Inter · Présentiel')
  })

  it('affiche une fiche réduite au minimum (tous champs optionnels absents)', async () => {
    const minimal: Course = {
      ...course,
      description: null,
      durationDays: null,
      durationHours: null,
      price: null,
      cpf: false,
      cpfCode: null,
      certification: null,
      certifierName: null,
      validity: null,
      centerSlug: null,
      centerSlugs: [],
      modalities: null,
      sessions: null,
      image: null,
      imageUrl: null,
      generatedProgramUrl: null,
      targets: null,
      prerequisites: null,
      pedagogy: null,
      evaluation: null,
      blocks: null,
      seoTitle: null,
      seoDescription: null
    }
    vi.stubGlobal(
      'useAsyncData',
      async (key: string, handler?: () => Promise<unknown>, options?: unknown) => {
        if (key === 'course-caces-conduite-engins-caces-r489-chariots-elevateurs') {
          return { data: ref(minimal), pending: ref(false), error: ref(null), refresh: vi.fn() }
        }
        return defaultUseAsyncData(key, handler, options)
      }
    )
    const wrapper = await mountPage()

    // Titre rendu, sections optionnelles masquées, SEO dégradé.
    expect(wrapper.text()).toContain('CACES R489')
    expect(wrapper.text()).not.toContain('Public et prérequis')
    expect(wrapper.text()).not.toContain('Programme')
    expect(wrapper.text()).not.toContain('Formation en intra')
    const [source] = seoArgs()
    expect(source).toEqual(
      expect.objectContaining({ seo_title: 'CACES R489 — chariots élévateurs' })
    )
  })

  it('affiche les variantes de modules du programme', async () => {
    const withModules: Course = {
      ...course,
      blocks: [
        {
          name: 'Évaluation pratique',
          type: 'evaluation',
          subtitle: 'Épreuve finale',
          description: '<p>Passage devant jury.</p>',
          durationInDays: 1,
          goals: [{ text: 'Réussir l’épreuve' }, { text: 'Épreuve finale' }]
        },
        {
          name: 'Module sans type',
          description: 'Description texte simple.',
          durationInHours: 4,
          goals: null
        },
        'bloc-invalide',
        null,
        { name: '' }
      ]
    }
    vi.stubGlobal(
      'useAsyncData',
      async (key: string, handler?: () => Promise<unknown>, options?: unknown) => {
        if (key === 'course-caces-conduite-engins-caces-r489-chariots-elevateurs') {
          return { data: ref(withModules), pending: ref(false), error: ref(null), refresh: vi.fn() }
        }
        return defaultUseAsyncData(key, handler, options)
      }
    )
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Évaluation pratique')
    expect(wrapper.text()).toContain('Épreuve finale')
    expect(wrapper.text()).toContain('Module sans type')
  })

  it('couvre les variantes de sessions (sans id, lieu, modalité ou places)', async () => {
    const future = new Date()
    future.setUTCDate(future.getUTCDate() + 30)
    const futureIso = future.toISOString().slice(0, 10)
    const withSessions: Course = {
      ...course,
      centerSlug: null,
      sessions: [
        {
          id: null,
          startDate: futureIso,
          endDate: null,
          modality: null,
          seatsRemaining: 0,
          location: {
            name: null,
            city: 'Lyon',
            postalCode: '69',
            department: null,
            region: 'ARA',
            centreSlug: null
          }
        },
        {
          id: 's2',
          startDate: futureIso,
          endDate: null,
          modality: 'distanciel',
          seatsRemaining: 3,
          location: {
            name: 'Site partenaire',
            city: null,
            postalCode: null,
            department: 'Rhône',
            region: null,
            centreSlug: null
          }
        },
        {
          id: 's3',
          startDate: futureIso,
          endDate: null,
          modality: null,
          seatsRemaining: null,
          location: null
        }
      ]
    }
    vi.stubGlobal(
      'useAsyncData',
      async (key: string, handler?: () => Promise<unknown>, options?: unknown) => {
        if (key === 'course-caces-conduite-engins-caces-r489-chariots-elevateurs') {
          return {
            data: ref(withSessions),
            pending: ref(false),
            error: ref(null),
            refresh: vi.fn()
          }
        }
        return defaultUseAsyncData(key, handler, options)
      }
    )
    const wrapper = await mountPage()

    // Session à 0 place → « Être informé » ; ville en repli de nom ; lieu
    // « planifié » quand ni nom ni ville.
    expect(wrapper.text()).toContain("Être informé d'une place")
    expect(wrapper.text()).toContain('Lyon')
    expect(wrapper.text()).toContain('Session planifiée')
  })

  it('couvre les replis de contenu (prérequis, durée, prix, CPF, évaluation, lieux)', async () => {
    const future = new Date()
    future.setUTCDate(future.getUTCDate() + 30)
    const futureIso = future.toISOString().slice(0, 10)
    const variant: Course = {
      ...course,
      durationDays: null,
      durationHours: null,
      price: null,
      cpf: true,
      cpfCode: null,
      certifierName: null,
      validity: null,
      modalities: null,
      evaluation: null,
      prerequisites: null,
      blocks: [
        {
          name: 'Module sans sous-titre',
          type: 'theory',
          subtitle: null,
          description: '',
          durationInDays: null,
          durationInHours: null,
          goals: null
        }
      ],
      sessions: [
        {
          id: 'a',
          startDate: futureIso,
          endDate: null,
          modality: 'mode-custom',
          seatsRemaining: null,
          location: {
            name: null,
            city: null,
            postalCode: null,
            department: null,
            region: null,
            centreSlug: 'site-x'
          }
        },
        {
          id: 'b',
          startDate: futureIso,
          endDate: null,
          modality: null,
          seatsRemaining: 2,
          location: {
            name: null,
            city: 'Paris',
            postalCode: null,
            department: null,
            region: null,
            centreSlug: null
          }
        },
        {
          id: 'c',
          startDate: futureIso,
          endDate: null,
          modality: null,
          seatsRemaining: null,
          location: {
            name: null,
            city: null,
            postalCode: null,
            department: 'Dept',
            region: null,
            centreSlug: null
          }
        },
        {
          id: 'd',
          startDate: futureIso,
          endDate: null,
          modality: null,
          seatsRemaining: null,
          location: null
        }
      ]
    }
    vi.stubGlobal(
      'useAsyncData',
      async (key: string, handler?: () => Promise<unknown>, options?: unknown) => {
        if (key === 'course-caces-conduite-engins-caces-r489-chariots-elevateurs') {
          return { data: ref(variant), pending: ref(false), error: ref(null), refresh: vi.fn() }
        }
        return defaultUseAsyncData(key, handler, options)
      }
    )
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Aucun prérequis particulier.')
    expect(wrapper.text()).toContain('Éligible CPF')
    expect(wrapper.text()).toContain('Lieu de formation')
    expect(wrapper.text()).toContain('Session mode-custom')
    expect(wrapper.text()).not.toContain('Évaluation')
  })

  it('affiche les sections via prérequis et évaluation seuls, modalité inconnue', async () => {
    const variant: Course = {
      ...course,
      targets: null,
      pedagogy: null,
      modalities: ['mode-x']
    }
    vi.stubGlobal(
      'useAsyncData',
      async (key: string, handler?: () => Promise<unknown>, options?: unknown) => {
        if (key === 'course-caces-conduite-engins-caces-r489-chariots-elevateurs') {
          return { data: ref(variant), pending: ref(false), error: ref(null), refresh: vi.fn() }
        }
        return defaultUseAsyncData(key, handler, options)
      }
    )
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Prérequis')
    expect(wrapper.text()).toContain('Évaluation')
    expect(wrapper.text()).toContain('mode-x')
  })

  it('retombe sur une liste vide quand le catalogue similaire renvoie null', async () => {
    catalogMocks.useCatalog.mockImplementationOnce(() => ({
      data: ref(null),
      pending: ref(false),
      error: ref(null),
      refresh: vi.fn()
    }))

    const wrapper = await mountPage()

    expect(wrapper.findAll('.formation-card')).toHaveLength(0)
  })

  it('la recherche vide sur la fiche introuvable part sans query', async () => {
    routeMock.params.slug = 'inconnu'
    const wrapper = await mountPage()

    await wrapper.findComponent(NotFound).vm.$emit('search', '')
    await flushPromises()

    expect(navigateToMock).toHaveBeenCalledWith({ path: '/formations', query: {} })
  })
})
