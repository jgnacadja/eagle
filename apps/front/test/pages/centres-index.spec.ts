import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, nextTick, reactive, ref, Suspense, toValue } from 'vue'
import type { CentresQuery } from '~/composables/useCentres'
import CentresPage from '~/pages/centres/index.vue'

const seoMock = vi.fn()

const directusCentres = [
  {
    id: 1,
    status: 'published',
    slug: 'creteil',
    name: 'Centre de Créteil',
    address: '14 rue des Refuzniks',
    city: 'Créteil',
    postal_code: '94000',
    department: 'Val-de-Marne',
    region: 'Île-de-France',
    specialties: ['CACES', 'SST'],
    departments_covered: ['94', '93'],
    latitude: 48.7909,
    longitude: 2.4534
  },
  {
    id: 2,
    status: 'published',
    slug: 'vitry',
    name: 'Centre de Vitry-sur-Seine',
    address: '2 avenue de Vitry',
    city: 'Vitry-sur-Seine',
    postal_code: '94400',
    department: 'Val-de-Marne',
    region: 'Île-de-France',
    specialties: ['CACES'],
    departments_covered: ['94'],
    latitude: 48.7938,
    longitude: 2.3899
  },
  {
    id: 3,
    status: 'published',
    slug: 'lyon',
    name: 'Centre de Lyon',
    address: '12 cours Lafayette',
    city: 'Lyon',
    postal_code: '69003',
    department: 'Rhône',
    region: 'Auvergne-Rhône-Alpes',
    specialties: ['Informatique'],
    departments_covered: ['69'],
    latitude: 45.764,
    longitude: 4.8357
  }
]

const centresFixture = { value: directusCentres }

// Rejoue côté mock le filtrage que Directus applique via buildCentresQuery :
// le composable reçoit la query réactive de la page et dérive la liste.
function filterFixture(query: CentresQuery) {
  let list = centresFixture.value
  const department = query.department?.trim()
  if (department) {
    list = list.filter(
      (c) => c.department === department || (c.departments_covered ?? []).includes(department)
    )
  }
  const search = query.search?.trim().toLowerCase()
  if (search) {
    list = list.filter(
      (c) =>
        [c.name, c.city, c.postal_code, c.address].some((f) => f?.toLowerCase().includes(search)) ||
        (c.specialties ?? []).some((s) => s.toLowerCase() === search)
    )
  }
  return list
}

const routeStub = reactive({ query: {} as Record<string, string> })

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useContentSeo', seoMock)
vi.stubGlobal('useRoute', () => routeStub)
vi.stubGlobal('useCentres', (query: Parameters<typeof toValue>[0]) => ({
  data: computed(() => filterFixture(toValue(query) as CentresQuery)),
  pending: ref(false),
  error: ref(null),
  refresh: vi.fn()
}))
vi.stubGlobal('useCentreDepartments', () => ({
  data: computed(() => {
    const set = new Set<string>()
    for (const c of centresFixture.value) {
      if (c.department) set.add(c.department)
      for (const dept of c.departments_covered ?? []) set.add(dept)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
  }),
  pending: ref(false),
  error: ref(null),
  refresh: vi.fn()
}))

const stubs = {
  NuxtLink: { template: '<a><slot /></a>' },
  Label: { template: '<label><slot /></label>' },
  Select: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<select class="dept-select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>'
  },
  SelectTrigger: { template: '<span><slot /></span>' },
  SelectContent: { template: '<span><slot /></span>' },
  SelectItem: {
    props: ['value'],
    template: '<option :value="value"><slot /></option>'
  },
  SearchInput: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'submit'],
    template:
      '<input class="city-search" :value="modelValue" @keydown.enter="$emit(\'submit\', $event.target.value)" />'
  },
  Button: { template: '<button><slot /></button>' },
  CenterResultCard: {
    props: ['center', 'active'],
    emits: ['select'],
    template:
      '<div class="center-card" :data-active="active" @click="$emit(\'select\', center.id)">{{ center.name }}</div>'
  }
}

async function mountPage() {
  const Host = defineComponent({
    render() {
      return h(Suspense, () => h(CentresPage))
    }
  })
  const wrapper = mount(Host, { global: { stubs } })
  await flushPromises()
  return wrapper
}

describe('pages/centres/index', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    centresFixture.value = directusCentres
    routeStub.query = {}
  })

  it('affiche les centres issus de Directus', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Réseau de centres')
    expect(wrapper.findAll('.center-card')).toHaveLength(3)
    expect(wrapper.text()).toContain('3 centres')
    // Le premier centre est actif par défaut (watch immediate).
    expect(wrapper.find('.center-card').attributes('data-active')).toBe('true')
  })

  it('limite la liste au panneau desktop sans bloquer le scroll de la page', async () => {
    const wrapper = await mountPage()
    const list = wrapper.find('[data-testid="centres-scroll-list"]')

    expect(list.classes()).toContain('lg:h-full')
    expect(list.classes()).toContain('lg:overflow-y-auto')
    expect(list.classes()).not.toContain('lg:overscroll-contain')
    expect(list.element.parentElement?.classList.contains('lg:overflow-hidden')).toBe(true)
  })

  it("n'affiche la fin de liste que si son contenu déborde", async () => {
    const wrapper = await mountPage()
    const list = wrapper.find('[data-testid="centres-scroll-list"]').element

    Object.defineProperties(list, {
      clientHeight: { configurable: true, value: 400 },
      scrollHeight: { configurable: true, value: 300 }
    })
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(wrapper.text()).not.toContain('Vous avez atteint la fin de la liste')

    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 1000 })
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(wrapper.text()).toContain('Vous avez atteint la fin de la liste')
  })

  it('affiche trois skeletons pendant le chargement du lot suivant', async () => {
    centresFixture.value = Array.from({ length: 15 }, (_, index) => ({
      ...directusCentres[0]!,
      id: index + 1,
      slug: `centre-${index + 1}`,
      name: `Centre ${index + 1}`
    }))
    const OriginalIntersectionObserver = globalThis.IntersectionObserver
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame
    let observerCallback:
      ((entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void) | undefined
    let frameCallback: ((time: number) => void) | undefined

    class IntersectionObserverMock {
      root = null
      rootMargin = ''
      thresholds = []

      constructor(
        callback: (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void
      ) {
        observerCallback = callback
      }

      disconnect() {
        return undefined
      }
      observe() {
        return undefined
      }
      takeRecords() {
        return []
      }
      unobserve() {
        return undefined
      }
    }

    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
    vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) => {
      frameCallback = callback
      return 1
    })

    const wrapper = await mountPage()
    expect(wrapper.findAll('.center-card')).toHaveLength(12)

    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver
    )
    await nextTick()
    expect(
      wrapper.findAll('[aria-label="Chargement de centres supplémentaires"] > div')
    ).toHaveLength(3)

    frameCallback?.(0)
    await flushPromises()
    expect(wrapper.findAll('.center-card')).toHaveLength(15)
    expect(wrapper.find('[aria-label="Chargement de centres supplémentaires"]').exists()).toBe(
      false
    )

    wrapper.unmount()
    vi.stubGlobal('IntersectionObserver', OriginalIntersectionObserver)
    vi.stubGlobal('requestAnimationFrame', originalRequestAnimationFrame)
  })

  it('construit le filtre département depuis les données', async () => {
    const wrapper = await mountPage()

    const options = wrapper.findAll('option').map((o) => o.text())
    expect(options).toContain('Tous les départements')
    expect(options).toContain('Val-de-Marne')
    expect(options).toContain('Rhône')
    expect(options).toContain('94')
  })

  it('filtre les centres par département', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.dept-select').setValue('Val-de-Marne')
    expect(wrapper.findAll('.center-card')).toHaveLength(2)

    await wrapper.find('.dept-select').setValue('Rhône')
    expect(wrapper.findAll('.center-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('Centre de Lyon')
  })

  it('ne filtre pas pendant la saisie, seulement à la soumission', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.city-search').setValue('vitry')
    expect(wrapper.findAll('.center-card')).toHaveLength(3)

    await wrapper.find('.city-search').trigger('keydown.enter')
    const cards = wrapper.findAll('.center-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.text()).toContain('Vitry-sur-Seine')
  })

  it('démarre la recherche automatiquement depuis ?q=', async () => {
    routeStub.query = { q: 'vitry' }
    const wrapper = await mountPage()

    const input = wrapper.find('.city-search').element as HTMLInputElement
    expect(input.value).toBe('vitry')
    expect(wrapper.findAll('.center-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('Vitry-sur-Seine')
  })

  it('applique une recherche arrivée via ?q= après le montage', async () => {
    const wrapper = await mountPage()
    expect(wrapper.findAll('.center-card')).toHaveLength(3)

    routeStub.query = { q: 'vitry' }
    await nextTick()

    expect(wrapper.findAll('.center-card')).toHaveLength(1)
  })

  it('filtre les centres par la recherche ville/code postal', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.city-search').setValue('vitry')
    await wrapper.find('.city-search').trigger('keydown.enter')

    const cards = wrapper.findAll('.center-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.text()).toContain('Vitry-sur-Seine')
  })

  it('affiche l’état vide quand aucun centre ne correspond', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.city-search').setValue('zzz-inexistant')
    await wrapper.find('.city-search').trigger('keydown.enter')

    expect(wrapper.findAll('.center-card')).toHaveLength(0)
    expect(wrapper.text()).toContain('Aucun centre ne correspond à cette sélection')
  })

  it('un clic sur une carte active/désactive le centre', async () => {
    const wrapper = await mountPage()

    const first = wrapper.find('.center-card')
    expect(first.attributes('data-active')).toBe('true')

    await first.trigger('click')
    expect(first.attributes('data-active')).toBe('false')

    await first.trigger('click')
    expect(first.attributes('data-active')).toBe('true')
  })

  it('définit le SEO de la page réseau', async () => {
    await mountPage()

    expect(seoMock).toHaveBeenCalledWith(
      expect.objectContaining({ seo_title: 'Réseau de centres — LEARN UP ACADEMY' }),
      'Réseau de centres — LEARN UP ACADEMY'
    )
  })

  it('demande la géolocalisation au montage et trie les centres par distance', async () => {
    interface MockPosition {
      coords: {
        latitude: number
        longitude: number
        altitude: null
        accuracy: number
        altitudeAccuracy: null
        heading: null
        speed: null
      }
      timestamp: number
    }

    const getCurrentPosition = vi.fn((success: (position: MockPosition) => void) => {
      success({
        coords: {
          latitude: 48.8589,
          longitude: 2.347,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      })
    })

    const originalNavigator = globalThis.navigator
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition }
    })

    try {
      const wrapper = await mountPage()

      expect(getCurrentPosition).toHaveBeenCalledOnce()

      const cards = wrapper.findAll('.center-card').map((w) => w.text())
      expect(cards[0]).toContain('Vitry-sur-Seine')
      expect(cards[1]).toContain('Créteil')
      expect(cards[2]).toContain('Lyon')
    } finally {
      vi.stubGlobal('navigator', originalNavigator)
    }
  })
})
