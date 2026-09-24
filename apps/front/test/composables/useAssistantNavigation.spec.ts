import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import { useAssistantNavigation } from '~/composables/useAssistantNavigation'

const navigateMock = vi.fn()
const backMock = vi.fn()
const states = new Map<string, Ref<unknown>>()
let currentRoute = { path: '/', fullPath: '/' }

vi.stubGlobal('navigateTo', navigateMock)
vi.stubGlobal('useRouter', () => ({ back: backMock }))
vi.stubGlobal('useRoute', () => currentRoute)
vi.stubGlobal('useState', (key: string, init?: () => unknown) => {
  if (!states.has(key)) states.set(key, ref(init?.()))
  return states.get(key)
})

function setPreviousEntry(back: string | null) {
  window.history.replaceState({ back }, '')
}

describe('useAssistantNavigation', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    backMock.mockReset()
    states.clear()
    currentRoute = { path: '/', fullPath: '/' }
    setPreviousEntry(null)
  })

  it('open() mémorise la page d’origine et navigue vers le moteur avec ?q=', async () => {
    currentRoute = { path: '/formations', fullPath: '/formations?q=caces' }

    const navigation = useAssistantNavigation()
    await navigation.open({ query: ' caces ' })

    expect(navigation.origin.value).toEqual({ path: '/formations?q=caces' })
    expect(navigateMock).toHaveBeenCalledWith({
      path: '/recherche-assistee',
      query: { q: 'caces' }
    })
  })

  it('open() sans requête ne transmet pas de query et conserve l’origine depuis le moteur', async () => {
    currentRoute = { path: '/centres', fullPath: '/centres' }
    const navigation = useAssistantNavigation()
    await navigation.open()
    expect(navigateMock).toHaveBeenLastCalledWith({ path: '/recherche-assistee' })

    currentRoute = { path: '/recherche-assistee', fullPath: '/recherche-assistee?q=sst' }
    await useAssistantNavigation().open({ query: 'sst' })

    expect(navigation.origin.value).toEqual({ path: '/centres' })
  })

  it('reset() reste dans le moteur en remplaçant l’entrée d’historique', async () => {
    await useAssistantNavigation().reset()

    expect(navigateMock).toHaveBeenCalledWith({ path: '/recherche-assistee' }, { replace: true })
  })

  it('close() revient sur l’entrée d’historique précédente quand elle existe', async () => {
    setPreviousEntry('/formations?q=caces')

    await useAssistantNavigation().close()

    expect(backMock).toHaveBeenCalledOnce()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('close() sans entrée précédente revient à l’origine mémorisée en remplaçant', async () => {
    currentRoute = { path: '/centres/creteil', fullPath: '/centres/creteil' }
    const navigation = useAssistantNavigation()
    await navigation.open()
    navigateMock.mockReset()

    await navigation.close()

    expect(backMock).not.toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/centres/creteil', { replace: true })
  })

  it('close() sans origine ni historique (deep-link) revient à la Home', async () => {
    setPreviousEntry('')

    await useAssistantNavigation().close()

    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true })
  })
})
