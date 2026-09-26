import { DOMWrapper, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, Suspense } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NuxtError } from '#app'
import type { CourseListItem, CoursePage } from '@learnup/types'
import { useGeolocation } from '~/composables/useGeolocation'
import HomePage from '~/pages/index.vue'

const seoMock = vi.fn()
const headMock = vi.fn()
const navigateMock = vi.fn()
const geoFetchMock = vi.fn().mockResolvedValue([])

vi.stubGlobal('useContentSeo', seoMock)
vi.stubGlobal('useHead', headMock)
vi.stubGlobal('navigateTo', navigateMock)
vi.stubGlobal('$fetch', geoFetchMock)
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { apiBase: 'http://api.test', siteUrl: 'https://learnup.test' }
}))

vi.mock('~/composables/useCatalog', () => ({
  upcomingSessions: (c: { sessions?: unknown[] }) => c.sessions ?? [],
  mapCourse: (c: { slug: string; title: string; familySlug?: string | null }) => ({
    slug: c.slug,
    title: c.title,
    family: c.familySlug ?? 'Autre',
    meta: '',
    to: c.familySlug ? `/formations/${c.familySlug}/${c.slug}` : null
  }),
  useCatalog: vi.fn(async () => ({
    data: ref({
      items: [
        {
          slug: 'formation-1',
          title: 'Formation 1',
          familySlug: 'management',
          sessions: [{ startDate: '2026-10-15', seatsRemaining: 5 }]
        },
        {
          slug: 'formation-2',
          title: 'Formation 2',
          familySlug: 'sante',
          sessions: [{ startDate: '2026-10-20', seatsRemaining: 2 }]
        },
        {
          slug: 'formation-3',
          title: 'Formation 3',
          familySlug: 'finance',
          sessions: [{ startDate: '2026-10-25', seatsRemaining: 0 }]
        },
        { slug: 'formation-4', title: 'Formation 4', familySlug: 'informatique' }
      ],
      total: 15,
      page: 1,
      pages: 4
    }),
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn()
  }))
}))

const initialCentres = [
  {
    slug: 'creteil',
    name: 'Centre de Créteil',
    city: 'Créteil',
    department: '94',
    region: 'Île-de-France',
    specialties: ['CACES', 'SST'],
    latitude: 48.7909,
    longitude: 2.4534
  },
  {
    slug: 'lyon',
    name: 'Centre de Lyon',
    city: 'Lyon',
    department: '69',
    region: 'Auvergne-Rhône-Alpes',
    specialties: ['Hauteur'],
    latitude: 45.764,
    longitude: 4.8357
  },
  {
    slug: 'lille',
    name: 'Centre de Lille',
    city: 'Lille',
    department: '59',
    region: 'Hauts-de-France',
    specialties: ['Incendie'],
    latitude: 50.6292,
    longitude: 3.0573
  }
]

const directusCentres = ref([...initialCentres])

const initialAvis = [
  {
    id: 1,
    status: 'published',
    sort: null,
    slug: 'avis-logistique',
    author: 'Responsable QHSE',
    published_at: '2024-03-01T00:00:00.000Z',
    stars: 5,
    quote: 'Douze habilitations planifiées en une semaine.',
    centre: null
  },
  {
    id: 2,
    status: 'published',
    sort: null,
    slug: 'avis-btp',
    author: 'DRH groupe BTP',
    published_at: '2024-06-15T00:00:00.000Z',
    stars: 4,
    quote: 'Réactivité exemplaire, interlocuteur unique sur 8 sites.',
    centre: null
  },
  {
    id: 3,
    status: 'published',
    sort: null,
    slug: 'avis-industrie',
    author: 'Directrice formation',
    published_at: '2024-09-10T00:00:00.000Z',
    stars: 5,
    quote: 'Toutes nos habilitations CACES renouvelées sans interruption de production.',
    centre: null
  }
]

const directusAvis = ref([...initialAvis])

const initialArticles = [
  {
    id: 1,
    status: 'published',
    slug: 'article-1',
    title: 'Article 1',
    excerpt: 'Extrait article 1',
    category: 'Réglementation',
    publish_at: '2026-01-01T00:00:00.000Z',
    cover_image: 'cover-1'
  },
  {
    id: 2,
    status: 'published',
    slug: 'article-2',
    title: 'Article 2',
    excerpt: 'Extrait article 2',
    category: 'Conseil',
    publish_at: '2026-01-02T00:00:00.000Z',
    cover_image: 'cover-2'
  },
  {
    id: 3,
    status: 'published',
    slug: 'article-3',
    title: 'Article 3',
    excerpt: 'Extrait article 3',
    category: 'Formation',
    publish_at: '2026-01-03T00:00:00.000Z',
    cover_image: 'cover-3'
  }
]

const directusArticles = ref([...initialArticles])

vi.stubGlobal(
  'useDirectusList',
  vi.fn(async (_collection: string) => {
    if (_collection === 'articles') return directusArticles
    if (_collection === 'avis') return directusAvis
    return directusCentres
  })
)

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  SearchInput: {
    props: ['modelValue', 'suggestions'],
    emits: ['update:modelValue', 'submit', 'input'],
    template:
      '<span><input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value); $emit(\'input\', $event.target.value)" @keydown.enter="$emit(\'submit\', $event.target.value)" /><datalist v-if="suggestions"><option v-for="s in suggestions" :key="s" :value="s" /></datalist><slot name="action" /></span>'
  },
  NetworkCard: {
    props: ['title', 'to'],
    template: '<div class="network-card">{{ title }}<a class="network-cta" :href="to" /></div>'
  },
  FormationCard: {
    props: ['title', 'to'],
    template: '<div class="formation-card">{{ title }}<a class="formation-cta" :href="to" /></div>'
  },
  CenterCard: {
    props: ['name', 'to', 'distance'],
    template:
      '<div class="center-card">{{ name }} <span class="centre-distance">{{ distance }}</span><a class="centre-cta" :href="to" /></div>'
  },
  StatItem: {
    props: ['value', 'label'],
    template: '<div class="stat">{{ value }} {{ label }}</div>'
  },
  TestimonialCard: { props: ['author'], template: '<div class="testimonial">{{ author }}</div>' },
  ArticleCard: { props: ['title'], template: '<div class="article">{{ title }}</div>' },
  IconSparkle: true,
  IconSearch: true,
  IconCheck: true
}

const Host = defineComponent({
  setup: () => () => h(Suspense, () => h(HomePage))
})

async function mountPage() {
  const wrapper = mount(Host, { global: { stubs } })
  await new Promise((r) => setTimeout(r, 0))
  return wrapper
}

describe('pages/index', () => {
  beforeEach(() => {
    // État géo partagé au niveau module : reset entre tests. `navigator`
    // sans `permissions` : happy-dom résoudrait `granted`, ce qui court-
    // circuite le dialog de consentement (permission déjà accordée).
    vi.stubGlobal('navigator', {})
    const geo = useGeolocation()
    geo.clear()
    geo.permission.value = null
    geoFetchMock.mockReset().mockResolvedValue([])
    navigateMock.mockReset()
    directusArticles.value = [...initialArticles]
    directusAvis.value = [...initialAvis]
    directusCentres.value = [...initialCentres]
  })

  it('affiche le hero et les sections principales', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('orchestrés')
    expect(wrapper.text()).toContain('Construisons ensemble le réseau Learn Up Academy')
    expect(wrapper.text()).toContain('Les formations réglementaires adaptées à vos métiers')
    expect(wrapper.text()).toContain('Trouvez le centre de formation le plus proche de chez vous')
    expect(wrapper.text()).toContain('Simplifiez la gestion de vos formations')
    expect(wrapper.text()).toContain('Les clients parlent de nous')
    expect(wrapper.text()).toContain('Actualités')
  })

  it('rend les cartes réseau, formations, centres et articles', async () => {
    const wrapper = await mountPage()

    expect(wrapper.findAll('.network-card')).toHaveLength(3)
    expect(wrapper.findAll('.formation-card')).toHaveLength(4)
    // La fixture contient 3 centres : l'affichage est plafonné à 2.
    expect(wrapper.findAll('.center-card')).toHaveLength(2)
    expect(wrapper.findAll('.stat')).toHaveLength(4)
    // 3 avis dans la fixture → 3 TestimonialCard rendues.
    const testimonials = wrapper.findAll('.testimonial')
    expect(testimonials).toHaveLength(3)
    // Vérification du contenu : mapAvis formate correctement author + quote.
    expect(testimonials[0]!.text()).toContain('Responsable QHSE')
    expect(testimonials[1]!.text()).toContain('DRH groupe BTP')
    expect(testimonials[2]!.text()).toContain('Directrice formation')
    expect(wrapper.findAll('.article')).toHaveLength(3)
  })

  it('affiche la section Entreprises avec ses bénéfices et CTAs', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Simplifiez la gestion de vos formations')
    expect(wrapper.text()).toContain('Interlocuteur unique')
    expect(wrapper.text()).toContain('Gestion multi-sites')
    expect(wrapper.text()).toContain('Suivi centralisé')
    expect(wrapper.text()).toContain('Découvrir nos solutions entreprises')
  })

  it('affiche la section Prochaines sessions avec ses cartes et le CTA catalogue', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Les prochaines sessions près de chez vous')
    expect(wrapper.text()).toContain(
      'Personnalisées selon votre localisation ou votre dernière recherche.'
    )
    expect(wrapper.text()).toContain('Formation 1')
    expect(wrapper.text()).toContain('Formation 2')
    expect(wrapper.text()).toContain('Formation 3')
    expect(wrapper.text()).toContain('Voir toutes les sessions')
  })

  it('affiche la section Pourquoi Learn Up Academy avec ses 6 bénéfices', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Pourquoi Learn Up Academy ?')
    expect(wrapper.text()).toContain('Conseil personnalisé')
    expect(wrapper.text()).toContain('Interlocuteur unique')
    expect(wrapper.text()).toContain('Proximité')
    expect(wrapper.text()).toContain('Réactivité')
    expect(wrapper.text()).toContain('Couverture nationale')
    expect(wrapper.text()).toContain('Centralisation')
  })

  it('affiche la section Actualités et conseils avec ses articles', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Actualités et conseils')
    expect(wrapper.text()).toContain('Toutes les actualités')
  })

  it('pointe les CTA vers la page de demande et le catalogue', async () => {
    const wrapper = await mountPage()
    const links = wrapper.findAll('a')
    const hrefs = links.map((l) => l.attributes('href'))

    expect(hrefs).toContain('/centres/demande-de-formation')
    expect(hrefs).toContain('/centres/demande-de-formation?sujet=franchise')
    expect(hrefs).toContain('/referencer-mon-organisme')
    expect(hrefs).toContain('/centres/demande-de-formation?sujet=formateur')
    expect(hrefs).toContain('/parler-a-votre-conseiller')
    expect(hrefs).toContain('/formations')
    expect(hrefs).toContain('/centres')
    expect(hrefs).toContain('/actualites')
  })

  it('le badge « Près de moi » déclenche la géolocalisation et affiche les distances réelles', async () => {
    const getCurrentPosition = vi.fn(
      (success: (pos: { coords: { latitude: number; longitude: number } }) => void) => {
        success({ coords: { latitude: 48.7909, longitude: 2.4534 } })
      }
    )
    const originalNavigator = globalThis.navigator
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })

    try {
      const wrapper = await mountPage()

      // Jamais automatique : clic badge → dialog → « Autoriser la géolocalisation ».
      // Le Dialog reka-ui est téléporté dans document.body.
      expect(getCurrentPosition).not.toHaveBeenCalled()
      await wrapper.find('button[aria-label="Activer la géolocalisation"]').trigger('click')
      await nextTick()
      const confirmEl = [...document.body.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Autoriser la géolocalisation')
      )
      expect(confirmEl, 'le dialog de consentement doit être ouvert').toBeTruthy()
      await new DOMWrapper(confirmEl!).trigger('click')
      await nextTick()

      expect(getCurrentPosition).toHaveBeenCalled()
      // Position = Créteil : la carte affiche la distance réelle, pas ville·dept.
      expect(wrapper.findAll('.centre-distance')[0]!.text()).toMatch(/à .*(km|m)/)
    } finally {
      vi.stubGlobal('navigator', originalNavigator)
    }
  })

  it('envoie la recherche carte en query q vers /centres', async () => {
    const wrapper = await mountPage()

    const input = wrapper.find('input[input-id="map-search"]')
    await input.setValue('vitry')
    await input.trigger('keydown.enter')

    expect(navigateMock).toHaveBeenCalledWith({ path: '/centres', query: { q: 'vitry' } })
  })

  it('autocomplète la recherche carte et soumet terme + département de la ville', async () => {
    geoFetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.endsWith('/communes')
          ? [
              {
                nom: 'Lyon',
                codeDepartement: '69',
                departement: { code: '69', nom: 'Rhône' },
                centre: { coordinates: [4.8357, 45.764] }
              }
            ]
          : []
      )
    )
    const wrapper = await mountPage()
    vi.useFakeTimers()

    try {
      const input = wrapper.find('input[input-id="map-search"]')
      await input.setValue('lyon')
      await vi.advanceTimersByTimeAsync(250)

      expect(wrapper.findAll('datalist option').map((o) => o.attributes('value'))).toContain(
        'Lyon (69)'
      )

      await input.setValue('Lyon (69)')
      await input.trigger('keydown.enter')

      // Ville choisie : ?q= recherche texte + ?dept= présélectionne le filtre.
      expect(navigateMock).toHaveBeenCalledWith({
        path: '/centres',
        query: { q: 'Lyon', dept: 'Rhône' }
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('une suggestion département part en query dept vers /centres', async () => {
    geoFetchMock.mockImplementation((url: string) =>
      Promise.resolve(url.endsWith('/departements') ? [{ code: '76', nom: 'Seine-Maritime' }] : [])
    )
    const wrapper = await mountPage()
    vi.useFakeTimers()

    try {
      const input = wrapper.find('input[input-id="map-search"]')
      await input.setValue('seine')
      await vi.advanceTimersByTimeAsync(250)

      await input.setValue('Seine-Maritime (département 76)')
      await input.trigger('keydown.enter')

      expect(navigateMock).toHaveBeenCalledWith({
        path: '/centres',
        query: { dept: 'Seine-Maritime' }
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('définit le SEO et le JSON-LD', async () => {
    await mountPage()

    expect(seoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        seo_title: 'LEARN UP ACADEMY — Plateforme de conseil en formation professionnelle'
      }),
      'LEARN UP ACADEMY',
      expect.objectContaining({ jsonLd: expect.anything() })
    )
    // Le JSON-LD passe par l'option jsonLd de useContentSeo (sérialisation
    // couverte par useContentSeo.spec.ts).
    const options = seoMock.mock.calls[0]![2] as { jsonLd?: Record<string, unknown> }
    const graph = options.jsonLd?.['@graph'] as Record<string, unknown>[]
    expect(graph).toHaveLength(2)
    expect(graph[0]).toMatchObject({
      '@type': 'WebSite',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://learnup.test/formations?q={search_term_string}'
      }
    })
    expect(graph[1]).toMatchObject({
      '@type': 'Organization',
      url: 'https://learnup.test',
      logo: 'https://learnup.test/images/learn-up-academy.svg',
      contactPoint: { '@type': 'ContactPoint', email: 'contact@learnup.fr' }
    })
  })

  it('masque la section Prochaines sessions quand aucune session n’est disponible', async () => {
    const { useCatalog } = await import('~/composables/useCatalog')
    vi.mocked(useCatalog).mockResolvedValueOnce({
      data: ref<CoursePage | undefined>({
        items: [
          {
            id: 1,
            slug: 'formation-1',
            title: 'Formation 1',
            description: null,
            durationDays: null,
            durationHours: null,
            price: null,
            cpf: null,
            cpfCode: null,
            certification: null,
            certifierName: null,
            category: null,
            familySlug: 'management',
            subFamilySlug: null,
            subFamilyName: null,
            centerSlug: null,
            centerSlugs: [],
            modalities: [],
            sessions: [],
            image: null,
            imageUrl: null,
            generatedProgramUrl: null,
            status: 'published',
            seoTitle: null,
            seoDescription: null,
            seoCanonical: null
          } satisfies CourseListItem
        ],
        total: 1,
        page: 1,
        pageSize: 9,
        facets: {
          families: {},
          subFamilies: {},
          modalities: {},
          durations: {},
          locations: {},
          cpf: 0,
          certifying: 0
        }
      }),
      pending: ref(false),
      error: ref<NuxtError<unknown> | undefined>(undefined),
      refresh: vi.fn()
    })

    const wrapper = await mountPage()
    expect(wrapper.find('#sessions').exists()).toBe(false)
  })

  it('masque la section Actualités quand aucun article n’est publié', async () => {
    directusArticles.value = []
    const wrapper = await mountPage()
    expect(wrapper.find('#actualites').exists()).toBe(false)
  })

  it("masque la section t\u00e9moignages quand aucun avis n'est retourn\u00e9", async () => {
    directusAvis.value = []
    const wrapper = await mountPage()
    // Aucune TestimonialCard et le bandeau \u00ab Les clients parlent de nous \u00bb
    // ne doivent pas appara\u00eetre.
    expect(wrapper.findAll('.testimonial')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('Les clients parlent de nous')
    expect(wrapper.text()).not.toContain('Voir tous les avis')
  })

  it('affiche un message utilisateur lorsque la carte des centres est indisponible', async () => {
    directusCentres.value = []
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('La carte des centres est temporairement indisponible.')
    expect(wrapper.text()).not.toContain('outil SIG')
  })

  it('ne contient pas de mentions ou annotations provisoires de développement', async () => {
    const wrapper = await mountPage()
    const text = wrapper.text()
    expect(text).not.toContain('Ouvre le formulaire')
    expect(text).not.toContain('à confirmer avant mise en ligne')
    expect(text).not.toContain('pas un outil SIG')
    expect(text).not.toContain("Sous réserve d'autorisation")
    expect(text).not.toContain('Photo à fournir')
    expect(text).not.toContain("Affichage d'exemple")
    expect(text).not.toContain('Logo Qualiopi à confirmer')
  })

  it('envoie la recherche hero en query q vers /formations', async () => {
    const wrapper = await mountPage()

    await wrapper.find('#hero-search-input').setValue('caces lyon')
    await wrapper.findAll('form')[0]!.trigger('submit')

    expect(navigateMock).toHaveBeenCalledWith({
      path: '/formations',
      query: { q: 'caces lyon' }
    })
  })

  it('envoie la recherche CTA en query q vers /formations', async () => {
    const wrapper = await mountPage()

    await wrapper.find('#cta-search-input').setValue('recyclage')
    await wrapper.findAll('form').at(-1)!.trigger('submit')

    expect(navigateMock).toHaveBeenCalledWith({
      path: '/formations',
      query: { q: 'recyclage' }
    })
  })

  it('part sans query quand la recherche hero est vide', async () => {
    const wrapper = await mountPage()

    await wrapper.findAll('form')[0]!.trigger('submit')

    expect(navigateMock).toHaveBeenCalledWith({ path: '/formations', query: {} })
  })

  it('part sans query quand la recherche CTA est vide', async () => {
    const wrapper = await mountPage()

    await wrapper.findAll('form').at(-1)!.trigger('submit')

    expect(navigateMock).toHaveBeenCalledWith({ path: '/formations', query: {} })
  })

  it('part sans query quand la recherche carte est vide', async () => {
    const wrapper = await mountPage()

    const input = wrapper.find('input[input-id="map-search"]')
    await input.trigger('keydown.enter')

    expect(navigateMock).toHaveBeenCalledWith({ path: '/centres', query: {} })
  })

  it('retombe sur les listes vides quand les données Directus sont null', async () => {
    directusAvis.value = null
    directusCentres.value = null
    directusArticles.value = null

    const wrapper = await mountPage()

    expect(wrapper.findAll('.testimonial')).toHaveLength(0)
    expect(wrapper.find('#actualites').exists()).toBe(false)
    expect(wrapper.text()).toContain('La carte des centres est temporairement indisponible.')
  })

  it('retombe sur les listes vides quand le catalogue renvoie null', async () => {
    const { useCatalog } = await import('~/composables/useCatalog')
    vi.mocked(useCatalog).mockResolvedValueOnce({
      data: ref<CoursePage | undefined>(undefined),
      pending: ref(false),
      error: ref<NuxtError<unknown> | undefined>(undefined),
      refresh: vi.fn()
    })

    const wrapper = await mountPage()

    expect(wrapper.findAll('.formation-card')).toHaveLength(0)
    expect(wrapper.find('#sessions').exists()).toBe(false)
  })

  it('gère les sessions sans places ni cible et déduplique les formations', async () => {
    const { useCatalog } = await import('~/composables/useCatalog')
    const baseCourse = {
      id: 1,
      description: null,
      durationDays: null,
      durationHours: null,
      price: null,
      cpf: null,
      cpfCode: null,
      certification: null,
      certifierName: null,
      category: null,
      subFamilySlug: null,
      subFamilyName: null,
      centerSlug: null,
      centerSlugs: [],
      modalities: [],
      image: null,
      imageUrl: null,
      generatedProgramUrl: null,
      status: 'published',
      seoTitle: null,
      seoDescription: null,
      seoCanonical: null
    }
    vi.mocked(useCatalog).mockResolvedValueOnce({
      data: ref<CoursePage | undefined>({
        items: [
          {
            ...baseCourse,
            slug: 'f-multi',
            title: 'F multi',
            familySlug: 'fam',
            sessions: [
              { startDate: '2026-11-01', seatsRemaining: null },
              { startDate: '2026-11-02', seatsRemaining: 1 }
            ]
          } satisfies CourseListItem,
          {
            ...baseCourse,
            slug: 'f-noto',
            title: 'F sans famille',
            familySlug: null,
            sessions: [{ startDate: '2026-11-03', seatsRemaining: 5 }]
          } satisfies CourseListItem
        ],
        total: 2,
        page: 1,
        pageSize: 9,
        facets: {
          families: {},
          subFamilies: {},
          modalities: {},
          durations: {},
          locations: {},
          cpf: 0,
          certifying: 0
        }
      }),
      pending: ref(false),
      error: ref<NuxtError<unknown> | undefined>(undefined),
      refresh: vi.fn()
    })

    const wrapper = await mountPage()

    expect(wrapper.find('#sessions').exists()).toBe(true)
    expect(wrapper.text()).toContain('Places disponibles')
  })

  it('retombe sur les replis pour un centre sans coordonnées ni spécialités', async () => {
    directusCentres.value = [
      {
        slug: 'centre-x',
        name: 'Centre X',
        city: null,
        department: null,
        region: null,
        specialties: null,
        latitude: null,
        longitude: null,
        address: null,
        postal_code: null
      }
    ]

    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Centre X')
  })

  it('retombe sur la distance infinie pour un centre géolocalisé sans coordonnées', async () => {
    const getCurrentPosition = vi.fn(
      (success: (pos: { coords: { latitude: number; longitude: number } }) => void) => {
        success({ coords: { latitude: 48.7909, longitude: 2.4534 } })
      }
    )
    const originalNavigator = globalThis.navigator
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    directusCentres.value = [
      {
        slug: 'centre-x',
        name: 'Centre X',
        city: 'Paris',
        department: '75',
        region: null,
        specialties: ['CACES'],
        latitude: null,
        longitude: null,
        address: null,
        postal_code: null
      },
      {
        slug: 'centre-y',
        name: 'Centre Y',
        city: 'Lyon',
        department: '69',
        region: null,
        specialties: ['CACES'],
        latitude: 45.764,
        longitude: null,
        address: null,
        postal_code: null
      }
    ]

    try {
      const wrapper = await mountPage()
      await wrapper.find('button[aria-label="Activer la géolocalisation"]').trigger('click')
      await nextTick()
      const confirmEl = [...document.body.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Autoriser la géolocalisation')
      )
      await new DOMWrapper(confirmEl!).trigger('click')
      await nextTick()

      expect(getCurrentPosition).toHaveBeenCalled()
      expect(wrapper.find('.centre-distance').exists()).toBe(true)
    } finally {
      vi.stubGlobal('navigator', originalNavigator)
    }
  })

  it('retombe sur les replis pour un article sans champs éditoriaux', async () => {
    directusArticles.value = [
      {
        ...initialArticles[0]!,
        category: null,
        excerpt: null,
        cover_image: null
      }
    ]

    const wrapper = await mountPage()

    expect(wrapper.find('.article').exists()).toBe(true)
  })
})
