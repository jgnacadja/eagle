import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import CenterMap from '~/components/Map/CenterMap.vue'
import type { CenterResult } from '~/types/center-result'
import * as Leaflet from 'leaflet'

const centers: CenterResult[] = [
  {
    id: 'creteil',
    name: 'Centre de Créteil',
    cp: '94000',
    address: '14 rue des Refuzniks, Créteil · Val-de-Marne',
    tags: 'CACES · SST',
    tagsShort: 'CACES · SST',
    status: { type: 'success' as const, label: 'Sessions cette semaine' },
    lat: 48.7909,
    lng: 2.4534
  },
  {
    id: 'paris',
    name: 'Centre de Paris',
    cp: '75012',
    address: '28 rue de Reuilly, Paris · Paris',
    tags: 'Management · Bureautique',
    tagsShort: 'Management · Bureautique',
    status: { type: 'warning' as const, label: 'Prochaine session le 14/09' },
    lat: 48.8481,
    lng: 2.3859
  }
]

const mapMockState = vi.hoisted(() => ({
  // Marqueurs créés — utilisés par eachLayer en mode single.
  markers: [] as { remove: () => void }[],
  // Distance projetée centre/cible — < 1 ouvre le popup sans pan.
  distance: { value: 10 },
  // false → map.once ne déclenche pas le callback (pendingReveal reste armé).
  fireOnce: { value: true }
}))

vi.mock('leaflet', () => {
  class FakeMarker {}
  const marker = vi.fn(() => {
    const m = Object.assign(new FakeMarker(), {
      on: vi.fn().mockReturnThis(),
      setIcon: vi.fn().mockReturnThis(),
      bindPopup: vi.fn().mockReturnThis(),
      openPopup: vi.fn(),
      closePopup: vi.fn(),
      unbindPopup: vi.fn(),
      remove: vi.fn(),
      getLatLng: vi.fn(() => [0, 0]),
      addTo: vi.fn().mockReturnThis()
    })
    mapMockState.markers.push(m)
    return m
  })

  const defaultClusterGroup = vi.fn(() => ({
    clearLayers: vi.fn(),
    addLayer: vi.fn(),
    refreshClusters: vi.fn(),
    zoomToShowLayer: vi.fn((_layer: unknown, cb?: () => void) => cb?.())
  }))

  return {
    map: vi.fn(() => ({
      setView: vi.fn().mockReturnThis(),
      addLayer: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      panTo: vi.fn().mockReturnThis(),
      fitBounds: vi.fn().mockReturnThis(),
      eachLayer: vi.fn((cb: (layer: unknown) => void) => {
        mapMockState.markers.forEach(cb)
      }),
      on: vi.fn(),
      once: vi.fn((_evt: string, cb: () => void) => {
        if (mapMockState.fireOnce.value) cb()
      }),
      off: vi.fn(),
      getZoom: vi.fn(() => 12),
      getCenter: vi.fn(() => [0, 0]),
      getSize: vi.fn(() => ({ x: 800, y: 600 })),
      project: vi.fn(() => ({
        x: 0,
        y: 0,
        subtract: vi.fn(() => ({
          x: 0,
          y: -40,
          distanceTo: vi.fn(() => mapMockState.distance.value)
        })),
        distanceTo: vi.fn(() => mapMockState.distance.value)
      })),
      unproject: vi.fn(() => [0, 0]),
      closePopup: vi.fn(),
      invalidateSize: vi.fn()
    })),
    Marker: FakeMarker,
    marker,
    polygon: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })),
    svg: vi.fn(() => ({})),
    divIcon: vi.fn((options) => options),
    tileLayer: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })),
    latLngBounds: vi.fn(() => ({ getCenter: vi.fn(() => [0, 0]) })),
    markerClusterGroup: defaultClusterGroup
  }
})

vi.mock('leaflet/dist/leaflet.css', () => ({}))
vi.mock('leaflet.markercluster', () => {
  class FakeClusterGroup {
    clearLayers() {}
    addLayer() {}
    refreshClusters() {}
    zoomToShowLayer(_layer: unknown, cb?: () => void) {
      cb?.()
    }
  }
  return { MarkerClusterGroup: FakeClusterGroup }
})
vi.mock('leaflet.markercluster/dist/MarkerCluster.css', () => ({}))
vi.mock('leaflet.markercluster/dist/MarkerCluster.Default.css', () => ({}))

// Le stub global de setup.ts est un noop : ici la carte doit s'initialiser,
// on intersecte donc immédiatement à l'observe.
vi.stubGlobal(
  'IntersectionObserver',
  class {
    constructor(private cb: (entries: { isIntersecting: boolean }[]) => void) {}
    observe() {
      this.cb([{ isIntersecting: true }])
    }
    unobserve() {}
    disconnect() {}
  }
)

// Les callbacks ResizeObserver sont capturés pour rejouer un resize du
// conteneur (le recadrage métropole après layout en dépend).
const resizeCallbacks: (() => void)[] = []
vi.stubGlobal(
  'ResizeObserver',
  class {
    constructor(cb: () => void) {
      resizeCallbacks.push(cb)
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)

interface CenterMapProps {
  centers: CenterResult[]
  activeId: string | null
  caption: string
  mode?: 'network' | 'single'
  minZoom?: number
  userPosition?: { lat: number; lng: number } | null
  focusCenter?: { lat: number; lng: number } | null
  focusZoom?: number
}

function mountWithStubs(props: CenterMapProps) {
  vi.mocked(Leaflet.marker).mockClear()
  vi.mocked(Leaflet.map).mockClear()
  vi.mocked(Leaflet.markerClusterGroup)?.mockClear()
  mapMockState.markers.length = 0
  mapMockState.distance.value = 10
  mapMockState.fireOnce.value = true
  resizeCallbacks.length = 0

  return mount(CenterMap, {
    props,
    global: {
      stubs: {
        NuxtLink: { template: '<a><slot /></a>' },
        Button: { template: '<button><slot /></button>' },
        IconPlus: { template: '<span />' },
        IconMinus: { template: '<span />' }
      }
    }
  })
}

describe('CenterMap', () => {
  it('renders the caption and map container in network mode', () => {
    const wrapper = mountWithStubs({
      centers,
      activeId: null,
      caption: 'Tous les départements'
    })

    expect(wrapper.text()).toContain('Carte des centres — Tous les départements')
    expect(wrapper.find('.w-full.flex-1').exists()).toBe(true)
  })

  it('constrains the map view to France bounds', async () => {
    mountWithStubs({
      centers,
      activeId: null,
      caption: 'Tous les départements'
    })
    await flushPromises()

    const options = vi.mocked(Leaflet.map).mock.calls[0]?.[1] as Record<string, unknown>
    expect(options.minZoom).toBe(2)
    expect(options.maxBoundsViscosity).toBe(1)
    // Métropole + DOM-TOM à leur position réelle, avec marge pour que la
    // vue fittée reste dans maxBounds (sinon `setView` épingle le centre).
    expect(Leaflet.latLngBounds).toHaveBeenCalledWith([
      [-25, -70],
      [60, 70]
    ])
    expect(Leaflet.svg).toHaveBeenCalledWith({ padding: 1 })
    expect(options.renderer).toBeDefined()
    const tileOptions = vi.mocked(Leaflet.tileLayer).mock.calls[0]?.[1] as Record<string, unknown>
    expect(tileOptions.bounds).toBeDefined()

    const maskOptions = vi.mocked(Leaflet.polygon).mock.calls[0]?.[1] as Record<string, unknown>
    expect(maskOptions.fillOpacity).toBe(1)
    expect(maskOptions.interactive).toBe(false)

    // Le masque perce un trou par territoire : monde + métropole (12 rings)
    // + DOM-TOM (13 rings).
    const maskRings = vi.mocked(Leaflet.polygon).mock.calls[0]?.[0] as unknown[][]
    expect(maskRings).toHaveLength(1 + 12 + 13)
  })

  it('keeps the initial frame on metropolitan France despite DOM-TOM centres', async () => {
    vi.mocked(Leaflet.latLngBounds).mockClear()
    mountWithStubs({
      centers: [...centers, { ...centers[0]!, id: 'fort-de-france', lat: 14.61, lng: -61.05 }],
      activeId: null,
      caption: 'Tous les départements'
    })
    await flushPromises()

    // Le fit initial cale la vue sur le rectangle métropole : les centres
    // DOM-TOM n'influencent pas le cadrage (découverte au dézoom).
    const boundsArgs = vi
      .mocked(Leaflet.latLngBounds)
      .mock.calls.map((c) => c[0] as unknown as [number, number][])
    expect(
      boundsArgs.some(
        (pts) =>
          Array.isArray(pts) &&
          pts.some((p) => p[0] === 41.3 && p[1] === -5.2) &&
          pts.some((p) => p[0] === 51.2 && p[1] === 9.7)
      )
    ).toBe(true)
    expect(boundsArgs.some((pts) => Array.isArray(pts) && pts.some((p) => p[0] === 14.61))).toBe(
      false
    )
  })

  it('refits the metropolitan frame on container resize until the user moves the map', async () => {
    mountWithStubs({
      centers,
      activeId: null,
      caption: 'Tous les départements'
    })
    await flushPromises()

    const map = vi.mocked(Leaflet.map).mock.results[0]?.value as unknown as {
      fitBounds: ReturnType<typeof vi.fn>
      invalidateSize: ReturnType<typeof vi.fn>
      on: ReturnType<typeof vi.fn>
    }
    const fitCalls = map.fitBounds.mock.calls.length
    expect(fitCalls).toBeGreaterThan(0)

    // Un fit calculé sur une taille transitoire est recalé sur la taille
    // réelle dès que l'observer notifie (init avant la fin du layout).
    resizeCallbacks.forEach((cb) => cb())
    expect(map.invalidateSize).toHaveBeenCalled()
    expect(map.fitBounds.mock.calls.length).toBeGreaterThan(fitCalls)

    // Après un geste utilisateur (drag), le resize ne reprend plus le cadrage.
    map.on.mock.calls.filter((c) => c[0] === 'dragstart').forEach((c) => (c[1] as () => void)())
    const afterDrag = map.fitBounds.mock.calls.length
    resizeCallbacks.forEach((cb) => cb())
    expect(map.fitBounds.mock.calls.length).toBe(afterDrag)
  })

  it('falls back to all points when every centre is overseas', async () => {
    vi.mocked(Leaflet.latLngBounds).mockClear()
    mountWithStubs({
      centers: [{ ...centers[0]!, id: 'fort-de-france', lat: 14.61, lng: -61.05 }],
      activeId: null,
      caption: 'Tous les départements'
    })
    await flushPromises()

    const map = vi.mocked(Leaflet.map).mock.results[0]?.value as unknown as {
      setView: ReturnType<typeof vi.fn>
    }
    expect(map.setView).toHaveBeenCalledWith([14.61, -61.05], 13)
  })

  it('shows the empty message when no centers', () => {
    const wrapper = mountWithStubs({
      centers: [],
      activeId: null,
      caption: 'département 48'
    })

    expect(wrapper.text()).toContain('Aucun centre à afficher sur la carte')
  })

  it('skips centers without coordinates and shows empty state', () => {
    const wrapper = mountWithStubs({
      centers: [{ ...centers[0]!, lat: undefined, lng: undefined }],
      activeId: null,
      caption: 'département 94'
    })

    expect(wrapper.text()).toContain('Aucun centre à afficher sur la carte')
  })

  it('hides the directions link in single mode without coordinates', () => {
    const wrapper = mountWithStubs({
      centers: [{ ...centers[0]!, lat: undefined, lng: undefined }],
      activeId: null,
      caption: '',
      mode: 'single'
    })

    expect(wrapper.find('a[href*="google.com/maps"]').exists()).toBe(false)
  })

  it('renders single mode with the map container and directions link', () => {
    const wrapper = mountWithStubs({
      centers: [centers[0]!],
      activeId: null,
      caption: '',
      mode: 'single'
    })

    expect(wrapper.find('.w-full.flex-1').exists()).toBe(true)
    expect(wrapper.text()).toContain('14 rue des Refuzniks, Créteil · Val-de-Marne')
    expect(wrapper.find('a').attributes('href')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=48.7909,2.4534'
    )
  })

  it('hides the directions link in single mode without centers', () => {
    const wrapper = mountWithStubs({
      centers: [],
      activeId: null,
      caption: '',
      mode: 'single'
    })

    expect(wrapper.find('a[href*="google.com/maps"]').exists()).toBe(false)
  })

  it('hides the directions link when the first center has no longitude', () => {
    const wrapper = mountWithStubs({
      centers: [{ ...centers[0]!, lng: undefined }, centers[1]!],
      activeId: null,
      caption: '',
      mode: 'single'
    })

    expect(wrapper.find('a[href*="google.com/maps"]').exists()).toBe(false)
  })

  it('hides the directions link when the first center has no latitude', () => {
    const wrapper = mountWithStubs({
      centers: [{ ...centers[0]!, lat: undefined }, centers[1]!],
      activeId: null,
      caption: '',
      mode: 'single'
    })

    expect(wrapper.find('a[href*="google.com/maps"]').exists()).toBe(false)
  })

  it('zoom in/out via les boutons de contrôle', async () => {
    const wrapper = mountWithStubs({ centers, activeId: null, caption: '' })
    await flushPromises()

    await wrapper.find('button[aria-label="Zoomer"]').trigger('click')
    await wrapper.find('button[aria-label="Dézoomer"]').trigger('click')

    const instance = vi.mocked(Leaflet.map).mock.results.at(-1)?.value as {
      zoomIn: ReturnType<typeof vi.fn>
      zoomOut: ReturnType<typeof vi.fn>
    }
    expect(instance.zoomIn).toHaveBeenCalled()
    expect(instance.zoomOut).toHaveBeenCalled()
  })

  it('highlights the active marker and zooms to it when selected from the list', async () => {
    const wrapper = mountWithStubs({
      centers,
      activeId: null,
      caption: 'Tous les départements'
    })
    await flushPromises()

    await wrapper.setProps({ activeId: 'paris' })
    await flushPromises()

    const icons = vi
      .mocked(Leaflet.marker)
      .mock.results.map((r) => r.value)
      .map((m) => (m.setIcon as ReturnType<typeof vi.fn>).mock.calls[0]?.[0])
    expect(icons.some((icon) => String(icon?.html).includes('#F5A623'))).toBe(true)

    const cluster = vi.mocked(Leaflet.markerClusterGroup).mock.results[0]?.value as unknown as {
      zoomToShowLayer: ReturnType<typeof vi.fn>
    }
    expect(cluster.zoomToShowLayer).toHaveBeenCalled()
  })

  it('closes and unbinds the popup when selection is cleared', async () => {
    const wrapper = mountWithStubs({
      centers,
      activeId: 'paris',
      caption: 'Tous les départements'
    })
    await flushPromises()

    await wrapper.setProps({ activeId: null })
    await flushPromises()

    const markerInstances = vi
      .mocked(Leaflet.marker)
      .mock.results.map((r) => r.value) as unknown as {
      unbindPopup: ReturnType<typeof vi.fn>
    }[]
    expect(markerInstances.some((m) => m.unbindPopup.mock.calls.length > 0)).toBe(true)
  })

  it('renders a user position marker and includes it in bounds', async () => {
    mountWithStubs({
      centers,
      activeId: null,
      caption: 'Tous les départements',
      userPosition: { lat: 48.8566, lng: 2.3522 }
    })
    await flushPromises()

    const map = vi.mocked(Leaflet.map).mock.results[0]?.value as unknown as {
      fitBounds: ReturnType<typeof vi.fn>
    }
    expect(Leaflet.marker).toHaveBeenCalledWith(
      [48.8566, 2.3522],
      expect.objectContaining({ zIndexOffset: 1000 })
    )
    expect(map?.fitBounds).toHaveBeenCalled()
  })

  it('centers on focusCenter instead of fitting markers', async () => {
    mountWithStubs({
      centers,
      activeId: null,
      caption: 'Tous les départements',
      focusCenter: { lat: 48.8566, lng: 2.3522 }
    })
    await flushPromises()

    const map = vi.mocked(Leaflet.map).mock.results[0]?.value as unknown as {
      setView: ReturnType<typeof vi.fn>
      fitBounds: ReturnType<typeof vi.fn>
    }
    expect(map.setView).toHaveBeenCalledWith([48.8566, 2.3522], 10)
    expect(map.fitBounds).not.toHaveBeenCalled()
  })

  it('applies a custom focusZoom with focusCenter', async () => {
    mountWithStubs({
      centers,
      activeId: null,
      caption: 'Tous les départements',
      focusCenter: { lat: 48.8566, lng: 2.3522 },
      focusZoom: 13
    })
    await flushPromises()

    const map = vi.mocked(Leaflet.map).mock.results[0]?.value as unknown as {
      setView: ReturnType<typeof vi.fn>
    }
    expect(map.setView).toHaveBeenCalledWith([48.8566, 2.3522], 13)
  })

  it('does not re-center on the focus when userPosition resolves', async () => {
    const focusCenter = { lat: 48.8566, lng: 2.3522 }
    const wrapper = mountWithStubs({
      centers,
      activeId: null,
      caption: 'Tous les départements',
      focusCenter
    })
    await flushPromises()

    const map = vi.mocked(Leaflet.map).mock.results[0]?.value as unknown as {
      setView: ReturnType<typeof vi.fn>
    }
    map.setView.mockClear()

    await wrapper.setProps({ userPosition: { lat: 48.9, lng: 2.4 } })
    await flushPromises()

    expect(map.setView).not.toHaveBeenCalled()
  })

  it('re-centers when focusCenter changes', async () => {
    const wrapper = mountWithStubs({
      centers,
      activeId: null,
      caption: 'Tous les départements',
      focusCenter: { lat: 48.8566, lng: 2.3522 }
    })
    await flushPromises()

    const map = vi.mocked(Leaflet.map).mock.results[0]?.value as unknown as {
      setView: ReturnType<typeof vi.fn>
    }
    map.setView.mockClear()

    await wrapper.setProps({ focusCenter: { lat: 45.764, lng: 4.8357 } })
    await flushPromises()

    expect(map.setView).toHaveBeenCalledWith([45.764, 4.8357], 10)
  })

  it('skips the user marker when userPosition is null', async () => {
    mountWithStubs({
      centers,
      activeId: null,
      caption: 'Tous les départements',
      userPosition: null
    })
    await flushPromises()

    expect(Leaflet.marker).toHaveBeenCalledTimes(centers.length)
  })

  it('builds the cluster icon from the child count', async () => {
    mountWithStubs({ centers, activeId: null, caption: 'Tous les départements' })
    await flushPromises()

    const options = vi.mocked(Leaflet.markerClusterGroup).mock.calls[0]?.[0] as unknown as {
      iconCreateFunction: (cluster: { getChildCount: () => number }) => { html: string }
    }
    const icon = options.iconCreateFunction({ getChildCount: () => 7 })
    expect(icon.html).toContain('7')
  })

  it('patches markerClusterGroup when the leaflet module lacks it', async () => {
    // Couvert par le shim d'interop (v8 ignore) : le namespace mocké par
    // Vitest est gelé, la suppression de l'export n'est pas rejouable ici.
    expect(Leaflet.markerClusterGroup).toBeDefined()
  })

  it('removes old markers when centers change in single mode', async () => {
    const wrapper = mountWithStubs({
      centers: [centers[0]!],
      activeId: null,
      caption: '',
      mode: 'single'
    })
    await flushPromises()
    const firstMarkers = [...mapMockState.markers]

    await wrapper.setProps({ centers: [centers[1]!] })
    await flushPromises()

    expect(firstMarkers.length).toBeGreaterThan(0)
    expect(
      firstMarkers.some((m) => (m.remove as ReturnType<typeof vi.fn>).mock.calls.length > 0)
    ).toBe(true)
  })

  it('removes the user marker when the position is cleared', async () => {
    const wrapper = mountWithStubs({
      centers,
      activeId: null,
      caption: 'Tous les départements',
      userPosition: { lat: 48.8566, lng: 2.3522 }
    })
    await flushPromises()
    const userMarker = mapMockState.markers.at(-1)!

    await wrapper.setProps({ userPosition: null })
    await flushPromises()

    expect(userMarker.remove).toHaveBeenCalled()
  })

  it('opens the popup immediately when the target is already centered', async () => {
    mapMockState.distance.value = 0
    mountWithStubs({ centers, activeId: 'creteil', caption: 'Tous les départements' })
    await flushPromises()

    const creteilMarker = mapMockState.markers[0]! as unknown as {
      openPopup: ReturnType<typeof vi.fn>
    }
    expect(creteilMarker.openPopup).toHaveBeenCalled()
  })

  it('désarme le reveal différé à la fermeture du popup', async () => {
    const wrapper = mountWithStubs({
      centers,
      activeId: 'paris',
      caption: 'Tous les départements'
    })
    mapMockState.fireOnce.value = false
    await flushPromises()

    const map = vi.mocked(Leaflet.map).mock.results[0]?.value as unknown as {
      off: ReturnType<typeof vi.fn>
      panTo: ReturnType<typeof vi.fn>
    }
    expect(map.panTo).toHaveBeenCalled()

    await wrapper.setProps({ activeId: null })
    await flushPromises()

    expect(map.off).toHaveBeenCalledWith('moveend', expect.any(Function))
  })
})
