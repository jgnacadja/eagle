<template>
  <div
    class="relative isolate flex flex-col overflow-hidden bg-surface-alt"
    :class="[
      mode === 'single' ? 'h-64 rounded-md border border-rule bg-paper' : 'h-full min-h-full',
      { 'items-center justify-center': !hasVisibleCenters }
    ]"
  >
    <p
      v-if="mode === 'network' && hasVisibleCenters"
      class="pointer-events-none absolute left-md top-md z-10 rounded-xs bg-paper/90 px-md py-xs text-meta text-ink-subtle"
    >
      Carte des centres — <span>{{ caption }}</span>
    </p>

    <div class="absolute right-md top-md z-20 flex flex-col gap-sm">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Zoomer"
        class="h-control-sm w-control-sm rounded-sm bg-paper text-ink shadow-sm hover:bg-surface"
        @click="mapInstance?.zoomIn()"
      >
        <IconPlus :size="16" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Dézoomer"
        class="h-control-sm w-control-sm rounded-sm bg-paper text-ink shadow-sm hover:bg-surface"
        @click="mapInstance?.zoomOut()"
      >
        <IconMinus :size="16" />
      </Button>
    </div>

    <div v-if="hasVisibleCenters" ref="mapEl" class="relative z-0 w-full flex-1" />

    <p v-else class="px-gutter text-center text-small text-ink-muted">
      Aucun centre à afficher sur la carte pour ce département.
    </p>

    <div
      v-if="mode === 'single' && hasVisibleCenters"
      class="flex items-center justify-between gap-md border-t border-rule bg-paper px-md py-sm text-small"
    >
      <span class="text-ink-body">{{ centers[0].address }}</span>
      <a
        v-if="centers[0].lat != null && centers[0].lng != null"
        :href="directionsUrl"
        target="_blank"
        rel="noopener"
        class="whitespace-nowrap font-semibold text-primary hover:underline"
      >
        Ouvrir l'itinéraire →
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
/// <reference types="leaflet.markercluster" />
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount, createApp } from 'vue'
import { Button } from '@/components/ui/button'
import IconPlus from '@/components/icons/IconPlus.vue'
import IconMinus from '@/components/icons/IconMinus.vue'
import CenterMapPopup from '@/components/Map/CenterMapPopup.vue'
import type { CenterResult } from '~/types/center-result'
import type * as Leaflet from 'leaflet'

const props = withDefaults(
  defineProps<{
    centers: CenterResult[]
    activeId: string | null
    caption: string
    mode?: 'network' | 'single'
    userPosition?: { lat: number; lng: number } | null
  }>(),
  { mode: 'network', userPosition: null }
)

const emit = defineEmits<{
  select: [id: string]
}>()

const mapEl = ref<HTMLElement | null>(null)
const mapInstance = shallowRef<Leaflet.Map | null>(null)
const markers = new Map<string, Leaflet.Marker>()
const userMarker = shallowRef<Leaflet.Marker | null>(null)
let clusterGroup: Leaflet.MarkerClusterGroup | null = null
let Leaf: typeof import('leaflet') | null = null
let popupApp: ReturnType<typeof createApp> | null = null
let popupMarker: Leaflet.Marker | null = null
let pendingReveal: (() => void) | null = null

const hasVisibleCenters = computed(() => props.centers.some((c) => c.lat != null && c.lng != null))

const directionsUrl = computed(() => {
  const center = props.centers[0]
  if (!center || center.lat == null || center.lng == null) return ''
  return `https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`
})

function cssColor(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback
}

function pinIcon(L: typeof import('leaflet'), selected: boolean): Leaflet.DivIcon {
  const size = selected ? 38 : 30
  const color = selected
    ? cssColor('--color-accent', '#F5A623')
    : cssColor('--color-primary', '#16305A')
  return L.divIcon({
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22s7-7.58 7-13A7 7 0 1 0 5 9c0 5.42 7 13 7 13Z" fill="${color}"/>
      <circle cx="12" cy="9" r="2.6" fill="white"/>
    </svg>`,
    className: 'center-map-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  })
}

function userPinIcon(L: typeof import('leaflet')): Leaflet.DivIcon {
  const color = cssColor('--color-primary', '#16305A')
  const pulse = cssColor('--color-accent', '#F5A623')
  return L.divIcon({
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="${color}" fill-opacity="0.2"/>
      <circle cx="12" cy="12" r="9" fill="${pulse}" fill-opacity="0.25"/>
      <circle cx="12" cy="12" r="5" fill="${color}"/>
      <circle cx="12" cy="12" r="2.5" fill="white"/>
    </svg>`,
    className: 'center-map-user-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
}

async function ensureLeaflet(): Promise<typeof import('leaflet')> {
  if (Leaf) return Leaf
  // Leaflet doit être évalué avant markercluster : le plugin lit le global
  // `L` posé par leaflet à l'exécution (window.L = exports).
  const mod = await import('leaflet')
  await import('leaflet/dist/leaflet.css')
  if (props.mode === 'network') {
    const markerClusterMod = await import('leaflet.markercluster')
    await Promise.all([
      import('leaflet.markercluster/dist/MarkerCluster.css'),
      import('leaflet.markercluster/dist/MarkerCluster.Default.css')
    ])
    if (mod && !mod.markerClusterGroup) {
      const clusterModule = markerClusterMod as {
        MarkerClusterGroup?: typeof Leaflet.MarkerClusterGroup
        default?: { MarkerClusterGroup?: typeof Leaflet.MarkerClusterGroup }
      }
      const MarkerClusterGroup =
        clusterModule.MarkerClusterGroup ?? clusterModule.default?.MarkerClusterGroup
      if (MarkerClusterGroup) {
        mod.MarkerClusterGroup = MarkerClusterGroup
        mod.markerClusterGroup = function (options?: Leaflet.MarkerClusterGroupOptions) {
          return new MarkerClusterGroup(options)
        }
      }
    }
  }
  Leaf = mod
  return Leaf
}

function locationLabel(center: CenterResult): string {
  const parts = center.address.split('·')
  return parts.length > 1 ? parts[1].trim() : (center.address.split(',').pop()?.trim() ?? '')
}

function closePopup() {
  if (pendingReveal && mapInstance.value) {
    mapInstance.value.off('moveend', pendingReveal)
  }
  pendingReveal = null
  popupMarker?.closePopup()
  popupMarker?.unbindPopup()
  popupMarker = null
  popupApp?.unmount()
  popupApp = null
}

function openPopup(center: CenterResult, marker: Leaflet.Marker) {
  closePopup()
  const host = document.createElement('div')
  popupApp = createApp(CenterMapPopup, {
    id: center.id,
    name: center.name,
    locationLabel: locationLabel(center),
    tagsShort: center.tagsShort,
    onClose: () => emit('select', '')
  })
  popupApp.mount(host)
  popupMarker = marker
  marker
    .bindPopup(host, {
      closeButton: false,
      className: 'center-map-popup',
      minWidth: 280,
      autoPan: true,
      autoPanPaddingTopLeft: [16, 56],
      autoPanPaddingBottomRight: [16, 16]
    })
    .openPopup()
}

function buildMarkers(L: typeof import('leaflet')) {
  if (props.mode === 'network' && clusterGroup) {
    clusterGroup.clearLayers()
  } else if (mapInstance.value && props.mode === 'single') {
    mapInstance.value.eachLayer((layer) => {
      if (layer instanceof L.Marker) layer.remove()
    })
  }
  markers.clear()

  if (userMarker.value) {
    userMarker.value.remove()
    userMarker.value = null
  }

  props.centers.forEach((c) => {
    if (c.lat == null || c.lng == null) return
    const marker = L.marker([c.lat, c.lng], { icon: pinIcon(L, c.id === props.activeId) })
    marker.on('click', () => emit('select', c.id))
    markers.set(c.id, marker)
    if (props.mode === 'network' && clusterGroup) {
      clusterGroup.addLayer(marker)
    } else if (mapInstance.value) {
      marker.addTo(mapInstance.value)
    }
  })

  if (props.userPosition && mapInstance.value) {
    const marker = L.marker([props.userPosition.lat, props.userPosition.lng], {
      icon: userPinIcon(L),
      zIndexOffset: 1000
    })
    marker.addTo(mapInstance.value)
    userMarker.value = marker
  }
}

function fitToMarkers(L: typeof import('leaflet')) {
  const coords = props.centers
    .filter((c) => c.lat != null && c.lng != null)
    .map((c) => [c.lat, c.lng] as [number, number])

  if (props.userPosition) {
    coords.push([props.userPosition.lat, props.userPosition.lng])
  }

  if (!coords.length || !mapInstance.value) return
  if (coords.length === 1) {
    mapInstance.value.setView(coords[0], props.mode === 'single' ? 15 : 13)
  } else {
    mapInstance.value.fitBounds(L.latLngBounds(coords), { padding: [40, 40] })
  }
}

function syncActive(L: typeof import('leaflet'), id: string | null) {
  markers.forEach((m, markerId) => m.setIcon(pinIcon(L, markerId === id)))
  clusterGroup?.refreshClusters()

  if (!id || props.mode === 'single') {
    closePopup()
    return
  }

  const center = props.centers.find((c) => c.id === id)
  const marker = markers.get(id)
  if (!center || !marker || !mapInstance.value) return

  const reveal = () => {
    const map = mapInstance.value
    if (!map) return
    // Un seul pan explicite : le marqueur se positionne sous le centre de la
    // carte, laissant la place à la popup au-dessus. La popup n'est ouverte
    // qu'une fois le déplacement terminé pour éviter que l'autoPan de Leaflet
    // n'annule l'animation en cours (le marqueur finissait en bas de carte).
    const zoom = map.getZoom()
    const size = map.getSize()
    const offsetY = Math.min(Math.round(size.y * 0.2), 140)
    const target = map.unproject(map.project(marker.getLatLng(), zoom).subtract([0, offsetY]), zoom)
    if (map.project(map.getCenter(), zoom).distanceTo(map.project(target, zoom)) < 1) {
      openPopup(center, marker)
      return
    }
    pendingReveal = () => {
      pendingReveal = null
      openPopup(center, marker)
    }
    map.once('moveend', pendingReveal)
    map.panTo(target)
  }

  if (props.mode === 'network' && clusterGroup) {
    clusterGroup.zoomToShowLayer(marker, reveal)
  } else {
    reveal()
  }
}

onMounted(async () => {
  if (!mapEl.value || !props.centers.length) return
  const L = await ensureLeaflet()
  mapInstance.value = L.map(mapEl.value, { zoomControl: false })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(mapInstance.value)

  if (props.mode === 'network') {
    clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) =>
        L.divIcon({
          html: `<div class="center-map-cluster" style="background:${cssColor('--color-primary', '#16305A')}">${cluster.getChildCount()}</div>`,
          className: '',
          iconSize: [36, 36]
        })
    })
    mapInstance.value.addLayer(clusterGroup)
  }

  buildMarkers(L)
  fitToMarkers(L)
  if (props.activeId) syncActive(L, props.activeId)

  mapInstance.value?.on?.('dragstart', closePopup)
  mapInstance.value?.on?.('zoomstart', closePopup)
})

watch(
  () => props.activeId,
  async (id) => {
    const L = await ensureLeaflet()
    syncActive(L, id)
  }
)

watch(
  () => props.centers,
  async () => {
    if (!mapInstance.value) return
    const L = await ensureLeaflet()
    buildMarkers(L)
    fitToMarkers(L)
  }
)

watch(
  () => props.userPosition,
  async () => {
    if (!mapInstance.value) return
    const L = await ensureLeaflet()
    buildMarkers(L)
    fitToMarkers(L)
  }
)

onBeforeUnmount(() => {
  closePopup()
  mapInstance.value?.remove()
})
</script>

<style>
.center-map-pin {
  background: transparent;
  border: 0;
}
.center-map-cluster {
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}
.center-map-popup .leaflet-popup-content-wrapper {
  padding: 0;
  border-radius: 12px;
}
.center-map-popup .leaflet-popup-content {
  margin: 0;
}
/* Leaflet force `color` sur les liens (.leaflet-container a) et sur le
   contenu de popup (#333) : on restaure la couleur du bouton (text-paper). */
.leaflet-container .center-map-popup a {
  color: inherit;
}
.leaflet-container .center-map-popup a.text-paper {
  color: var(--color-paper);
}
</style>
