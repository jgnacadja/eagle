import { ref, type Ref } from 'vue'
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
  timeout: 8_000,
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

  return { status, position, error, request }
}
