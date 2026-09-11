import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, ref, Suspense, watchEffect } from 'vue'
import LoadError from '~/components/ErrorState/LoadError.vue'
import NotFound from '~/components/ErrorState/NotFound.vue'
import ArticlePage from '~/pages/actualites/[slug].vue'

const navigateToMock = vi.fn()
const refreshMock = vi.fn()
const setResponseStatusMock = vi.fn()
const seoMock = vi.fn()

interface RouteMock {
  params: { slug: string }
  query: Record<string, string>
  path: string
  meta: Record<string, unknown>
}

let routeMock: RouteMock
let forceError: Error | null = null

vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('watchEffect', watchEffect)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useRoute', () => routeMock)
vi.stubGlobal('useAsyncData', async (_key: string, handler: () => Promise<unknown>) => {
  if (forceError) {
    return { data: ref(null), error: ref(forceError), refresh: refreshMock }
  }
  try {
    return { data: ref(await handler()), error: ref(null), refresh: refreshMock }
  } catch (e) {
    return { data: ref(null), error: ref(e), refresh: refreshMock }
  }
})
vi.stubGlobal('useRequestEvent', () => undefined)
vi.stubGlobal('setResponseStatus', setResponseStatusMock)
vi.stubGlobal('useContentSeo', seoMock)
vi.stubGlobal('navigateTo', navigateToMock)

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  Button: { template: '<button><slot /></button>' },
  Card: { template: '<div><slot /></div>' },
  SearchInput: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'submit'],
    template: '<button class="search-stub" @click="$emit(\'submit\', \'caces\')" />'
  },
  IconShare: true,
  IconLink: true,
  IconFileOff: true,
  IconRefresh: true,
  IconSparkle: true
}

// useContentSeo reçoit des getters réactifs : on les résout pour les assertions.
function seoArgs() {
  const [source, fallback] = seoMock.mock.calls[0]!
  const resolve = (v: unknown) => (typeof v === 'function' ? (v as () => unknown)() : v)
  return [resolve(source), resolve(fallback)] as const
}

async function mountPage() {
  const Host = defineComponent({
    render() {
      return h(Suspense, () => h(ArticlePage))
    }
  })
  const wrapper = mount(Host, { global: { components: { LoadError, NotFound }, stubs } })
  await flushPromises()
  return wrapper
}

describe('pages/actualites/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    forceError = null
    routeMock = {
      params: { slug: 'recyclage-caces-echeances-2027' },
      query: {},
      path: '/actualites/recyclage-caces-echeances-2027',
      meta: {}
    }
  })

  it('affiche l’en-tête de l’article : catégorie, date, titre, chapô', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Réglementation & obligations')
    expect(wrapper.text()).toContain('2 sept. 2026')
    expect(wrapper.text()).toContain('4 min')
    expect(wrapper.text()).toContain('Recyclage CACES')
    expect(wrapper.text()).toContain('échéance en 2027')
  })

  it('affiche l’auteur, les dates et les actions partager/copier le lien', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Équipe réglementation LEARN UP ACADEMY')
    expect(wrapper.text()).toContain('Publié le 2 sept. 2026')
    const labels = wrapper.findAll('button').map((b) => b.attributes('aria-label'))
    expect(labels).toContain("Partager l'article")
    expect(labels).toContain("Copier le lien de l'article")
  })

  it('affiche les sections du corps et l’encart À retenir', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Pourquoi 2027 concentre les échéances')
    expect(wrapper.text()).toContain('Comment étaler les recyclages')
    expect(wrapper.text()).toContain('À retenir')
    expect(wrapper.text()).toContain('3 à 6 mois avant l’échéance')
  })

  it('affiche les mots-clés et la formation liée', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('CACES R489')
    expect(wrapper.text()).toContain('Autorisation de conduite')
    expect(wrapper.text()).toContain('Recyclage CACES R489 — toutes catégories')
    const link = wrapper.find(
      'a[href="/formations/caces-conduite-engins/caces-r489-chariots-elevateurs"]'
    )
    expect(link.exists()).toBe(true)
  })

  it('affiche le CTA conseiller vers la demande de formation', async () => {
    const wrapper = await mountPage()

    const link = wrapper.find('a[href="/centres/demande-de-formation"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Parler à un conseiller')
  })

  it('affiche la table des matières et les articles liés', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Dans cet article')
    expect(wrapper.find('a[href="#pourquoi"]').exists()).toBe(true)
    expect(wrapper.find('a[href="#etaler"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('À lire ensuite')
    expect(wrapper.find('a[href="/actualites/aipr-qui-former"]').exists()).toBe(true)
  })

  it('met à jour le breadcrumb avec la catégorie et le titre', async () => {
    await mountPage()

    expect(routeMock.meta.breadcrumb).toEqual([
      { label: 'Accueil', to: '/' },
      { label: 'Actualités', to: '/actualites' },
      { label: 'Réglementation & obligations' },
      { label: expect.stringContaining('Recyclage CACES') }
    ])
  })

  it('applique le SEO de l’article', async () => {
    await mountPage()

    const [source, fallback] = seoArgs()
    expect(source).toEqual(
      expect.objectContaining({ seo_title: expect.stringContaining('Recyclage CACES') })
    )
    expect(fallback).toEqual(expect.stringContaining('Recyclage CACES'))
  })

  it('affiche l’état introuvable et adapte breadcrumb/SEO pour un slug inconnu', async () => {
    routeMock.params.slug = 'inconnu'
    routeMock.path = '/actualites/inconnu'
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain("Cet article n'est pas disponible.")
    expect(routeMock.meta.breadcrumb).toEqual([
      { label: 'Accueil', to: '/' },
      { label: 'Actualités', to: '/actualites' },
      { label: 'Article introuvable' }
    ])
    const [source, fallback] = seoArgs()
    expect(source).toEqual(
      expect.objectContaining({ seo_title: 'Article introuvable', seo_noindex: true })
    )
    expect(fallback).toBe('Article introuvable')
  })

  it('affiche l’état erreur quand le chargement échoue', async () => {
    routeMock.query = { error: '1' }
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain("L'article n'a pas pu être chargé.")
    expect(routeMock.meta.breadcrumb).toEqual([
      { label: 'Accueil', to: '/' },
      { label: 'Actualités', to: '/actualites' },
      { label: 'Erreur de chargement' }
    ])
    const [source, fallback] = seoArgs()
    expect(source).toEqual(
      expect.objectContaining({ seo_title: 'Erreur de chargement', seo_noindex: true })
    )
    expect(fallback).toBe('Erreur de chargement')
  })

  it('« Réessayer » retire le paramètre ?error=1 au lieu de relancer un appel voué à échouer', async () => {
    routeMock.query = { error: '1', autre: 'x' }
    const wrapper = await mountPage()

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Réessayer')!
      .trigger('click')

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/actualites/recyclage-caces-echeances-2027',
      query: { autre: 'x' }
    })
    expect(refreshMock).not.toHaveBeenCalled()
  })

  it('« Réessayer » relance le chargement quand l’erreur ne vient pas du paramètre de simulation', async () => {
    forceError = new Error('API down')
    const wrapper = await mountPage()

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Réessayer')!
      .trigger('click')

    expect(refreshMock).toHaveBeenCalled()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('la recherche de l’état introuvable redirige vers /actualites avec la requête', async () => {
    routeMock.params.slug = 'inconnu'
    routeMock.path = '/actualites/inconnu'
    const wrapper = await mountPage()

    await wrapper.find('.search-stub').trigger('click')

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/actualites',
      query: { q: 'caces' }
    })
  })
})
