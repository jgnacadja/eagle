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
  mobile: '06 12 20 45 30',
  email: 'creteil@learnupacademy.fr',
  contact_name: null,
  contact_role: null,
  departments_covered: ['94'],
  digiforma_url: null,
  qualiopi_certified: true,
  qualiopi_certificate_number: 'QUAL-2026-CRETEIL',
  qualiopi_certifier: 'AFNOR',
  qualiopi_valid_until: '2027-03-14T00:00:00Z',
  latitude: 48.7909,
  longitude: 2.4534,
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
  city: 'Vitry-sur-Seine',
  region: 'Île-de-France',
  latitude: 48.7872,
  longitude: 2.3928
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
      subFamilySlug: null,
      subFamilyName: null,
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
  total: 12,
  page: 1,
  pageSize: 12,
  facets: {
    families: { sante: 12 },
    subFamilies: {},
    modalities: {},
    durations: {},
    locations: {},
    cpf: 0,
    certifying: 0
  }
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

// Position pilotable par test : la page importe `useGeolocation`
// explicitement — le mock remplace le module, `geoPosition` décide si la
// distance ou la ville s'affiche sur les cartes des autres centres.
const geoPosition = vi.hoisted(() => ({ value: null as { lat: number; lng: number } | null }))
vi.mock('~/composables/useGeolocation', () => ({
  useGeolocation: () => ({ position: geoPosition })
}))
const centreArticlesFixture = [
  {
    slug: 'actu-creteil',
    title: 'Actualité du centre de Créteil',
    excerpt: 'Résumé de l’actualité.',
    category: 'SST & sécurité',
    publish_at: '2026-09-01T09:00:00+00:00',
    cover_image: null
  }
]
const centreAvisFixture = [
  {
    slug: 'avis-qhse',
    author: 'Chargée QHSE',
    quote: '« Suivi des échéances impeccable, équipe très réactive. »',
    stars: 4,
    published_at: '2026-04-20T09:00:00+00:00',
    centre: null
  }
]
// Mutable pour tester le masquage de la section quand la collection est vide.
const avisFixture: typeof centreAvisFixture = []

vi.stubGlobal('useDirectusList', async (collection: string) =>
  ref(
    collection === 'articles'
      ? centreArticlesFixture
      : collection === 'avis'
        ? avisFixture
        : [centreCreteil, centreVitry]
  )
)
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
  buildCertifications: vi.fn(),
  upcomingSessions: (course: { sessions?: { startDate?: string | null }[] | null }) => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    return (course.sessions ?? []).filter(
      (s) => s.startDate && new Date(`${s.startDate}T00:00:00Z`) >= today
    )
  }
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
  // Slots rendus : sans ça le contenu des cartes (infos pratiques,
  // qualité) est absent du DOM de test.
  Card: { template: '<div><slot /></div>' },
  CardHeader: { template: '<div><slot /></div>' },
  CardContent: { template: '<div><slot /></div>' },
  CardFooter: { template: '<div><slot /></div>' },
  CenterFormationCard: true,
  SessionCard: {
    props: ['title', 'meta', 'places'],
    template: '<div class="session-card">{{ title }}</div>'
  },
  CtaBanner: true,
  CenterCard: {
    props: ['name', 'distance', 'formations', 'to'],
    template: '<div class="center-card">{{ name }} {{ distance }}</div>'
  },
  ArticleCard: {
    props: ['title'],
    template: '<div class="article-card">{{ title }}</div>'
  },
  TestimonialCard: {
    props: ['quote', 'author'],
    template: '<div class="testimonial-card">{{ quote }}</div>'
  },
  IconMapPin: true,
  IconMapPinOff: true,
  IconPhone: true,
  IconSmartphone: true,
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
    geoPosition.value = null
    avisFixture.splice(0, avisFixture.length, ...centreAvisFixture)
    directusRequestMock.mockImplementation(async () => {
      return routeMock.params.slug === 'creteil' ? [centreCreteil] : []
    })
    routeMock = {
      params: { slug: 'creteil' },
      query: {},
      path: '/centres/creteil',
      meta: {}
    }
    catalogueCourses.items[0]!.sessions = [
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
    ]
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
    expect(wrapper.text()).toContain('12 formations')
    expect(wrapper.text()).toContain('1 famille')
    expect(wrapper.text()).toContain('Voir les 12 formations du centre')
    expect(wrapper.text()).toContain('Prochaines sessions')
  })

  it('compose l’email du centre depuis le code postal (règle réseau)', async () => {
    const wrapper = await mountPage()

    // 94000 → contact94@learnup-academy.com — le champ `email` Directus
    // n'est qu'un repli quand le code postal manque.
    expect(wrapper.text()).toContain('contact94@learnup-academy.com')
    expect(wrapper.text()).not.toContain('creteil@learnupacademy.fr')
  })

  it('retombe sur l’email Directus quand le code postal est absent', async () => {
    directusRequestMock.mockImplementation(async () => [{ ...centreCreteil, postal_code: null }])
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('creteil@learnupacademy.fr')
  })

  it('affiche le téléphone à côté de « Parler à votre conseiller », sans masquage responsive', async () => {
    const wrapper = await mountPage()

    const phoneLink = wrapper.findAll('a').find((a) => a.text().includes('01 84 20 45 30'))
    expect(phoneLink).toBeTruthy()
    expect(phoneLink!.classes()).not.toContain('hidden')
  })

  it('affiche le mobile en gras comme le fixe dans les informations pratiques', async () => {
    const wrapper = await mountPage()

    const mobileLink = wrapper.findAll('a').find((a) => a.text().includes('06 12 20 45 30'))
    expect(mobileLink).toBeTruthy()
    expect(mobileLink!.classes()).toContain('font-semibold')
  })

  it('affiche certificateur et validité dans la carte qualité', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Qualité et certifications')
    expect(wrapper.text()).toContain('certificateur AFNOR')
    expect(wrapper.text()).toContain("valide jusqu'au 14 mars 2027")
  })

  it('affiche l’adresse et le lien itinéraire dans le pied de la carte d’accès', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('14 rue des Refuzniks, 94000 Créteil')
    const link = wrapper.findAll('a').find((a) => a.text().includes("Ouvrir l'itinéraire"))
    expect(link).toBeTruthy()
  })

  it('déduplique la localité quand le champ address la contient déjà', async () => {
    directusRequestMock.mockImplementation(async () => [
      { ...centreCreteil, address: '14 rue des Refuzniks, 94000 Créteil' }
    ])
    const wrapper = await mountPage()

    // Le pied de carte ne doit pas répéter « 94000 Créteil » en double.
    expect(wrapper.text()).not.toContain('94000 Créteil, 94000')
    expect(wrapper.text()).toContain('14 rue des Refuzniks, 94000 Créteil')
  })

  it('affiche la ville par défaut sur les cartes des autres centres', async () => {
    const wrapper = await mountPage()

    const card = wrapper.findAll('.center-card').find((c) => c.text().includes('Vitry'))
    expect(card).toBeTruthy()
    expect(card!.text()).toContain('Vitry-sur-Seine')
  })

  it('affiche la distance depuis la position utilisateur quand elle est connue', async () => {
    geoPosition.value = { lat: 48.85, lng: 2.35 }
    const wrapper = await mountPage()

    const card = wrapper.findAll('.center-card').find((c) => c.text().includes('Vitry'))
    expect(card).toBeTruthy()
    expect(card!.text()).toMatch(/à \d+(,\d+)? km/)
  })

  it('affiche les avis puis les actualités du centre', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Avis')
    expect(wrapper.findAll('.testimonial-card').length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('Actualités de votre centre')
    expect(wrapper.findAll('.article-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('Actualité du centre de Créteil')
  })

  it('affiche les avis dynamiques de la collection Directus', async () => {
    const wrapper = await mountPage()

    const cards = wrapper.findAll('.testimonial-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.text()).toContain('Suivi des échéances impeccable')
  })

  it('masque la section avis quand la collection est vide', async () => {
    avisFixture.length = 0
    const wrapper = await mountPage()

    expect(wrapper.findAll('.testimonial-card')).toHaveLength(0)
    expect(wrapper.find('[aria-labelledby="avis-title"]').exists()).toBe(false)
  })

  it('gère le déploiement progressif (2 -> 6 -> tout) et le repli avec aria-expanded', async () => {
    const loc = {
      name: 'Centre de Créteil',
      city: 'Créteil',
      postalCode: '94000',
      department: 'Val-de-Marne',
      region: 'Île-de-France',
      centreSlug: 'creteil'
    }
    // 8 sessions au total
    catalogueCourses.items[0]!.sessions = Array.from({ length: 8 }, (_, i) => ({
      id: `sess-${i + 1}`,
      startDate: `2026-${String(10 + Math.floor(i / 3)).padStart(2, '0')}-${String(10 + (i % 20)).padStart(2, '0')}`,
      endDate: `2026-${String(10 + Math.floor(i / 3)).padStart(2, '0')}-${String(11 + (i % 20)).padStart(2, '0')}`,
      modality: 'presentiel',
      seatsRemaining: 5,
      location: loc
    }))

    const wrapper = await mountPage()

    // 1. Initial : 2 sessions affichées, bouton Voir plus, aria-expanded false
    expect(wrapper.findAll('.session-card')).toHaveLength(2)
    const button = wrapper.findAll('button').find((b) => b.text().includes('Voir plus'))!
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Voir plus')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-controls')).toBe('centre-sessions-list')

    // 2. Premier clic : déploie jusqu'à 6 sessions, bouton toujours Voir plus car 8 > 6
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
