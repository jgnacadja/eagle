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
    window.history.replaceState({ back: null }, '')
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
