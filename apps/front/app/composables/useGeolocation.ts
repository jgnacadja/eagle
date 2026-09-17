import { getCurrentScope, onMounted, onScopeDispose, ref, type Ref } from 'vue'
import type { GeoPoint } from '~/utils/geo'

export type GeolocationStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable' | 'error'

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

export interface UseGeolocationReturn {
  status: Ref<GeolocationStatus>
  position: Ref<GeoPoint | null>
  error: Ref<GeolocationErrorLike | null>
  request: () => void
}

/**
 * Adapter client autour de `navigator.geolocation`.
 * Pas d'appel automatique : l'appelant déclenche `request()` quand il le souhaite
 * (typiquement dans `onMounted` de la page concernée, pour éviter un mismatch SSR).
 */
export function useGeolocation(): UseGeolocationReturn {
  const status = ref<GeolocationStatus>('idle')
  const position = ref<GeoPoint | null>(null)
  const error = ref<GeolocationErrorLike | null>(null)

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
      },
      (err: GeolocationErrorLike) => {
        error.value = err
        // 1 = GeolocationPositionError.PERMISSION_DENIED
        status.value = err.code === 1 ? 'denied' : 'error'
      },
      DEFAULT_OPTIONS
    )
  }

  // Si la demande échoue (timeout le temps que l'utilisateur lise la popup),
  // un accord tardif ne s'appliquait qu'au refresh : on relance la demande
  // dès que la permission passe à granted.
  if (typeof navigator !== 'undefined' && typeof navigator.permissions?.query === 'function') {
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((perm) => {
        const onChange = () => {
          if (perm.state === 'granted' && !position.value) request()
        }
        perm.addEventListener('change', onChange)
        if (getCurrentScope()) {
          onScopeDispose(() => perm.removeEventListener('change', onChange))
        }
      })
      .catch(() => {
        // Permissions API indisponible (ou nom non supporté) : la demande
        // simple suffit, pas de relance possible.
      })
  }

  return { status, position, error, request }
}

// Viewport « desktop » : même seuil que le breakpoint Tailwind `lg`.
export const DESKTOP_QUERY = '(min-width: 1024px)'

/**
 * Variante qui déclenche `request()` au montage du composant :
 * - desktop (viewport ≥ `lg`) : demande automatique ;
 * - mobile : uniquement via un geste explicite — `force()` (bouton
 *   « Autour de moi » → `/centres?geo=1`) ou un appel direct à `request()`.
 *
 * `force` n'est évalué qu'une fois, au montage. Pour un re-déclenchement
 * (navigation interne changeant la query), la page appelle `request()`.
 */
export function useAutoGeolocation(force?: () => boolean): UseGeolocationReturn {
  const geo = useGeolocation()

  onMounted(() => {
    // matchMedia absent (vieux navigateur) → on demande quand même : mieux
    // vaut une popup en trop qu'une géolocalisation silencieusement inactive.
    const isDesktop =
      typeof window.matchMedia !== 'function' || window.matchMedia(DESKTOP_QUERY).matches
    if (isDesktop || force?.()) geo.request()
  })

  return geo
}
