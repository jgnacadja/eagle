import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import CenterMap from '~/components/Map/CenterMap.vue'
import * as Leaflet from 'leaflet'

const centers = [
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

vi.mock('leaflet', () => {
  const marker = vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    setIcon: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    openPopup: vi.fn(),
    closePopup: vi.fn(),
    unbindPopup: vi.fn(),
    getLatLng: vi.fn(() => [0, 0]),
    addTo: vi.fn().mockReturnThis()
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
      eachLayer: vi.fn(),
      on: vi.fn(),
      once: vi.fn((_evt: string, cb: () => void) => cb()),
      off: vi.fn(),
      getZoom: vi.fn(() => 12),
      getCenter: vi.fn(() => [0, 0]),
      getSize: vi.fn(() => ({ x: 800, y: 600 })),
      project: vi.fn(() => ({
        x: 0,
        y: 0,
        subtract: vi.fn(() => ({ x: 0, y: -40, distanceTo: vi.fn(() => 10) })),
        distanceTo: vi.fn(() => 10)
      })),
      unproject: vi.fn(() => [0, 0]),
      closePopup: vi.fn()
    })),
    marker,
    divIcon: vi.fn((options) => options),
    tileLayer: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })),
    latLngBounds: vi.fn(() => ({ getCenter: vi.fn(() => [0, 0]) })),
    markerClusterGroup: vi.fn(() => ({
      clearLayers: vi.fn(),
      addLayer: vi.fn(),
      refreshClusters: vi.fn(),
      zoomToShowLayer: vi.fn((_layer: unknown, cb?: () => void) => cb?.())
    }))
  }
})

vi.mock('leaflet/dist/leaflet.css', () => ({}))
vi.mock('leaflet.markercluster', () => ({
  markerClusterGroup: vi.fn(() => ({
    clearLayers: vi.fn(),
    addLayer: vi.fn()
  }))
}))
vi.mock('leaflet.markercluster/dist/MarkerCluster.css', () => ({}))
vi.mock('leaflet.markercluster/dist/MarkerCluster.Default.css', () => ({}))

function mountWithStubs(props: Record<string, unknown>) {
  vi.mocked(Leaflet.markerClusterGroup).mockClear()

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
      centers: [{ ...centers[0], lat: undefined, lng: undefined }],
      activeId: null,
      caption: 'département 94'
    })

    expect(wrapper.text()).toContain('Aucun centre à afficher sur la carte')
  })

  it('renders single mode with the map container and directions link', () => {
    const wrapper = mountWithStubs({
      centers: [centers[0]],
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
})
