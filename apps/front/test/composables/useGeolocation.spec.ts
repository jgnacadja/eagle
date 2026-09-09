import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useGeolocation } from '~/composables/useGeolocation'

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

interface MockPositionError {
  code: number
  message: string
}

function makePosition(lat: number, lng: number): MockPosition {
  return {
    coords: {
      latitude: lat,
      longitude: lng,
      altitude: null,
      accuracy: 10,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    },
    timestamp: Date.now()
  }
}

function makeError(code: number): MockPositionError {
  return { code, message: 'geo error' }
}

describe('useGeolocation', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', undefined)
  })

  it('passe à unavailable si navigator.geolocation est absent', () => {
    vi.stubGlobal('navigator', {})

    const { status, request } = useGeolocation()
    request()

    expect(status.value).toBe('unavailable')
  })

  it('retourne la position et status granted quand l’utilisateur accepte', async () => {
    const getCurrentPosition = vi.fn((success: (position: MockPosition) => void) => {
      success(makePosition(48.8566, 2.3522))
    })

    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })

    const { status, position, request } = useGeolocation()
    request()

    await flushPromises()
    await nextTick()

    expect(status.value).toBe('granted')
    expect(position.value).toEqual({ lat: 48.8566, lng: 2.3522 })
  })

  it('passe à denied quand la permission est refusée', async () => {
    const getCurrentPosition = vi.fn(
      (
        _success: (position: MockPosition) => void,
        onError?: (error: MockPositionError) => void
      ) => {
        onError?.(makeError(1))
      }
    )

    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })

    const { status, request } = useGeolocation()
    request()

    await flushPromises()
    await nextTick()

    expect(status.value).toBe('denied')
  })

  it('passe à error pour tout autre code d’erreur', async () => {
    const getCurrentPosition = vi.fn(
      (
        _success: (position: MockPosition) => void,
        onError?: (error: MockPositionError) => void
      ) => {
        onError?.(makeError(2))
      }
    )

    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })

    const { status, request } = useGeolocation()
    request()

    await flushPromises()
    await nextTick()

    expect(status.value).toBe('error')
  })
})
