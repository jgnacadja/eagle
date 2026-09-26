import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useDirectusList } from '~/composables/useDirectusList'

const requestMock = vi.fn()
const logMock = vi.fn()
let asyncDataOptions:
  | {
      getCachedData?: (key: string, nuxtApp: unknown, ctx: { cause: string }) => unknown
      watch?: unknown
    }
  | undefined

vi.stubGlobal('useDirectusClient', () => ({ request: requestMock }))
vi.stubGlobal('logServerError', logMock)
// useDirectusList n'attend pas useAsyncData : le stub est synchrone et
// remplit `data` quand la promesse du handler se résout.
vi.stubGlobal(
  'useAsyncData',
  (_key: string, handler: () => Promise<unknown>, options?: typeof asyncDataOptions) => {
    asyncDataOptions = options
    const data = ref<unknown>(undefined)
    handler().then((value) => {
      data.value = value
    })
    return { data }
  }
)

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  requestMock.mockReset()
  logMock.mockReset()
  asyncDataOptions = undefined
})

describe('useDirectusList', () => {
  it('renvoie les items de la collection', async () => {
    const items = [{ slug: 'a' }, { slug: 'b' }]
    requestMock.mockResolvedValue(items)

    const data = useDirectusList('avis', 'avis-key', { limit: 3 })
    await flush()

    expect(requestMock).toHaveBeenCalledTimes(1)
    expect(data.value).toEqual(items)
  })

  it('évalue le query getter à chaque fetch et saute l’appel sur null', async () => {
    const data = useDirectusList('avis', 'avis-key', () => null)
    await flush()

    expect(requestMock).not.toHaveBeenCalled()
    expect(data.value).toEqual([])
  })

  it('dégrade à [] en cas d’erreur', async () => {
    requestMock.mockRejectedValue(new Error('403'))

    const data = useDirectusList('avis', 'avis-key')
    await flush()

    expect(data.value).toEqual([])
  })

  it('passe le watch source à useAsyncData', () => {
    const source = ref(1)
    useDirectusList('avis', 'avis-key', undefined, { watch: [source] })
    expect(asyncDataOptions?.watch).toEqual([source])
  })

  it('ne sert le payload SSR que pendant l’hydratation initiale', async () => {
    requestMock.mockResolvedValue([])
    await useDirectusList('avis', 'avis-key')

    const nuxtApp = {
      isHydrating: true,
      payload: { data: { 'avis-key': [{ slug: 'cached' }] } },
      static: { data: {} }
    }
    const cached = asyncDataOptions!.getCachedData!('avis-key', nuxtApp, { cause: 'initial' })
    expect(cached).toEqual([{ slug: 'cached' }])

    const navigated = asyncDataOptions!.getCachedData!('avis-key', nuxtApp, { cause: 'watch' })
    expect(navigated).toBeUndefined()

    const hydrated = asyncDataOptions!.getCachedData!(
      'avis-key',
      { ...nuxtApp, isHydrating: false },
      { cause: 'initial' }
    )
    expect(hydrated).toBeUndefined()

    const staticData = asyncDataOptions!.getCachedData!(
      'avis-key',
      { isHydrating: true, payload: { data: {} }, static: { data: { 'avis-key': ['static'] } } },
      { cause: 'initial' }
    )
    expect(staticData).toEqual(['static'])
  })
})
