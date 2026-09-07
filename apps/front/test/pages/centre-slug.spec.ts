import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, ref, Suspense, watchEffect } from 'vue'
import LoadError from '~/components/ErrorState/LoadError.vue'
import NotFound from '~/components/ErrorState/NotFound.vue'
import CentrePage from '~/pages/centres/[slug].vue'

const navigateToMock = vi.fn()
const refreshMock = vi.fn()
const setResponseStatusMock = vi.fn()
const seoMock = vi.fn()
const directusRequestMock = vi.fn()

interface RouteMock {
  params: { slug: string }
  query: Record<string, string>
  path: string
  meta: Record<string, unknown>
}

let routeMock: RouteMock
let forceError: Error | null = null

const centreCreteil = {
  id: 1,
  status: 'published',
  slug: 'creteil',
  name: 'Centre LEARN UP ACADEMY de Créteil',
  address: '14 rue des Refuzniks',
  city: 'Créteil',
  postal_code: '94000',
  department: 'Val-de-Marne',
  region: 'Île-de-France',
  description: '<p>Centre de Créteil.</p>',
  specialties: ['CACES', 'SST'],
  opening_hours: 'Lundi–vendredi · 8h30–17h30',
  transport: 'Métro 8',
  parking: 'Parking visiteurs',
  pmr_accessible: true,
  phone: '01 84 20 45 30',
  email: 'creteil@learnupacademy.fr',
  contact_name: null,
  contact_role: null,
  departments_covered: ['94'],
  digiforma_url: null,
  qualiopi_certified: true,
  qualiopi_certificate_number: 'QUAL-2026-CRETEIL',
  image: null,
  seo_title: null,
  seo_description: null,
  seo_canonical: null
}

const centreVitry = {
  ...centreCreteil,
  id: 2,
  slug: 'vitry',
  name: 'Centre de Vitry-sur-Seine',
  region: 'Île-de-France'
}

const catalogueCourses = {
  items: [
    {
      id: 1,
      slug: 'sst-initial',
      title: 'SST — Sauveteur secouriste du travail',
      description: 'Formation initiale SST.',
      durationDays: 2,
      durationHours: 14,
      price: 350,
      cpf: false,
      cpfCode: null,
      certification: 'Certificat SST',
      certifierName: 'INRS',
      category: 'Santé',
      familySlug: 'sante',
      centerSlug: 'creteil',
      centerSlugs: ['creteil'],
      modalities: ['inter', 'presentiel'],
      sessions: [
        {
          id: 'sess-1',
          startDate: '2026-10-12',
          endDate: '2026-10-13',
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
      generatedProgramUrl: null,
      status: 'published',
      seoTitle: null,
      seoDescription: null,
      seoCanonical: null
    }
  ],
  total: 1,
  page: 1,
  pageSize: 12
}

vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('watchEffect', watchEffect)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useRoute', () => routeMock)
vi.stubGlobal('useAsyncData', async (_key: string, handler: () => Promise<unknown>) => {
  if (forceError) {
    return { data: ref(null), error: ref(forceError), refresh: refreshMock }
  }
  try {
    return { data: ref(await handler()), error: ref(null), refresh: refreshMock }
  } catch (e) {
    return { data: ref(null), error: ref(e), refresh: refreshMock }
  }
})
vi.stubGlobal('useRequestEvent', () => undefined)
vi.stubGlobal('setResponseStatus', setResponseStatusMock)
vi.stubGlobal('useContentSeo', seoMock)
vi.stubGlobal('navigateTo', navigateToMock)
vi.stubGlobal('logServerError', vi.fn())
vi.stubGlobal('useDirectusClient', () => ({ request: directusRequestMock }))
vi.stubGlobal('useDirectusList', async () => ref([centreCreteil, centreVitry]))
vi.stubGlobal('useMenuFamilles', async () => ref([{ slug: 'sante', label: 'Santé', count: 2 }]))

vi.mock('~/composables/useCatalog', () => ({
  useCatalog: async () => ({ data: ref(catalogueCourses) }),
  buildSessionBadge: vi.fn(() => null),
  mapCourse: (
    course: {
      slug: string
      title: string
      description?: string | null
      durationDays?: number | null
      familySlug?: string | null
    },
    familyName?: string
  ) => ({
    slug: course.slug,
    title: course.title,
    family: familyName ?? course.familySlug ?? 'Autre',
    description: course.description ?? '',
    meta: `${course.durationDays} jours`,
    to: course.familySlug ? `/formations/${course.familySlug}/${course.slug}` : null
  }),
  buildDuration: vi.fn(),
  buildMeta: vi.fn(),
  buildCertifications: vi.fn()
}))

const stubs = {
  NuxtLink: { template: '<a><slot /></a>' },
  Button: { template: '<button><slot /></button>' },
  SearchInput: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'submit'],
    template: '<button class="search-stub" @click="$emit(\'submit\', \'caces\')" />'
  },
  Badge: true,
  Card: true,
  CardHeader: true,
  CardContent: true,
  CardFooter: true,
  CenterFormationCard: true,
  SessionCard: true,
  CtaBanner: true,
  CenterCard: true,
  IconMapPin: true,
  IconMapPinOff: true,
  IconPhone: true,
  IconMail: true,
  IconClock: true,
  IconTimetable: true,
  IconParking: true,
  IconAccessibility: true,
  IconAward: true,
  IconDownload: true,
  IconRefresh: true,
  IconSparkle: true
}

// useContentSeo reçoit désormais des getters réactifs : on les résout pour les assertions.
function seoArgs() {
  const [source, fallback] = seoMock.mock.calls[0]!
  const resolve = (v: unknown) => (typeof v === 'function' ? (v as () => unknown)() : v)
  return [resolve(source), resolve(fallback)] as const
}

async function mountPage() {
  const Host = defineComponent({
    render() {
      return h(Suspense, () => h(CentrePage))
    }
  })
  const wrapper = mount(Host, { global: { components: { LoadError, NotFound }, stubs } })
  await flushPromises()
  return wrapper
}

describe('pages/centres/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    forceError = null
    directusRequestMock.mockImplementation(async () => {
      return routeMock.params.slug === 'creteil' ? [centreCreteil] : []
    })
    routeMock = {
      params: { slug: 'creteil' },
      query: {},
      path: '/centres/creteil',
      meta: {}
    }
  })

  it('affiche le centre et le breadcrumb par défaut pour un slug connu', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Centre LEARN UP ACADEMY de Créteil')
    expect(wrapper.text()).toContain('14 rue des Refuzniks')
    expect(wrapper.text()).toContain('Île-de-France')
    expect(routeMock.meta.breadcrumb).toEqual([
      { label: 'Accueil', to: '/' },
      { label: 'Réseau de centres', to: '/centres' },
      { label: 'Île-de-France', to: '/centres' },
      { label: 'Centre LEARN UP ACADEMY de Créteil' }
    ])
    const [source, fallback] = seoArgs()
    expect(source).toEqual(
      expect.objectContaining({
        seo_title: 'Centre LEARN UP ACADEMY de Créteil — LEARN UP ACADEMY'
      })
    )
    expect(fallback).toBe('Centre LEARN UP ACADEMY de Créteil')
  })

  it('affiche les formations du centre issues du catalogue API', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Les formations disponibles dans ce centre')
    expect(wrapper.text()).toContain('1 formation')
    expect(wrapper.text()).toContain('Prochaines sessions')
  })

  it('affiche l’état introuvable et adapte breadcrumb/SEO pour un slug inconnu', async () => {
    routeMock.params.slug = 'inconnu'
    routeMock.path = '/centres/inconnu'
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Centre introuvable')
    expect(routeMock.meta.breadcrumb).toEqual([
      { label: 'Accueil', to: '/' },
      { label: 'Réseau de centres', to: '/centres' },
      { label: 'Centre introuvable' }
    ])
    const [source, fallback] = seoArgs()
    expect(source).toEqual(
      expect.objectContaining({ seo_title: 'Centre introuvable', seo_noindex: true })
    )
    expect(fallback).toBe('Centre introuvable')
  })

  it('affiche l’état erreur quand le chargement échoue', async () => {
    routeMock.query = { error: '1' }
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain("Les informations du centre n'ont pas pu être chargées.")
    expect(routeMock.meta.breadcrumb).toEqual([
      { label: 'Accueil', to: '/' },
      { label: 'Réseau de centres', to: '/centres' },
      { label: 'Erreur de chargement' }
    ])
    const [source, fallback] = seoArgs()
    expect(source).toEqual(
      expect.objectContaining({ seo_title: 'Erreur de chargement', seo_noindex: true })
    )
    expect(fallback).toBe('Erreur de chargement')
  })

  it('« Réessayer » retire le paramètre ?error=1 au lieu de relancer un appel voué à échouer', async () => {
    routeMock.query = { error: '1', autre: 'x' }
    const wrapper = await mountPage()

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Réessayer')!
      .trigger('click')

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/centres/creteil',
      query: { autre: 'x' }
    })
    expect(refreshMock).not.toHaveBeenCalled()
  })

  it('« Réessayer » relance le chargement quand l’erreur ne vient pas du paramètre de simulation', async () => {
    forceError = new Error('API down')
    const wrapper = await mountPage()

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Réessayer')!
      .trigger('click')

    expect(refreshMock).toHaveBeenCalled()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('la recherche de l’état introuvable redirige vers /formations avec la requête', async () => {
    routeMock.params.slug = 'inconnu'
    routeMock.path = '/centres/inconnu'
    const wrapper = await mountPage()

    await wrapper.find('.search-stub').trigger('click')

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/formations',
      query: { q: 'caces' }
    })
  })
})
