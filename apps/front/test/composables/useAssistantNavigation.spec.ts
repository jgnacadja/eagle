import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import { useAssistantNavigation } from '~/composables/useAssistantNavigation'

const navigateMock = vi.fn()
const backMock = vi.fn()
const hookOnce = vi.fn()
const states = new Map<string, Ref<unknown>>()
const currentRoute = { path: '/', fullPath: '/' }

vi.stubGlobal('navigateTo', navigateMock)
vi.stubGlobal('useRouter', () => ({ back: backMock }))
vi.stubGlobal('useRoute', () => currentRoute)
vi.stubGlobal('useNuxtApp', () => ({ hooks: { hookOnce } }))
vi.stubGlobal('useState', (key: string, init?: () => unknown) => {
  if (!states.has(key)) states.set(key, ref(init?.()))
  return states.get(key)
})

function setRoute(path: string, fullPath = path) {
  currentRoute.path = path
  currentRoute.fullPath = fullPath
}

function setPreviousEntry(back: string | null) {
  window.history.replaceState({ back }, '')
}

function pageFinishCallback(): () => void {
  return hookOnce.mock.calls[0]![1] as () => void
}

describe('useAssistantNavigation', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    backMock.mockReset()
    hookOnce.mockReset()
    states.clear()
    setRoute('/')
    setPreviousEntry(null)
  })

  it('open() mémorise la page d’origine et navigue vers le moteur avec ?q=', async () => {
    setRoute('/formations', '/formations?q=caces')

    const navigation = useAssistantNavigation()
    await navigation.open({ query: ' caces ' })

    expect(navigation.origin.value).toEqual({ path: '/formations?q=caces' })
    expect(navigateMock).toHaveBeenCalledWith({
      path: '/recherche-assistee',
      query: { q: 'caces' }
    })
  })

  it('open() mémorise aussi le déclencheur quand il est fourni', async () => {
    setRoute('/formations')

    const navigation = useAssistantNavigation()
    await navigation.open({ triggerId: 'assistant-trigger-catalogue-cta' })

    expect(navigation.origin.value).toEqual({
      path: '/formations',
      triggerId: 'assistant-trigger-catalogue-cta'
    })
    expect(navigateMock).toHaveBeenCalledWith({ path: '/recherche-assistee' })
  })

  it('open() depuis le moteur conserve l’origine déjà mémorisée', async () => {
    setRoute('/centres')
    const navigation = useAssistantNavigation()
    await navigation.open()

    setRoute('/recherche-assistee', '/recherche-assistee?q=sst')
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
    setRoute('/centres/creteil')
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

  describe('restoreFocus()', () => {
    let trigger: HTMLButtonElement

    beforeEach(() => {
      trigger = document.createElement('button')
      trigger.id = 'assistant-trigger-test'
      document.body.append(trigger)
    })

    afterEach(() => {
      trigger.remove()
    })

    it('rend le focus au déclencheur une fois revenu sur la page d’origine', async () => {
      setRoute('/formations')
      const navigation = useAssistantNavigation()
      await navigation.open({ triggerId: 'assistant-trigger-test' })

      navigation.restoreFocus()
      expect(hookOnce).toHaveBeenCalledWith('page:finish', expect.any(Function))
      pageFinishCallback()()

      expect(document.activeElement).toBe(trigger)
      expect(navigation.origin.value).toBeNull()
    })

    it('ne touche pas au focus quand la navigation mène ailleurs', async () => {
      setRoute('/formations')
      const navigation = useAssistantNavigation()
      await navigation.open({ triggerId: 'assistant-trigger-test' })

      navigation.restoreFocus()
      setRoute('/formations/securite/sst')
      pageFinishCallback()()

      expect(document.activeElement).not.toBe(trigger)
      expect(navigation.origin.value).not.toBeNull()
    })

    it('est sans effet sans déclencheur mémorisé', async () => {
      setRoute('/formations')
      const navigation = useAssistantNavigation()
      await navigation.open()

      navigation.restoreFocus()

      expect(hookOnce).not.toHaveBeenCalled()
    })
  })
})
