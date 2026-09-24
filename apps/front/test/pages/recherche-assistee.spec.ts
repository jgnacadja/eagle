import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, ref, type Ref } from 'vue'
import AssistantPage from '~/pages/recherche-assistee.vue'

const pageMetaMock = vi.fn()
const seoMetaMock = vi.fn()
const navigateMock = vi.fn()
const backMock = vi.fn()
const states = new Map<string, Ref<unknown>>()
const route = reactive({
  path: '/recherche-assistee',
  fullPath: '/recherche-assistee',
  query: {} as Record<string, string>
})

vi.stubGlobal('definePageMeta', pageMetaMock)
vi.stubGlobal('useSeoMeta', seoMetaMock)
vi.stubGlobal('navigateTo', navigateMock)
vi.stubGlobal('useRoute', () => route)
vi.stubGlobal('useRouter', () => ({ back: backMock }))
vi.stubGlobal('useState', (key: string, init?: () => unknown) => {
  if (!states.has(key)) states.set(key, ref(init?.()))
  return states.get(key)
})
const hookOnce = vi.fn()
vi.stubGlobal('useNuxtApp', () => ({ hooks: { hookOnce } }))
let demoStatesEnabled = true
vi.stubGlobal('useRuntimeConfig', () => ({ public: { assistantDemoStates: demoStatesEnabled } }))

function mountPage() {
  return mount(AssistantPage)
}

describe('pages/recherche-assistee', () => {
  beforeEach(() => {
    pageMetaMock.mockReset()
    seoMetaMock.mockReset()
    navigateMock.mockReset()
    backMock.mockReset()
    hookOnce.mockReset()
    states.clear()
    route.query = {}
    demoStatesEnabled = true
    window.history.replaceState({ back: null }, '')
  })

  it('un exemple cliqué pré-remplit le champ sans soumettre', async () => {
    const wrapper = mountPage()

    const example = wrapper.findAll('button').find((b) => b.text() === 'Former des salariés au SST')
    await example!.trigger('click')

    expect((wrapper.find('input#assistant-search').element as HTMLInputElement).value).toBe(
      'Former des salariés au SST'
    )
    expect(navigateMock).not.toHaveBeenCalled()
  })

  describe('états statiques de démo (?state=)', () => {
    it('rend la conversation demandée et navigue entre états sans entrée d’historique', async () => {
      route.query = { state: 'recommendation' }
      const wrapper = mountPage()

      expect(wrapper.find('h1').exists()).toBe(false)
      expect(wrapper.text()).toContain('Nous vous recommandons')

      const compare = wrapper
        .findAll('button')
        .find((b) => b.text() === 'Comparer ces trois formations')
      await compare!.trigger('click')

      expect(navigateMock).toHaveBeenCalledWith(
        { path: '/recherche-assistee', query: { state: 'comparison' } },
        { replace: true }
      )
    })

    it('rend la comparaison et le moteur indisponible', async () => {
      route.query = { state: 'comparison' }
      const comparison = mountPage()
      expect(comparison.find('caption').text()).toBe('Comparaison des formations recommandées')
      await comparison
        .findAll('button')
        .find((b) => b.text().includes('Retour aux recommandations'))!
        .trigger('click')
      expect(navigateMock).toHaveBeenLastCalledWith(
        { path: '/recherche-assistee', query: { state: 'recommendation' } },
        { replace: true }
      )

      route.query = { state: 'unavailable' }
      const unavailable = mountPage()
      expect(unavailable.find('[role="alert"]').text()).toContain('momentanément indisponible')
      await unavailable
        .findAll('button')
        .find((b) => b.text().includes('Réessayer'))!
        .trigger('click')
      expect(navigateMock).toHaveBeenLastCalledWith(
        { path: '/recherche-assistee', query: { state: 'analyzing' } },
        { replace: true }
      )
    })

    it('« Reformuler mon besoin » ramène à l’état initial', async () => {
      route.query = { state: 'no-result' }
      const wrapper = mountPage()

      await wrapper
        .findAll('button')
        .find((b) => b.text().includes('Reformuler'))!
        .trigger('click')

      expect(navigateMock).toHaveBeenLastCalledWith(
        { path: '/recherche-assistee', query: {} },
        { replace: true }
      )
    })

    it('ignore un état inconnu et reste sur l’état initial hors mode démo', () => {
      route.query = { state: 'inconnu' }
      expect(mountPage().find('h1').exists()).toBe(true)

      demoStatesEnabled = false
      route.query = { state: 'recommendation' }
      expect(mountPage().find('h1').exists()).toBe(true)
    })
  })

  it('à la sortie, programme le retour du focus vers le déclencheur d’origine', () => {
    states.set(
      'assistant-origin',
      ref({ path: '/formations', triggerId: 'assistant-trigger-catalogue-empty' })
    )
    const wrapper = mountPage()

    wrapper.unmount()

    expect(hookOnce).toHaveBeenCalledWith('page:finish', expect.any(Function))
  })

  it('utilise le layout pleine page et se déclare noindex, follow', () => {
    mountPage()

    expect(pageMetaMock).toHaveBeenCalledWith({ layout: 'assistant' })
    expect(seoMetaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Recherche assistée — LEARN UP ACADEMY',
        robots: 'noindex, follow'
      })
    )
  })

  it('affiche la coquille, l’accroche et le lien catalogue', () => {
    const wrapper = mountPage()

    expect(wrapper.text()).toContain('Recherche assistée')
    expect(wrapper.text()).toContain('Vous décrivez votre besoin.')
    expect(wrapper.find('a[href="/formations"]').text()).toBe('Consulter le catalogue')
  })

  it('pré-remplit le champ avec la requête transmise en ?q= (deep-link)', () => {
    route.query = { q: 'former 8 salariés au SST' }

    const wrapper = mountPage()

    expect((wrapper.find('input#assistant-search').element as HTMLInputElement).value).toBe(
      'former 8 salariés au SST'
    )
  })

  it('reflète une nouvelle saisie dans l’URL en remplaçant l’entrée courante', async () => {
    const wrapper = mountPage()
    const input = wrapper.find('input#assistant-search')

    await input.setValue('habilitation électrique')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(navigateMock).toHaveBeenCalledWith(
      { path: '/recherche-assistee', query: { q: 'habilitation électrique' } },
      { replace: true }
    )
  })

  it('ne touche pas à l’URL quand la requête soumise est déjà celle de l’URL', async () => {
    route.query = { q: 'sst' }
    const wrapper = mountPage()
    const input = wrapper.find('input#assistant-search')

    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('suit la requête de l’URL (retour arrière du navigateur)', async () => {
    route.query = { q: 'sst' }
    const wrapper = mountPage()

    route.query = { q: 'caces' }
    await flushPromises()

    expect((wrapper.find('input#assistant-search').element as HTMLInputElement).value).toBe('caces')
  })

  it('« Nouvelle recherche » vide le champ et retire ?q= sans entrée d’historique', async () => {
    route.query = { q: 'sst' }
    const wrapper = mountPage()

    const reset = wrapper.findAll('button').find((b) => b.text() === 'Nouvelle recherche')
    await reset!.trigger('click')
    await flushPromises()

    expect((wrapper.find('input#assistant-search').element as HTMLInputElement).value).toBe('')
    expect(navigateMock).toHaveBeenCalledWith({ path: '/recherche-assistee' }, { replace: true })
  })

  it('« Fermer » revient à la page précédente', async () => {
    window.history.replaceState({ back: '/formations' }, '')
    const wrapper = mountPage()

    await wrapper
      .find('button[aria-label="Fermer la recherche assistée et revenir à la page précédente"]')
      .trigger('click')
    await flushPromises()

    expect(backMock).toHaveBeenCalledOnce()
  })
})
