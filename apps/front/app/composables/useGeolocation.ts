import { ref, watch, type Ref } from 'vue'
import type { GeoPoint } from '~/utils/geo'

export type GeolocationStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable' | 'error'
export type GeolocationPermission = 'prompt' | 'granted' | 'denied' | null

interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

interface GeolocationErrorLike {
  code: number
  message?: string
}

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: false,
  // Le timeout inclut le temps de décision de l'utilisateur sur la popup —
  // 8 s était trop court : un accord « lent » tombait en erreur TIMEOUT et
  // n'était appliqué qu'au prochain chargement.
  timeout: 30_000,
  maximumAge: 60_000
}

// État partagé au niveau module : la position de l'utilisateur est globale à la
// session — activée sur une page (home ou /centres), elle s'applique partout où
// `useGeolocation()` est consommé. Mutations uniquement côté client
// (`request()` est impossible sans `navigator`) : pas de fuite SSR entre requêtes.
const status = ref<GeolocationStatus>('idle')
const position = ref<GeoPoint | null>(null)
const error = ref<GeolocationErrorLike | null>(null)
const permission = ref<GeolocationPermission>(null)

// Le listener `change` est rattaché une seule fois par objet PermissionStatus —
// un nouvel objet (nouvelle query) réenregistre.
let watchedPerm: { addEventListener: (type: string, fn: () => void) => void } | null = null

function refreshPermissionState() {
  if (typeof navigator === 'undefined' || typeof navigator.permissions?.query !== 'function') {
    return
  }
  navigator.permissions
    .query({ name: 'geolocation' })
    .then((perm) => {
      permission.value = perm.state as GeolocationPermission
      if (watchedPerm === perm) return
      watchedPerm = perm
      perm.addEventListener('change', () => {
        permission.value = perm.state as GeolocationPermission
        // Un accord tardif (popup native laissée ouverte, réactivation via les
        // réglages du site) relance la demande si aucune position n'est connue.
        if (perm.state === 'granted' && !position.value) request()
      })
    })
    .catch(() => {
      // Permissions API indisponible (ou nom non supporté) : la demande
      // simple suffit, l'état reste inconnu (`null`).
    })
}

function request() {
  if (
    typeof navigator === 'undefined' ||
    !navigator?.geolocation ||
    typeof navigator.geolocation.getCurrentPosition !== 'function'
  ) {
    status.value = 'unavailable'
    return
  }

  status.value = 'locating'

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      position.value = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }
      status.value = 'granted'
      permission.value = 'granted'
    },
    (err: GeolocationErrorLike) => {
      error.value = err
      // 1 = GeolocationPositionError.PERMISSION_DENIED — le navigateur ne
      // réaffichera plus la popup native ; seul le site settings débloque.
      status.value = err.code === 1 ? 'denied' : 'error'
      if (err.code === 1) permission.value = 'denied'
    },
    DEFAULT_OPTIONS
  )
}

function clear() {
  position.value = null
  status.value = 'idle'
  error.value = null
}

// Viewport « desktop » : même seuil que le breakpoint Tailwind `lg`.
export const DESKTOP_QUERY = '(min-width: 1024px)'

export interface UseGeolocationReturn {
  status: Ref<GeolocationStatus>
  position: Ref<GeoPoint | null>
  error: Ref<GeolocationErrorLike | null>
  permission: Ref<GeolocationPermission>
  request: () => void
  clear: () => void
}

/**
 * Adapter client autour de `navigator.geolocation`, état partagé entre pages.
 * Pas d'appel automatique : la demande part uniquement d'un geste explicite
 * (badge « Près de moi », consent dialog).
 */
export function useGeolocation(): UseGeolocationReturn {
  refreshPermissionState()
  return { status, position, error, permission, request, clear }
}

export interface ReverseGeocodeResult {
  city: string | null
  department: string | null
  region: string | null
  postcode: string | null
}

/**
 * Reverse geocoding via l'API (`GET /centres/reverse` → BAN) : convertit
 * la position GPS en ville/département — utilisé pour pré-remplir le
 * filtre département de `/centres`. Dégradation silencieuse : en cas
 * d'échec les refs restent `null`, la position seule continue de trier
 * les centres par distance.
 */
export function useReverseGeocode(position: Ref<GeoPoint | null>) {
  const apiBase = useRuntimeConfig().public.apiBase

  const city = ref<string | null>(null)
  const department = ref<string | null>(null)

  let fetchedKey: string | null = null
  let requestSeq = 0
  watch(
    position,
    async (pos) => {
      if (!pos) {
        city.value = null
        department.value = null
        fetchedKey = null
        return
      }
      // Clé arrondie au dixième de degré (~10 km) : un rafraîchissement de
      // position à quelques mètres près ne relance pas l'API.
      const key = `${pos.lat.toFixed(1)}:${pos.lng.toFixed(1)}`
      if (key === fetchedKey) return
      fetchedKey = key
      const seq = ++requestSeq
      try {
        const res = await $fetch<ReverseGeocodeResult>(`${apiBase}/centres/reverse`, {
          query: { lat: pos.lat, lng: pos.lng }
        })
        // Réponse périmée : une position plus récente a déjà été demandée —
        // on n'écrase pas ses valeurs.
        if (seq !== requestSeq) return
        city.value = res?.city ?? null
        department.value = res?.department ?? null
      } catch {
        // Silencieux : le filtre département reste non pré-rempli. La clé
        // n'est retenue que si la requête courante a échoué — sinon un
        // échec périmé dédouanerait une position plus récente.
        if (seq === requestSeq) fetchedKey = null
      }
    },
    { immediate: true }
  )

  return { city, department }
}
