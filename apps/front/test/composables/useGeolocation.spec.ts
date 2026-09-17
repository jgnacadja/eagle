import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import {
  useAutoGeolocation,
  useGeolocation,
  type UseGeolocationReturn
} from '~/composables/useGeolocation'

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

  it('relance la demande quand la permission passe à granted après un échec', async () => {
    let calls = 0
    const getCurrentPosition = vi.fn(
      (success: (position: MockPosition) => void, onError?: (error: MockPositionError) => void) => {
        calls += 1
        if (calls === 1)
          onError?.(makeError(3)) // TIMEOUT pendant la popup
        else success(makePosition(48.8566, 2.3522))
      }
    )
    const changeHandlers: (() => void)[] = []
    const perm = {
      state: 'prompt',
      addEventListener: (_: string, fn: () => void) => changeHandlers.push(fn),
      removeEventListener: vi.fn()
    }
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition },
      permissions: { query: vi.fn(async () => perm) }
    })

    const { status, position, request } = useGeolocation()
    await flushPromises() // laisse permissions.query se résoudre
    request()
    expect(status.value).toBe('error')

    // L'utilisateur finit par accepter la popup : la demande repart sans refresh.
    perm.state = 'granted'
    for (const fn of changeHandlers) fn()

    expect(getCurrentPosition).toHaveBeenCalledTimes(2)
    expect(position.value).toEqual({ lat: 48.8566, lng: 2.3522 })
    expect(status.value).toBe('granted')
  })
})

describe('useAutoGeolocation', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    vi.unstubAllGlobals()
  })

  function stubMobileViewport() {
    window.matchMedia = (() => ({ matches: false }) as MediaQueryList) as typeof window.matchMedia
  }

  function mountAutoGeolocation(force?: () => boolean) {
    const holder: { api?: UseGeolocationReturn } = {}
    mount(
      defineComponent({
        setup() {
          holder.api = useAutoGeolocation(force)
          return () => h('div')
        }
      })
    )
    return holder.api!
  }

  it('demande la position au montage sur desktop', () => {
    const getCurrentPosition = vi.fn()
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })

    mountAutoGeolocation()

    expect(getCurrentPosition).toHaveBeenCalledOnce()
  })

  it('ne demande pas la position sur mobile sans geste explicite', () => {
    const getCurrentPosition = vi.fn()
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    stubMobileViewport()

    mountAutoGeolocation()

    expect(getCurrentPosition).not.toHaveBeenCalled()
  })

  it('demande la position sur mobile quand force() est vrai', () => {
    const getCurrentPosition = vi.fn()
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    stubMobileViewport()

    mountAutoGeolocation(() => true)

    expect(getCurrentPosition).toHaveBeenCalledOnce()
  })
})
