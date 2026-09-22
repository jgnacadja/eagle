import { DOMWrapper, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, nextTick, reactive, ref, Suspense, toValue } from 'vue'
import type { CentresQuery } from '~/composables/useCentres'
import { useGeolocation } from '~/composables/useGeolocation'
import CentresPage from '~/pages/centres/index.vue'

const seoMock = vi.fn()
const navigateToMock = vi.fn()

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

// Rejoue la traduction code → nom que l'API applique côté serveur
// (`departments_covered` est un champ tags libre — codes ou noms).
const COVERED_NAMES: Record<string, string> = {
  '69': 'Rhône',
  '92': 'Hauts-de-Seine',
  '93': 'Seine-Saint-Denis',
  '94': 'Val-de-Marne'
}

const centresFixture = ref(directusCentres)

// Rejoue côté mock le filtrage que l'API /centres applique : le composable
// reçoit la query réactive de la page et dérive la liste.
function filterFixture(query: CentresQuery) {
  let list = centresFixture.value
  const department = query.department?.trim()
  if (department) {
    // Code ou nom indifféremment, dans les deux sens — comme l'API.
    const matches = (value: string | undefined) =>
      !!value &&
      (value === department ||
        COVERED_NAMES[value] === department ||
        value === COVERED_NAMES[department])
    list = list.filter((c) => matches(c.department) || (c.departments_covered ?? []).some(matches))
  }
  const search = query.search?.trim().toLowerCase()
  if (search) {
    list = list.filter(
      (c) =>
        [c.name, c.city, c.postal_code, c.address, c.region].some((f) =>
          f?.toLowerCase().includes(search)
        ) || (c.specialties ?? []).some((s) => s.toLowerCase() === search)
    )
  }
  return list
}

const routeStub = reactive({ query: {} as Record<string, string> })

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useContentSeo', seoMock)
vi.stubGlobal('useRoute', () => routeStub)
vi.stubGlobal('navigateTo', navigateToMock)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
// Reverse geocoding (GET /centres/reverse) : silencieux par défaut — les
// tests de pré-remplissage le surchargent avec une réponse de département.
const reverseFetchMock = vi.fn().mockResolvedValue({ city: null, department: null })
vi.stubGlobal('$fetch', reverseFetchMock)
vi.stubGlobal('useCentres', (query: Parameters<typeof toValue>[0]) => ({
  data: computed(() => filterFixture(toValue(query) as CentresQuery)),
  pending: ref(false),
  error: ref(null),
  refresh: vi.fn()
}))
vi.stubGlobal('useCentresTotal', () => ({
  data: computed(() => centresFixture.value.length),
  pending: ref(false),
  error: ref(null),
  refresh: vi.fn()
}))
vi.stubGlobal('useCentreDepartments', () => ({
  data: computed(() => {
    // Rejoue la normalisation de l'API : les codes `departments_covered`
    // sont traduits en noms et dédupliqués avec le département géocodé.
    const set = new Set<string>()
    for (const c of centresFixture.value) {
      for (const value of [c.department, ...(c.departments_covered ?? [])]) {
        const name = value ? (COVERED_NAMES[value] ?? value) : ''
        if (name) set.add(name)
      }
    }
    // « Ain » : département listé sans centre implanté — permet de tester
    // l'état « département sans centre » (RG01).
    return [...set, 'Ain'].sort((a, b) => a.localeCompare(b, 'fr'))
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
      '<span><input class="city-search" :value="modelValue" @keydown.enter="$emit(\'submit\', $event.target.value)" /><slot name="action" /></span>'
  },
  Button: { template: '<button><slot /></button>' },
  CenterMap: {
    props: ['centers', 'activeId', 'caption', 'minZoom', 'mode', 'popup', 'focusCenter'],
    emits: ['select'],
    template:
      '<div class="center-map" :data-active-id="activeId" :data-popup="String(popup)" :data-focus="focusCenter ? `${focusCenter.lat},${focusCenter.lng}` : \'\'" />'
  },
  CenterResultCard: {
    props: ['center', 'active'],
    emits: ['select'],
    template:
      '<div class="center-card" :data-active="active" @click="$emit(\'select\', center.id)">{{ center.name }}</div>'
  }
}

const mountedWrappers: ReturnType<typeof mount>[] = []

async function mountPage() {
  const Host = defineComponent({
    render() {
      return h(Suspense, () => h(CentresPage))
    }
  })
  const wrapper = mount(Host, { global: { stubs } })
  mountedWrappers.push(wrapper)
  await flushPromises()
  return wrapper
}

// Le Dialog reka-ui est téléporté dans document.body : hors de l'arbre du
// wrapper — on interroge le document directement.
function findDialogButton(text: string) {
  const el = [...document.body.querySelectorAll('button')].find((b) =>
    b.textContent?.includes(text)
  )
  return el ? new DOMWrapper(el) : undefined
}

// Parcours explicite « Près de moi » : clic badge → dialog de
// consentement maison → « Autoriser la géolocalisation » → demande navigateur.
async function activateGeo(wrapper: Awaited<ReturnType<typeof mountPage>>) {
  await wrapper.find('button[aria-label="Activer la géolocalisation"]').trigger('click')
  await nextTick()
  const confirm = findDialogButton('Autoriser la géolocalisation')
  expect(confirm, 'le dialog de consentement doit être ouvert').toBeTruthy()
  await confirm!.trigger('click')
  await flushPromises()
}

describe('pages/centres/index', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    centresFixture.value = directusCentres
    routeStub.query = {}
    // État géo partagé au niveau module : reset entre tests. `navigator`
    // sans `permissions` : happy-dom résoudrait `granted`, ce qui court-
    // circuite le dialog de consentement (permission déjà accordée).
    vi.stubGlobal('navigator', {})
    const geo = useGeolocation()
    geo.clear()
    geo.permission.value = null
  })

  // Les pages des tests précédents resteraient montées : leurs watchers sur
  // la route partagée (routeStub) redéclencheraient la géolocalisation.
  afterEach(() => {
    while (mountedWrappers.length) mountedWrappers.pop()!.unmount()
  })

  it('affiche les centres issus de Directus', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Réseau de centres')
    expect(wrapper.findAll('.center-card')).toHaveLength(3)
    expect(wrapper.text()).toContain('3 centres')
    // Aucun centre actif par défaut : la sélection reste un geste explicite.
    expect(wrapper.find('.center-card').attributes('data-active')).toBe('false')
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
    // Les codes `departments_covered` sont traduits en noms, jamais affichés bruts.
    expect(options).toContain('Seine-Saint-Denis')
    expect(options).not.toContain('94')
  })

  it('filtre les centres par département', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.dept-select').setValue('Val-de-Marne')
    expect(wrapper.findAll('.center-card')).toHaveLength(2)

    await wrapper.find('.dept-select').setValue('Rhône')
    expect(wrapper.findAll('.center-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('Centre de Lyon')

    // Un département seulement « couvert » (code 93 → nom) filtre aussi.
    await wrapper.find('.dept-select').setValue('Seine-Saint-Denis')
    expect(wrapper.findAll('.center-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('Centre de Créteil')
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

  it('démarre la recherche depuis ?region= (navigation menus)', async () => {
    routeStub.query = { region: 'Auvergne-Rhône-Alpes' }
    const wrapper = await mountPage()

    const input = wrapper.find('.city-search').element as HTMLInputElement
    expect(input.value).toBe('Auvergne-Rhône-Alpes')
    const cards = wrapper.findAll('.center-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.text()).toContain('Lyon')
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

  it('garde le total réseau dans le hero pendant une recherche filtrée', async () => {
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('3 centres couvrent')
    expect(wrapper.text()).toMatch(/3\s+centres\s+au total/)

    await wrapper.find('.city-search').setValue('vitry')
    await wrapper.find('.city-search').trigger('keydown.enter')

    expect(wrapper.findAll('.center-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('3 centres couvrent')
    // « au total » serait trompeur sous une recherche active.
    expect(wrapper.text()).toMatch(/1\s+centre\s+pour « vitry »/)
    expect(wrapper.text()).not.toContain('au total')
  })

  it('conserve la sélection explicite sur un refetch à données identiques', async () => {
    const wrapper = await mountPage()
    await wrapper.findAll('.center-card')[1]!.trigger('click')
    expect(wrapper.findAll('.center-card')[1]!.attributes('data-active')).toBe('true')

    // Même ids, nouvel array : le watch ne doit pas réinitialiser.
    centresFixture.value = [...directusCentres]
    await nextTick()

    expect(wrapper.findAll('.center-card')[1]!.attributes('data-active')).toBe('true')
  })

  it('épingle la carte du centre en bas uniquement après sélection explicite', async () => {
    const wrapper = await mountPage()

    const mapToggle = wrapper.findAll('button').find((b) => b.text().includes('Voir la carte'))
    await mapToggle!.trigger('click')

    // Sans sélection explicite : pas de carte épinglée, aucun centre actif
    // sur les cartes (pas de popup au chargement).
    expect(wrapper.findAll('.center-card')).toHaveLength(3)
    let maps = wrapper.findAll('.center-map')
    expect(maps[0]!.attributes('data-active-id')).toBeUndefined()
    expect(maps[0]!.attributes('data-popup')).toBe('false')
    expect(maps[1]!.attributes('data-active-id')).toBeUndefined()

    // Après un clic explicite : carte épinglée + centre actif sur la carte.
    await wrapper.findAll('.center-card')[1]!.trigger('click')
    expect(wrapper.findAll('.center-card')).toHaveLength(4)
    maps = wrapper.findAll('.center-map')
    expect(maps[0]!.attributes('data-active-id')).toBe('vitry')

    const pinnedCard = wrapper.find('.center-card.sticky')
    expect(pinnedCard.exists()).toBe(true)
    expect(pinnedCard.classes()).toContain('bottom-sm')
    expect(pinnedCard.classes()).toContain('mb-sm')
    expect(pinnedCard.classes()).not.toContain('fixed')
    expect(pinnedCard.attributes('style')).toBeUndefined()
  })

  it('cadre tout le réseau par défaut et le groupe dense d’un département', async () => {
    const wrapper = await mountPage()

    let maps = wrapper.findAll('.center-map')
    // Sans filtre : pas de focus forcé — fitBounds cadre tout le réseau.
    expect(maps[0]!.attributes('data-focus')).toBe('')

    await wrapper.find('.dept-select').setValue('Val-de-Marne')
    // Département choisi : centroïde du groupe Créteil+Vitry ≈ 48.79, 2.42.
    maps = wrapper.findAll('.center-map')
    const expected = `${(48.7909 + 48.7938) / 2},${(2.4534 + 2.3899) / 2}`
    expect(maps[0]!.attributes('data-focus')).toBe(expected)
  })

  it('affiche l’état vide quand aucun centre ne correspond', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.city-search').setValue('zzz-inexistant')
    await wrapper.find('.city-search').trigger('keydown.enter')

    expect(wrapper.findAll('.center-card')).toHaveLength(0)
    expect(wrapper.text()).toContain('Aucun centre ne correspond à cette sélection')
  })

  it('affiche l’état « département sans centre » avec la note RG01', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.dept-select').setValue('Ain')

    expect(wrapper.findAll('.center-card')).toHaveLength(0)
    expect(wrapper.text()).toContain("Aucun centre n'est implanté dans ce département")
    expect(wrapper.text()).toContain("d'un département voisin")
    expect(wrapper.text()).toContain('Choisir un autre département')
    expect(wrapper.text()).toContain("Aucun centre voisin n'est injecté automatiquement")
    expect(wrapper.text()).toMatch(/0\s+centre\s+en\s+Ain/)

    // « Choisir un autre département » ré-élargit le périmètre.
    const reset = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Choisir un autre département'))
    await reset!.trigger('click')
    expect(wrapper.findAll('.center-card')).toHaveLength(3)
  })

  it('navigue vers la fiche au clic sur une carte en mode liste mobile', async () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = (() => ({ matches: false }) as MediaQueryList) as typeof window.matchMedia

    try {
      const wrapper = await mountPage()
      await wrapper.findAll('.center-card')[1]!.trigger('click')

      expect(navigateToMock).toHaveBeenCalledWith('/centres/vitry')
      // Pas de sélection : la popup sticky est réservée au mode carte.
      expect(wrapper.find('.center-card.sticky').exists()).toBe(false)
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it('un clic sur une carte active/désactive le centre', async () => {
    const wrapper = await mountPage()

    const first = wrapper.find('.center-card')
    expect(first.attributes('data-active')).toBe('false')

    await first.trigger('click')
    expect(first.attributes('data-active')).toBe('true')

    await first.trigger('click')
    expect(first.attributes('data-active')).toBe('false')
  })

  it('définit le SEO de la page réseau', async () => {
    await mountPage()

    expect(seoMock).toHaveBeenCalledWith(
      expect.objectContaining({ seo_title: 'Réseau de centres — LEARN UP ACADEMY' }),
      'Réseau de centres — LEARN UP ACADEMY'
    )
  })

  it('ne demande pas la géolocalisation au montage — le badge « Près de moi » trie par distance', async () => {
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

      // Jamais de demande automatique : uniquement via le badge + consentement.
      expect(getCurrentPosition).not.toHaveBeenCalled()
      await activateGeo(wrapper)
      expect(getCurrentPosition).toHaveBeenCalledOnce()

      const cards = wrapper.findAll('.center-card').map((w) => w.text())
      expect(cards[0]).toContain('Vitry-sur-Seine')
      expect(cards[1]).toContain('Créteil')
      expect(cards[2]).toContain('Lyon')
    } finally {
      vi.stubGlobal('navigator', originalNavigator)
    }
  })

  it('conserve l’ordre relatif des centres sans coordonnées pendant le tri', async () => {
    const getCurrentPosition = vi.fn(
      (success: (position: { coords: { latitude: number; longitude: number } }) => void) => {
        success({ coords: { latitude: 48.8589, longitude: 2.347 } })
      }
    )

    const originalNavigator = globalThis.navigator
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition }
    })

    // Deux centres non géolocalisés encadrent un centre géolocalisé : le
    // comparateur doit renvoyer 0 entre eux, sans les réordonner.
    centresFixture.value = [
      { ...directusCentres[0]!, slug: 'sans-geo-a', name: 'Centre Alpha' },
      { ...directusCentres[1]!, slug: 'avec-geo', name: 'Centre Beta' },
      { ...directusCentres[2]!, slug: 'sans-geo-b', name: 'Centre Gamma' }
    ].map((c, i) =>
      i === 1 ? c : { ...c, latitude: null, longitude: null }
    ) as typeof directusCentres

    try {
      const wrapper = await mountPage()
      await activateGeo(wrapper)

      const cards = wrapper.findAll('.center-card').map((w) => w.text())
      expect(cards[0]).toContain('Beta')
      expect(cards[1]).toContain('Alpha')
      expect(cards[2]).toContain('Gamma')
    } finally {
      vi.stubGlobal('navigator', originalNavigator)
    }
  })

  it('?geo=1 ouvre le dialog de consentement puis déclenche la demande', async () => {
    const getCurrentPosition = vi.fn()
    const originalNavigator = globalThis.navigator
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })

    try {
      await mountPage()
      expect(getCurrentPosition).not.toHaveBeenCalled()

      // « Près de moi » (menu mobile) navigue vers /centres?geo=1 — le
      // changement de query rouvre le dialog sans remonter la page.
      routeStub.query = { geo: '1' }
      await flushPromises()

      const confirm = findDialogButton('Autoriser la géolocalisation')
      expect(confirm, 'le dialog de consentement doit être ouvert').toBeTruthy()
      await confirm!.trigger('click')
      await flushPromises()
      expect(getCurrentPosition).toHaveBeenCalledOnce()
    } finally {
      vi.stubGlobal('navigator', originalNavigator)
    }
  })

  it('?geo=1 au chargement ouvre directement le dialog de consentement', async () => {
    const getCurrentPosition = vi.fn()
    const originalNavigator = globalThis.navigator
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    routeStub.query = { geo: '1' }

    try {
      await mountPage()
      await nextTick()
      expect(document.body.textContent).toContain('Voir les centres autour de vous')
      expect(getCurrentPosition).not.toHaveBeenCalled()
    } finally {
      vi.stubGlobal('navigator', originalNavigator)
    }
  })

  it('un second clic sur le badge désactive la géolocalisation', async () => {
    const getCurrentPosition = vi.fn(
      (success: (position: { coords: { latitude: number; longitude: number } }) => void) => {
        success({ coords: { latitude: 45.764, longitude: 4.8357 } }) // Lyon
      }
    )
    const originalNavigator = globalThis.navigator
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    reverseFetchMock.mockResolvedValue({ city: 'Lyon', department: 'Rhône' })

    try {
      const wrapper = await mountPage()
      await activateGeo(wrapper)

      let select = wrapper.find('.dept-select').element as HTMLSelectElement
      expect(select.value).toBe('Rhône')
      expect(wrapper.findAll('.center-card')).toHaveLength(1)

      // Toggle off : position oubliée, tri distance retiré, filtre
      // auto-rempli réinitialisé.
      await wrapper.find('button[aria-label="Désactiver la géolocalisation"]').trigger('click')
      await flushPromises()

      select = wrapper.find('.dept-select').element as HTMLSelectElement
      expect(select.value).toBe('all')
      expect(wrapper.findAll('.center-card')).toHaveLength(3)
    } finally {
      vi.stubGlobal('navigator', originalNavigator)
      reverseFetchMock.mockResolvedValue({ city: null, department: null })
    }
  })

  it('pré-remplit le filtre département depuis la position géocodée', async () => {
    const getCurrentPosition = vi.fn(
      (success: (position: { coords: { latitude: number; longitude: number } }) => void) => {
        success({ coords: { latitude: 45.764, longitude: 4.8357 } }) // Lyon
      }
    )
    const originalNavigator = globalThis.navigator
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    reverseFetchMock.mockResolvedValue({ city: 'Lyon', department: 'Rhône' })

    try {
      const wrapper = await mountPage()
      await activateGeo(wrapper)
      await flushPromises()

      expect(reverseFetchMock).toHaveBeenCalledWith('http://api.test/centres/reverse', {
        query: { lat: 45.764, lng: 4.8357 }
      })
      const select = wrapper.find('.dept-select').element as HTMLSelectElement
      expect(select.value).toBe('Rhône')
      expect(wrapper.findAll('.center-card')).toHaveLength(1)
      expect(wrapper.text()).toContain('Centre de Lyon')
    } finally {
      vi.stubGlobal('navigator', originalNavigator)
      reverseFetchMock.mockResolvedValue({ city: null, department: null })
    }
  })

  it('normalise la valeur détectée sur la graphie canonique de la liste', async () => {
    const getCurrentPosition = vi.fn(
      (success: (position: { coords: { latitude: number; longitude: number } }) => void) => {
        success({ coords: { latitude: 48.7909, longitude: 2.4534 } }) // Créteil
      }
    )
    const originalNavigator = globalThis.navigator
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    // Variante tag libre : « Val de Marne » doit sélectionner « Val-de-Marne ».
    reverseFetchMock.mockResolvedValue({ city: 'Créteil', department: 'val de marne' })

    try {
      const wrapper = await mountPage()
      await activateGeo(wrapper)
      await flushPromises()

      const select = wrapper.find('.dept-select').element as HTMLSelectElement
      expect(select.value).toBe('Val-de-Marne')
      expect(wrapper.findAll('.center-card')).toHaveLength(2)
    } finally {
      vi.stubGlobal('navigator', originalNavigator)
      reverseFetchMock.mockResolvedValue({ city: null, department: null })
    }
  })

  it('n’écrase pas un département choisi manuellement', async () => {
    const getCurrentPosition = vi.fn(
      (success: (position: { coords: { latitude: number; longitude: number } }) => void) => {
        success({ coords: { latitude: 45.764, longitude: 4.8357 } })
      }
    )
    const originalNavigator = globalThis.navigator
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    reverseFetchMock.mockResolvedValue({ city: 'Lyon', department: 'Rhône' })

    try {
      const wrapper = await mountPage()

      await wrapper.find('button[aria-label="Activer la géolocalisation"]').trigger('click')
      await nextTick()
      const confirm = findDialogButton('Autoriser la géolocalisation')
      await confirm!.trigger('click')

      // L'utilisateur choisit son périmètre avant la réponse du reverse.
      await wrapper.find('.dept-select').setValue('Val-de-Marne')
      await flushPromises()

      const select = wrapper.find('.dept-select').element as HTMLSelectElement
      expect(select.value).toBe('Val-de-Marne')
      expect(wrapper.findAll('.center-card')).toHaveLength(2)
    } finally {
      vi.stubGlobal('navigator', originalNavigator)
      reverseFetchMock.mockResolvedValue({ city: null, department: null })
    }
  })
})
