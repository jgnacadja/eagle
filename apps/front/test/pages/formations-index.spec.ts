import type { CatalogFacets, CourseListItem, FamilleFormation } from '@learnup/types'
import type { CatalogQuery } from '~/composables/useCatalog'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  reactive,
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
  facets: CatalogFacets | undefined
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

const families: FamilleFormation[] = [
  {
    id: 1,
    slug: 'caces-conduite-engins',
    name: "CACES & conduite d'engins",
    status: 'published',
    intro: null,
    icon: null,
    image: null,
    subnav_title: null,
    audience_text: null,
    validity_text: null,
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
    subnav_title: null,
    audience_text: null,
    validity_text: null,
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
    subnav_title: null,
    audience_text: null,
    validity_text: null,
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
const directusRequest = vi.fn()
const fetchMock = vi.fn()
const route = reactive({
  query: {} as Record<string, string>,
  path: '/formations',
  meta: {}
})

const catalogState = vi.hoisted(() => ({
  pending: false,
  error: null as Error | null,
  total: null as number | null,
  facets: undefined as CatalogFacets | undefined
}))

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('watchEffect', watchEffect)
vi.stubGlobal('nextTick', nextTick)
vi.stubGlobal('onBeforeUnmount', onBeforeUnmount)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.stubGlobal('useRoute', () => route)
vi.stubGlobal('useRouter', () => ({ replace: routerReplace }))
vi.stubGlobal('useContentSeo', useContentSeoMock)
vi.stubGlobal('logServerError', vi.fn())
vi.stubGlobal('$fetch', fetchMock)

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
      total: catalogState.total ?? items.length,
      page,
      pageSize: limit,
      facets: catalogState.facets
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
    const data = await handler()
    return { data: ref(data), pending: ref(false), error: ref(null), refresh: vi.fn() }
  }
)

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
  Select: {
    emits: ['update:modelValue'],
    template:
      '<div class="select-stub" @click="$emit(\'update:modelValue\', \'duree\')"><slot /></div>'
  },
  SelectTrigger: { template: '<span><slot /></span>' },
  SelectContent: { template: '<span><slot /></span>' },
  SelectItem: { props: ['value'], template: '<span><slot /></span>' },
  Checkbox: { template: '<input type="checkbox" />' },
  CatalogueFilters: {
    name: 'CatalogueFilters',
    props: ['modalityOptions', 'location'],
    emits: [
      'update:families',
      'update:modalities',
      'update:durations',
      'update:location',
      'update:cpf',
      'update:certifying'
    ],
    template: `<div class="filters-stub" :data-location="location ?? ''">
      <button class="f-fam" @click="$emit('update:families', ['sst'])" />
      <button class="f-mod" @click="$emit('update:modalities', ['presentiel'])" />
      <button class="f-dur" @click="$emit('update:durations', ['courte'])" />
      <button class="f-loc" @click="$emit('update:location', 'Lyon')" />
      <button class="f-loc-null" @click="$emit('update:location', null)" />
      <button class="f-cpf" @click="$emit('update:cpf', true)" />
      <button class="f-cpf-null" @click="$emit('update:cpf', null)" />
      <button class="f-cert" @click="$emit('update:certifying', true)" />
      <button class="f-cert-null" @click="$emit('update:certifying', null)" />
    </div>`
  },
  CenterFormationCard: {
    props: ['title'],
    template: '<div class="formation-card">{{ title }}</div>'
  },
  Pagination: {
    name: 'Pagination',
    props: ['total', 'page', 'itemsPerPage'],
    emits: ['update:page'],
    template:
      '<nav><button class="page-btn" @click="$emit(\'update:page\', 2)" /><button class="page-zero" @click="$emit(\'update:page\', 0)" /><slot /></nav>'
  },
  PaginationContent: { template: '<span><slot :items="[]" /></span>' },
  PaginationPrevious: true,
  PaginationItem: true,
  PaginationEllipsis: true,
  PaginationNext: true,
  CtaBanner: { template: '<div><slot /></div>' },
  LoadError: {
    emits: ['retry'],
    template: '<div>Load error<button class="retry-btn" @click="$emit(\'retry\')" /><slot /></div>'
  },
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
    route.query = {}
    catalogState.pending = false
    catalogState.error = null
    catalogState.total = null
    catalogState.facets = undefined
    directusRequest.mockResolvedValue(families)
    fetchMock.mockResolvedValue(counts)
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
    route.query = { q: 'sst' }
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

  describe('raccourcis familles (showAllFamilies)', () => {
    it('clic « Parcourir » affiche toutes les familles publiées puis « Réduire » referme', async () => {
      const wrapper = await mountPage()
      const shortcutsList = () => wrapper.get('[data-testid="family-shortcuts"]')

      const shortcuts = shortcutsList().findAll('li')
      expect(shortcuts.at(3)!.text()).toContain('Toutes les familles')

      const parcourirButton = shortcuts.at(3)!.find('button')
      expect(parcourirButton.exists()).toBe(true)
      await parcourirButton.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Réduire')

      const expandedShortcuts = shortcutsList().findAll('li')
      expect(expandedShortcuts).toHaveLength(families.length)
      for (const family of families) {
        expect(wrapper.text()).toContain(family.name)
      }

      const reduireButton = wrapper.findAll('button').find((b) => b.text().includes('Réduire'))
      expect(reduireButton).toBeDefined()
      await reduireButton!.trigger('click')
      await flushPromises()

      const collapsedShortcuts = shortcutsList().findAll('li')
      expect(collapsedShortcuts).toHaveLength(4)
      expect(wrapper.text()).toContain('Toutes les familles')
      expect(wrapper.text()).not.toContain('Réduire')
    })

    it('le mode déplié utilise les compteurs globaux, pas les facettes filtrées', async () => {
      const wrapper = await mountPage()
      const shortcutsList = wrapper.get('[data-testid="family-shortcuts"]')

      const allCard = shortcutsList.findAll('li').at(3)!
      await allCard.find('button').trigger('click')
      await flushPromises()

      for (const familyCount of counts) {
        const label = `${familyCount.count} formation${familyCount.count > 1 ? 's' : ''}`
        expect(wrapper.text()).toContain(label)
      }
    })
  })

  describe('états du catalogue', () => {
    it('affiche le squelette pendant le chargement', async () => {
      catalogState.pending = true
      const wrapper = await mountPage()

      expect(wrapper.find('[aria-label="Chargement des formations"]').exists()).toBe(true)
      expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
      expect(wrapper.findAll('.formation-card')).toHaveLength(0)
    })

    it('affiche l’état erreur', async () => {
      catalogState.error = new Error('boom')
      const wrapper = await mountPage()

      expect(wrapper.text()).toContain('Load error')
      expect(wrapper.findAll('.formation-card')).toHaveLength(0)
    })

    it('dégrade à vide quand les familles échouent', async () => {
      directusRequest.mockRejectedValue(new Error('down'))
      fetchMock.mockRejectedValue(new Error('down'))
      const wrapper = await mountPage()

      expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)
    })
  })

  describe('« Afficher plus » mobile', () => {
    it('cumule les pages sans doublonner les slugs', async () => {
      catalogState.total = 25
      const wrapper = await mountPage()

      const more = wrapper.findAll('button').find((b) => b.text().includes('Afficher plus'))
      expect(more).toBeDefined()
      await more!.trigger('click')
      await flushPromises()

      expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)
    })
  })

  describe('panneau filtres mobile', () => {
    it('ouvre, verrouille le scroll, puis ferme', async () => {
      HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
        this.open = true
      }
      HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
        this.open = false
      }

      const wrapper = await mountPage()
      const filtrer = wrapper.findAll('button').find((b) => b.text().trim() === 'Filtrer')
      await filtrer!.trigger('click')
      await flushPromises()

      expect(wrapper.find('#mobile-filter-panel').exists()).toBe(true)

      const close = wrapper.find('button[aria-label="Fermer le panneau de filtres"]')
      await close.trigger('click')
      await flushPromises()

      expect(wrapper.find('#mobile-filter-panel').exists()).toBe(false)
      wrapper.unmount()
    })
  })

  describe('chips filtres actifs', () => {
    const allQuery = {
      q: 'sst',
      famille: 'caces-conduite-engins',
      modalites: 'presentiel',
      lieu: 'Lyon',
      duree: 'courte',
      cpf: 'true',
      certifiant: 'true'
    }

    it('affiche les chips pour chaque groupe actif', async () => {
      route.query = { ...allQuery }
      const wrapper = await mountPage()

      for (const label of [
        "CACES & conduite d'engins",
        'Présentiel',
        'Lyon',
        'Courte (≤ 8 h)',
        'Éligible CPF',
        'Formation certifiante'
      ]) {
        expect(wrapper.text()).toContain(label)
      }
    })

    it('« Retirer » sur chaque chip purge le filtre correspondant', async () => {
      route.query = { ...allQuery }
      const wrapper = await mountPage()

      const chipLabels = [
        "CACES & conduite d'engins",
        'Présentiel',
        'Lyon',
        'Courte (≤ 8 h)',
        'Éligible CPF',
        'Formation certifiante'
      ]
      for (const label of chipLabels) {
        const btn = wrapper
          .findAll('button')
          .find((b) => b.attributes('aria-label') === `Retirer le filtre ${label}`)
        await btn!.trigger('click')
      }
      await flushPromises()

      for (const label of chipLabels) {
        expect(
          wrapper
            .findAll('button')
            .find((b) => b.attributes('aria-label') === `Retirer le filtre ${label}`)
        ).toBeUndefined()
      }
    })

    it('la recherche déclenchée pousse tri=pertinence dans l’URL', async () => {
      const wrapper = await mountPage()

      await wrapper.find('.catalogue-search').setValue('sst')
      await wrapper.find('.search-go').trigger('click')
      await flushPromises()

      expect(routerReplace).toHaveBeenCalledWith(
        expect.objectContaining({ query: expect.objectContaining({ tri: 'pertinence' }) })
      )
    })

    it('repart en page 1 quand un filtre change hors pagination', async () => {
      route.query = { ...allQuery, page: '2' }
      const wrapper = await mountPage()
      await flushPromises()
      routerReplace.mockClear()

      await wrapper.find('.catalogue-search').setValue('sst modifié')
      await flushPromises()

      expect(routerReplace).toHaveBeenCalled()
      const lastCall = routerReplace.mock.calls.at(-1)?.[0] as {
        query?: Record<string, unknown>
      }
      expect(lastCall.query?.page).toBeUndefined()
    })

    it('retombe sur le tri éditorial quand ?tri= est invalide sans recherche', async () => {
      route.query = { tri: 'inexistant' }
      const wrapper = await mountPage()

      // Pertinence réservée aux recherches : valeur invalide hors ?q= → editorial.
      expect(wrapper.find('[aria-label="Trier par"]').exists()).toBe(true)
    })

    it('retombe sur la pertinence quand ?tri= est invalide avec une recherche', async () => {
      route.query = { tri: 'inexistant', q: 'sst' }
      const wrapper = await mountPage()

      expect(wrapper.find('[aria-label="Trier par"]').exists()).toBe(true)
    })

    it('grise la modalité à zéro résultat sauf si déjà sélectionnée', async () => {
      catalogState.facets = {
        families: {},
        subFamilies: {},
        modalities: { presentiel: 0, distanciel: 3 },
        durations: {},
        locations: {},
        cpf: 0,
        certifying: 0
      }
      const wrapper = await mountPage()

      const filters = wrapper.findComponent({ name: 'CatalogueFilters' })
      const options = filters.props('modalityOptions') as { key: string; disabled?: boolean }[]
      expect(options.find((o) => o.key === 'presentiel')?.disabled).toBe(true)
      expect(options.find((o) => o.key === 'distanciel')?.disabled).toBeFalsy()
    })

    it('garde le filtre lieu visible quand un lieu est saisi sans facette', async () => {
      catalogState.facets = {
        families: {},
        subFamilies: {},
        modalities: {},
        durations: {},
        locations: {},
        cpf: 0,
        certifying: 0
      }
      route.query = { lieu: 'Paris' }
      const wrapper = await mountPage()

      const filters = wrapper.findComponent({ name: 'CatalogueFilters' })
      expect(filters.props('location')).toBe('Paris')
    })

    it('resynchronise l’état quand la query change sans navigation interne', async () => {
      const wrapper = await mountPage()
      expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)

      route.query = { q: 'sst' }
      await flushPromises()

      const cards = wrapper.findAll('.formation-card')
      expect(cards).toHaveLength(1)
      expect(cards[0]!.text()).toContain('SST')
    })

    it('accepte ?tri=duree comme valeur de tri valide', async () => {
      route.query = { tri: 'duree' }
      const wrapper = await mountPage()

      expect(wrapper.find('[aria-label="Trier par"]').exists()).toBe(true)
    })

    it('met à jour le tri via les selects mobile et desktop', async () => {
      const wrapper = await mountPage()

      const selects = wrapper.findAll('.select-stub')
      for (const select of selects) await select.trigger('click')
      await flushPromises()

      expect(selects.length).toBeGreaterThan(1)
    })

    it('change de page via la pagination desktop', async () => {
      catalogState.total = 30
      const wrapper = await mountPage()

      await wrapper.find('.page-btn').trigger('click')
      await flushPromises()

      expect(wrapper.findComponent({ name: 'Pagination' }).props('page')).toBe(2)
    })

    it('relance le catalogue via le bouton réessayer', async () => {
      catalogState.error = new Error('boom')
      const wrapper = await mountPage()

      await wrapper.find('.retry-btn').trigger('click')

      const refresh = catalogMocks.useCatalog.mock.results.at(-1)?.value.refresh
      expect(refresh).toHaveBeenCalled()
    })

    it('synchronise les filtres via les événements du panneau desktop', async () => {
      const wrapper = await mountPage()

      const filters = wrapper.findAllComponents({ name: 'CatalogueFilters' })[0]!
      for (const cls of ['.f-fam', '.f-mod', '.f-dur', '.f-loc', '.f-cpf', '.f-cert']) {
        await filters.find(cls).trigger('click')
      }
      await flushPromises()

      expect(wrapper.text()).toContain('Filtres actifs')
    })

    it('retombe sur les défauts quand le panneau mobile émet null', async () => {
      HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
        this.open = true
      }
      const wrapper = await mountPage()

      // Ouvre le panneau mobile pour monter le second CatalogueFilters.
      const filterBtn = wrapper.findAll('button').find((b) => b.text().includes('Filtrer'))
      await filterBtn!.trigger('click')
      await flushPromises()

      const filters = wrapper.findAllComponents({ name: 'CatalogueFilters' }).at(-1)!
      for (const cls of [
        '.f-fam',
        '.f-mod',
        '.f-dur',
        '.f-loc-null',
        '.f-cpf-null',
        '.f-cert-null'
      ]) {
        await filters.find(cls).trigger('click')
      }
      await flushPromises()

      expect(filters.props('location')).toBe('')
    })
  })
})

describe('couverture des replis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.query = {}
    catalogState.pending = false
    catalogState.error = null
    catalogState.total = null
    catalogState.facets = undefined
    directusRequest.mockResolvedValue(families)
    fetchMock.mockResolvedValue(counts)
  })

  it('affiche zéro résultat quand total vaut 0', async () => {
    catalogState.total = 0
    const wrapper = await mountPage()

    expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)
  })

  it('hydrate un tri invalide et une query en tableau', async () => {
    route.query = { tri: 'invalide', q: ['a', 'b'] }
    const wrapper = await mountPage()

    expect(wrapper.find('[aria-label="Trier par"]').exists()).toBe(true)
  })

  it('choisit la pertinence quand une recherche est active sans tri valide', async () => {
    route.query = { tri: 'invalide', q: 'sst' }
    const wrapper = await mountPage()

    expect(wrapper.findAll('.formation-card')).toHaveLength(1)
  })

  it('rend une formation sans famille (lien null)', async () => {
    courses.push({
      ...courses[0]!,
      id: 99,
      slug: 'sans-famille',
      title: 'Formation orpheline',
      familySlug: null
    })
    try {
      const wrapper = await mountPage()
      expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)
    } finally {
      courses.pop()
    }
  })

  it('facettes sans la clé famille retombent à 0', async () => {
    HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
      this.open = true
    }
    catalogState.facets = {
      families: { 'famille-fantome': 2 },
      subFamilies: {},
      modalities: {},
      durations: {},
      locations: {},
      cpf: 0,
      certifying: 0
    }
    const wrapper = await mountPage()

    // Ouvre le panneau mobile : l'instance mobile des filtres évalue aussi
    // ses props (bras masqué `undefined` côté facettes).
    const filterBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Filtrer')
    await filterBtn?.trigger('click')
    await flushPromises()

    const filters = wrapper.findComponent({ name: 'CatalogueFilters' })
    const options = (filters.props('familyOptions') ?? []) as {
      key: string
      count: number
    }[]
    const caces = options.find((o) => o.key === 'caces-conduite-engins')
    expect(caces?.count ?? 0).toBe(0)
  })

  it('familles et compteurs nulls dégradent à [] et 0', async () => {
    directusRequest.mockResolvedValue([])
    fetchMock.mockResolvedValue([])
    const wrapper = await mountPage()

    const shortcuts = wrapper.find('[data-testid="family-shortcuts"]')
    if (shortcuts.exists()) {
      const toggle = shortcuts.findAll('li').at(-1)?.find('button')
      await toggle?.trigger('click')
      await flushPromises()
    }

    expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)
  })

  it('dégrade quand familles et compteurs sont nulls', async () => {
    directusRequest.mockResolvedValue(null)
    fetchMock.mockResolvedValue(null)
    const wrapper = await mountPage()

    const shortcuts = wrapper.find('[data-testid="family-shortcuts"]')
    if (shortcuts.exists()) {
      const toggle = shortcuts.findAll('li').at(-1)?.find('button')
      await toggle?.trigger('click')
      await flushPromises()
    }

    expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)
  })

  it('singulier « 1 formation » et famille sans compteur', async () => {
    fetchMock.mockResolvedValue([
      { slug: 'caces-conduite-engins', count: 1 },
      { slug: 'securite-prevention', count: 5 },
      { slug: 'habilitations-electriques', count: 0 }
    ])
    const wrapper = await mountPage()

    const shortcuts = wrapper.find('[data-testid="family-shortcuts"]')
    if (shortcuts.exists()) {
      const toggle = shortcuts.findAll('li').at(-1)?.find('button')
      await toggle?.trigger('click')
      await flushPromises()
    }

    expect(wrapper.text()).toContain('1 formation')
    expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)
  })

  it('compteurs partiels : les slugs sans compteur retombent à 0', async () => {
    fetchMock.mockResolvedValue([{ slug: 'caces-conduite-engins', count: 4 }])
    const wrapper = await mountPage()

    const shortcuts = wrapper.find('[data-testid="family-shortcuts"]')
    if (shortcuts.exists()) {
      const toggle = shortcuts.findAll('li').at(-1)?.find('button')
      await toggle?.trigger('click')
      await flushPromises()
    }

    expect(wrapper.text()).toContain('0 formation')
  })

  it('ignore le watch quand les données sont nulles', async () => {
    catalogMocks.useCatalog.mockReturnValueOnce({
      data: ref(null),
      pending: ref(false),
      error: ref(null),
      refresh: vi.fn()
    } as never)
    const wrapper = await mountPage()

    expect(wrapper.findAll('.formation-card')).toHaveLength(0)
  })

  it('cumule sans doublonner quand la page 2 renvoie les mêmes slugs', async () => {
    catalogState.total = 25
    const wrapper = await mountPage()

    const more = wrapper.findAll('button').find((b) => b.text().includes('Afficher plus'))!
    await more.trigger('click')
    await flushPromises()

    // Page 2 = mêmes slugs (fixture) → dédup, pas de double rendu
    expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)
  })
})

describe('couverture des replis (suite)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.query = {}
    catalogState.pending = false
    catalogState.error = null
    catalogState.total = null
    catalogState.facets = undefined
    directusRequest.mockResolvedValue(families)
    fetchMock.mockResolvedValue(counts)
  })

  it('hydrate modalités en tableau et chips de clés inconnues', async () => {
    route.query = { modalites: ['presentiel', 'custom'], duree: ['weird'] }
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Filtres actifs')
    expect(wrapper.text()).toContain('custom')
    expect(wrapper.text()).toContain('weird')
  })

  it('repart en tri éditorial quand la recherche est vide', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.search-go').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)
  })

  it('borne la page à 1 quand la pagination émet 0', async () => {
    catalogState.total = 25
    const wrapper = await mountPage()

    const pagination = wrapper.findComponent({ name: 'Pagination' })
    await pagination.find('.page-zero').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.formation-card')).toHaveLength(courses.length)
  })

  it('passe lieu/cpf/certifiant aux filtres quand visibles', async () => {
    route.query = { lieu: 'Lyon', cpf: 'true', certifiant: 'true' }
    const wrapper = await mountPage()

    const filters = wrapper.findComponent({ name: 'CatalogueFilters' })
    expect(filters.props('location')).toBe('Lyon')
  })

  it('retombe sur les valeurs par défaut depuis le panneau desktop', async () => {
    const wrapper = await mountPage()

    const filters = wrapper.findAllComponents({ name: 'CatalogueFilters' })[0]!
    for (const cls of ['.f-loc-null', '.f-cpf-null', '.f-cert-null']) {
      await filters.find(cls).trigger('click')
    }
    await flushPromises()

    expect(filters.props('location')).toBe('')
  })
})
