import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { useGeolocation, useReverseGeocode } from '~/composables/useGeolocation'

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
    // État partagé au niveau module : chaque test repart d'une ardoise vide.
    const geo = useGeolocation()
    geo.clear()
    geo.permission.value = null
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

  it('partage position et status entre deux instances (pages différentes)', async () => {
    const getCurrentPosition = vi.fn((success: (position: MockPosition) => void) => {
      success(makePosition(45.764, 4.835))
    })
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })

    const home = useGeolocation()
    const centres = useGeolocation()

    home.request()
    await flushPromises()

    expect(centres.position.value).toEqual({ lat: 45.764, lng: 4.835 })
    expect(centres.status.value).toBe('granted')
  })

  it('clear() oublie la position et repasse à idle', async () => {
    const getCurrentPosition = vi.fn((success: (position: MockPosition) => void) => {
      success(makePosition(45.764, 4.835))
    })
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })

    const { status, position, request, clear } = useGeolocation()
    request()
    await flushPromises()
    expect(position.value).not.toBeNull()

    clear()

    expect(position.value).toBeNull()
    expect(status.value).toBe('idle')
  })

  it('expose l’état de permission via navigator.permissions', async () => {
    const getCurrentPosition = vi.fn(
      (
        _success: (position: MockPosition) => void,
        onError?: (error: MockPositionError) => void
      ) => {
        onError?.(makeError(1))
      }
    )
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition },
      permissions: {
        query: vi.fn(async () => ({ state: 'prompt', addEventListener: vi.fn() }))
      }
    })

    const { permission, request } = useGeolocation()
    await flushPromises()
    expect(permission.value).toBe('prompt')

    request()
    await flushPromises()
    expect(permission.value).toBe('denied')
  })
})

describe('useReverseGeocode', () => {
  beforeEach(() => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('résout le département depuis la position via l’API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      city: 'Créteil',
      department: 'Val-de-Marne',
      region: 'Île-de-France',
      postcode: '94000'
    })
    vi.stubGlobal('$fetch', fetchMock)

    const position = ref<{ lat: number; lng: number } | null>(null)
    const { city, department } = useReverseGeocode(position)

    expect(fetchMock).not.toHaveBeenCalled()

    position.value = { lat: 48.7909, lng: 2.4534 }
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/centres/reverse', {
      query: { lat: 48.7909, lng: 2.4534 }
    })
    expect(city.value).toBe('Créteil')
    expect(department.value).toBe('Val-de-Marne')
  })

  it('ne rappelle pas l’API pour un rafraîchissement de position proche', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ city: null, department: null })
    vi.stubGlobal('$fetch', fetchMock)

    const position = ref<{ lat: number; lng: number } | null>(null)
    useReverseGeocode(position)

    position.value = { lat: 48.7909, lng: 2.4534 }
    await flushPromises()
    position.value = { lat: 48.7901, lng: 2.4535 }
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reste à null quand l’API échoue', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('network')))

    const position = ref<{ lat: number; lng: number } | null>({ lat: 48.79, lng: 2.45 })
    const { department } = useReverseGeocode(position)
    await flushPromises()

    expect(department.value).toBeNull()
  })

  it('réinitialise ville et département quand la position est effacée', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      city: 'Lyon',
      department: 'Rhône'
    })
    vi.stubGlobal('$fetch', fetchMock)

    const position = ref<{ lat: number; lng: number } | null>(null)
    const { city, department } = useReverseGeocode(position)

    position.value = { lat: 45.764, lng: 4.835 }
    await flushPromises()
    expect(department.value).toBe('Rhône')

    position.value = null
    await flushPromises()
    expect(city.value).toBeNull()
    expect(department.value).toBeNull()
  })

  it('retente l’appel après un échec au prochain rafraîchissement', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue({ city: 'Lyon', department: 'Rhône' })
    vi.stubGlobal('$fetch', fetchMock)

    const position = ref<{ lat: number; lng: number } | null>(null)
    const { department } = useReverseGeocode(position)

    position.value = { lat: 45.764, lng: 4.8357 }
    await flushPromises()
    position.value = { lat: 45.7641, lng: 4.8358 }
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(department.value).toBe('Rhône')
  })

  it('ignore une réponse périmée quand une position plus récente a été demandée', async () => {
    let resolveFirst: ((value: unknown) => void) | undefined
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValue({ city: 'Lyon', department: 'Rhône' })
    vi.stubGlobal('$fetch', fetchMock)

    const position = ref<{ lat: number; lng: number } | null>(null)
    const { city, department } = useReverseGeocode(position)

    position.value = { lat: 48.79, lng: 2.45 } // Créteil — fetch lent
    await nextTick()
    position.value = { lat: 45.76, lng: 4.83 } // Lyon — fetch rapide
    await flushPromises()
    expect(department.value).toBe('Rhône')

    resolveFirst?.({ city: 'Créteil', department: 'Val-de-Marne' })
    await flushPromises()

    expect(city.value).toBe('Lyon')
    expect(department.value).toBe('Rhône')
  })
})
