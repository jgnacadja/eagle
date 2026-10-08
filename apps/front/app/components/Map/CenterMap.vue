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
        size="icon-box"
        aria-label="Zoomer"
        class="shadow-sm"
        @click="zoomIn"
      >
        <IconPlus :size="16" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-box"
        aria-label="Dézoomer"
        class="shadow-sm"
        @click="zoomOut"
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
      class="flex items-center justify-between gap-md border-t border-dashed border-rule bg-paper px-md py-md text-small"
    >
      <!-- Adresse masquée pour le moment (demande métier) — décommenter le
           span pour rétablir. Le lien itinéraire reste actif. -->
      <a
        v-if="centers[0]!.lat != null && centers[0]!.lng != null"
        :href="directionsUrl"
        target="_blank"
        rel="noopener"
        class="whitespace-nowrap font-semibold text-primary transition-colors hover:text-accent-text"
      >
        Ouvrir l'itinéraire <span class="link-arrow">→</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
/// <reference types="leaflet.markercluster" />
import { ref, shallowRef, computed, watch, onBeforeUnmount, createApp } from 'vue'
import { Button } from '@/components/ui/button'
import IconPlus from '@/components/icons/IconPlus.vue'
import IconMinus from '@/components/icons/IconMinus.vue'
import CenterMapPopup from '@/components/Map/CenterMapPopup.vue'
import { centreLocationLabel } from '~/utils/centre'
import franceOutline from '~/assets/geo-france-outline.json'
import domtomOutline from '~/assets/geo-domtom-outline.json'
import type { CenterResult } from '~/types/center-result'
import type * as Leaflet from 'leaflet'

const props = withDefaults(
  defineProps<{
    centers: CenterResult[]
    activeId: string | null
    caption: string
    mode?: 'network' | 'single'
    minZoom?: number
    popup?: boolean
    userPosition?: { lat: number; lng: number } | null
    /** Vue forcée (ville/zoom) — prioritaire sur le fit des marqueurs. */
    focusCenter?: { lat: number; lng: number } | null
    /** Zoom appliqué avec `focusCenter` (10 = commune et proche couronne). */
    focusZoom?: number
  }>(),
  {
    mode: 'network',
    // Zoom monde autorisé : les DOM-TOM ne sont visibles qu'en dézoomant
    // (la vue initiale reste cadrée sur les centres présents).
    minZoom: 2,
    popup: true,
    userPosition: null,
    focusCenter: null,
    focusZoom: 10
  }
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
let resizeObserver: ResizeObserver | null = null
let visibilityObserver: IntersectionObserver | null = null
// Dernier focus appliqué : un changement de `centers`/`userPosition` ne doit
// pas re-cadrer la carte si l'utilisateur l'a déjà déplacée.
let lastFocus: { lat: number; lng: number } | null = null
// Vrai dès que l'utilisateur déplace la carte lui-même (drag, molette,
// double-clic, boutons +/−) : un resize du conteneur ne recadre plus.
let userMoved = false

function markUserMoved() {
  userMoved = true
}

function zoomIn() {
  markUserMoved()
  mapInstance.value?.zoomIn()
}

function zoomOut() {
  markUserMoved()
  mapInstance.value?.zoomOut()
}

const hasVisibleCenters = computed(() => props.centers.some((c) => c.lat != null && c.lng != null))

// France entière — métropole, Corse et DOM-TOM à leur position réelle
// (rectangle union de tous les territoires) : le réseau est national,
// l'utilisateur ne doit ni sortir du territoire ni voir les pays voisins
// (le tileLayer ne charge pas de tuiles hors de ces limites). Les bords
// dépassent l'union exacte : `setView` borne le centre pour que la vue
// reste dans maxBounds — un rectangle trop juste épinglerait le fit
// métropole sur un bord (vue plus grande que la bbox à petit zoom).
const FRANCE_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-25, -70],
  [60, 70]
]

const WORLD_RING: [number, number][] = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180]
]

// Import statique (pas de fetch) : le contour doit être disponible dès
// l'init de la carte, sinon le monde entier apparaît brièvement au premier
// drag avant que le masque n'arrive.
const FRANCE_OUTLINE = franceOutline as [number, number][][]

// Contours simplifiés des DOM-TOM (gregoiredavid/france-geojson,
// « departements-avec-outre-mer », Ramer-Douglas-Peucker ε=0.0025°) :
// autant de trous supplémentaires dans le masque, pour que les
// territoires restent visibles et navigables à leur position réelle.
const DOMTOM_OUTLINE = domtomOutline as [number, number][][]

// Rectangle métropole + Corse (l'ancienne maxBounds) : sert à exclure les
// points DOM-TOM du cadrage automatique — la vue reste centrée sur la
// métropole, les territoires se découvrent en dézoomant.
const METRO_BOUNDS: [[number, number], [number, number]] = [
  [41.3, -5.2],
  [51.2, 9.7]
]

function inMetro([lat, lng]: [number, number]): boolean {
  const [[s, w], [n, e]] = METRO_BOUNDS
  return lat >= s && lat <= n && lng >= w && lng <= e
}

const directionsUrl = computed(() => {
  // Lu uniquement quand le v-if du lien itinéraire est vrai → coords garanties.
  const center = props.centers[0]!
  return `https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`
})

function cssColor(varName: string, fallback: string): string {
  /* v8 ignore next -- SSR guard, window always exists in tests */
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
    /* v8 ignore start — shims d'interop ESM/CJS : les namespaces de module
       mockés par Vitest sont gelés, la branche est inatteignable en test. */
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
    /* v8 ignore end */
  }
  Leaf = mod
  return Leaf
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
    locationLabel: centreLocationLabel(center),
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

  const up = props.userPosition
  if (up && Number.isFinite(up.lat) && Number.isFinite(up.lng) && mapInstance.value) {
    const marker = L.marker([up.lat, up.lng], {
      icon: userPinIcon(L),
      zIndexOffset: 1000
    })
    marker.addTo(mapInstance.value)
    userMarker.value = marker
  }
}

function fitToMarkers(L: typeof import('leaflet')) {
  if (props.focusCenter) {
    // Zoom communal-départemental : la ville et sa proche couronne.
    if (props.focusCenter !== lastFocus) {
      mapInstance.value?.setView([props.focusCenter.lat, props.focusCenter.lng], props.focusZoom)
      lastFocus = props.focusCenter
    }
    return
  }
  lastFocus = null
  const coords = props.centers
    .filter((c) => c.lat != null && c.lng != null)
    .map((c) => [c.lat, c.lng] as [number, number])

  if (
    props.userPosition &&
    Number.isFinite(props.userPosition.lat) &&
    Number.isFinite(props.userPosition.lng)
  ) {
    coords.push([props.userPosition.lat, props.userPosition.lng])
  }

  // Cadrage « comme avant » : centré sur la métropole. Les centres DOM-TOM
  // n'influencent pas le fit — ils apparaissent en dézoomant, avec leurs
  // pastilles de cluster. Repli sur tous les points quand rien n'est en
  // métropole (réseau 100 % outre-mer, fiche DOM en mode single).
  const metroCoords = props.mode === 'network' ? coords.filter(inMetro) : coords
  const fitCoords = metroCoords.length ? metroCoords : coords

  const first = fitCoords[0]
  if (!first || !mapInstance.value) return
  if (fitCoords.length === 1) {
    mapInstance.value.setView(first, props.mode === 'single' ? 15 : 13)
  } else {
    // L'ancienne maxBounds (= bbox métropole) forçait le centrage sur la
    // France entière. Pour garder ce cadrage alors que maxBounds couvre
    // désormais le monde français, le fit inclut les coins du rectangle
    // métropole — la vue ne dépend plus de la répartition des centres.
    const frame =
      props.mode === 'network' && metroCoords.length
        ? [...fitCoords, METRO_BOUNDS[0], METRO_BOUNDS[1]]
        : fitCoords
    mapInstance.value.fitBounds(L.latLngBounds(frame), { padding: [40, 40] })
  }
}

function syncActive(L: typeof import('leaflet'), id: string | null) {
  markers.forEach((m, markerId) => m.setIcon(pinIcon(L, markerId === id)))
  clusterGroup?.refreshClusters()

  // `popup: false` (mobile) : le marqueur actif est seulement surligné —
  // la fiche s'affiche dans la carte épinglée en bas d'écran, pas dans
  // une popup Leaflet.
  if (!id || props.mode === 'single' || !props.popup) {
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
    userMoved = true
    map.panTo(target)
  }

  clusterGroup?.zoomToShowLayer(marker, reveal)
}

// Init déclenché par `watch(mapEl)` : `mapEl` est sous `v-if` et peut
// apparaître après le montage quand les centres arrivent en async — un
// `onMounted` unique ratait ce cas et la carte restait vide jusqu'au
// rechargement.
async function initMap(el: HTMLElement) {
  if (mapInstance.value) return
  const L = await ensureLeaflet()
  // L'import dynamique laisse le temps à l'élément d'être retiré du DOM.
  if (mapInstance.value || mapEl.value !== el) return
  mapInstance.value = L.map(el, {
    zoomControl: false,
    minZoom: props.minZoom,
    maxBounds: L.latLngBounds(FRANCE_MAX_BOUNDS),
    maxBoundsViscosity: 1.0,
    // Le renderer SVG ne couvre que le viewport + padding et n'est redessiné
    // qu'au moveend : pendant un drag, la bande révélée n'a plus de masque et
    // les pays voisins apparaissent un instant. padding 1 = 3× le viewport.
    renderer: L.svg({ padding: 1 })
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    bounds: L.latLngBounds(FRANCE_MAX_BOUNDS),
    // `updateWhenIdle` vaut true par défaut sur mobile : les tuiles des
    // zones révélées n'étaient demandées qu'au moveend → zones grises
    // pendant et après le pan. false = chargement continu.
    updateWhenIdle: false
  }).addTo(mapInstance.value)

  // Masque opaque hors de France : à petit zoom les tuiles OSM couvrent des
  // pays entiers, `bounds` ne suffit pas — on couvre le reste du monde de la
  // couleur de fond, avec des trous à la forme réelle des territoires
  // (métropole + DOM-TOM). Appliqué
  // de façon synchrone à l'init (import statique) pour ne jamais laisser
  // apparaître les pays voisins. Le polygone va dans l'overlayPane
  // (z < markerPane) : les pins et clusters restent visibles au-dessus.
  L.polygon([WORLD_RING, ...FRANCE_OUTLINE, ...DOMTOM_OUTLINE], {
    stroke: false,
    fillColor: cssColor('--color-surface-alt', '#edf2fa'),
    fillOpacity: 1,
    interactive: false,
    noClip: true
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
  mapInstance.value?.on?.('dragstart', markUserMoved)
  el.addEventListener('wheel', markUserMoved, { passive: true })
  el.addEventListener('touchstart', markUserMoved, { passive: true })
  el.addEventListener('dblclick', markUserMoved)

  // Leaflet fige la taille du conteneur à l'init : un resize ultérieur
  // (panneau mobile, breakpoint hidden lg:block, fontes) laissait des
  // zones sans tuiles jusqu'au rechargement. L'observation initiale
  // déclenche un invalidateSize qui couvre aussi un init avant la fin
  // du layout.
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      mapInstance.value?.invalidateSize()
      // invalidateSize conserve centre+zoom : un fit calculé sur une taille
      // transitoire (init avant la fin du layout) laisse les bornes déborder
      // — Corse coupée en bas, aucune marge en haut. On recadre tant que
      // l'utilisateur n'a pas déplacé la carte lui-même.
      if (!userMoved) fitToMarkers(L)
    })
    resizeObserver.observe(el)
  }
}

watch(
  mapEl,
  (el) => {
    visibilityObserver?.disconnect()
    visibilityObserver = null
    if (el) {
      // Init à l'entrée dans le viewport (marge de pré-chargement : les
      // tuiles sont déjà là quand la carte devient visible). Garantit une
      // taille réelle pour L.map — une carte masquée (hidden lg:block)
      // ou sous le fold ne charge ni le chunk Leaflet ni les tuiles.
      if (typeof IntersectionObserver !== 'undefined') {
        visibilityObserver = new IntersectionObserver(
          (entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return
            visibilityObserver?.disconnect()
            visibilityObserver = null
            void initMap(el)
          },
          { rootMargin: '300px' }
        )
        visibilityObserver.observe(el)
      } else {
        void initMap(el)
      }
    } else if (mapInstance.value) {
      mapInstance.value.remove()
      mapInstance.value = null
    }
  },
  { flush: 'post' }
)

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

watch([() => props.focusCenter, () => props.focusZoom], async () => {
  if (!mapInstance.value) return
  const L = await ensureLeaflet()
  // Force le re-cadrage : le watcher réagit aussi à `focusZoom` seul.
  lastFocus = null
  fitToMarkers(L)
})

onBeforeUnmount(() => {
  closePopup()
  visibilityObserver?.disconnect()
  visibilityObserver = null
  resizeObserver?.disconnect()
  resizeObserver = null
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
  border-radius: var(--radius-md);
}
.center-map-popup .leaflet-popup-tip-container {
  display: none;
}
.center-map-popup .leaflet-popup-content {
  margin: 0;
}
/* Leaflet impose `margin: 18px 0` sur les <p> du contenu — hors layer,
   ça écrase les utilitaires Tailwind. */
.center-map-popup .leaflet-popup-content p {
  margin: 0;
}
.center-map-popup .center-map-popup-cta {
  margin-top: var(--spacing-sm);
}
/* Leaflet force `color` sur les liens (.leaflet-container a) et sur le
   contenu de popup (#333) : on restaure la couleur du bouton
   (text-primary-foreground). */
.leaflet-container .center-map-popup a {
  color: inherit;
}
.leaflet-container .center-map-popup a.text-primary-foreground {
  color: var(--color-primary-foreground);
}
</style>
