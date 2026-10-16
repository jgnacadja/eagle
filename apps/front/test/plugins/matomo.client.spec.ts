import { beforeEach, describe, expect, it, vi } from 'vitest'
import matomoPlugin from '~/plugins/matomo.client'
import { resetAnalyticsDimensions, useAnalytics } from '~/composables/useAnalytics'

let query: Record<string, string> = {}
let routeName = 'index'
let params: Record<string, string> = {}
vi.stubGlobal('useRoute', () => ({ query, name: routeName, params }))

let config = { public: { matomoUrl: 'https://stats.learnup.test', matomoSiteId: '2' } }
vi.stubGlobal('useRuntimeConfig', () => config)

const hookCallbacks = new Map<string, () => void>()
const fakeNuxtApp = { hook: vi.fn((event: string, cb: () => void) => hookCallbacks.set(event, cb)) }

describe('matomo.client plugin (ST-27)', () => {
  beforeEach(() => {
    window._paq = undefined
    query = {}
    routeName = 'index'
    params = {}
    hookCallbacks.clear()
    config = { public: { matomoUrl: 'https://stats.learnup.test', matomoSiteId: '2' } }
    document.getElementById('matomo-script')?.remove()
    window.sessionStorage.clear()
    resetAnalyticsDimensions()
    fakeNuxtApp.hook.mockClear()
    window.history.pushState({}, '', '/')
  })

  it('sans configuration : avertit, ni script ni file', () => {
    config = { public: { matomoUrl: '', matomoSiteId: '' } }
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
    matomoPlugin(fakeNuxtApp as never)
    expect(warnSpy).toHaveBeenCalledWith(
      '[Analytics] NUXT_PUBLIC_MATOMO_URL / NUXT_PUBLIC_MATOMO_SITE_ID manquants : Matomo désactivé.'
    )
    expect(document.getElementById('matomo-script')).toBeNull()
    expect(window._paq).toBeUndefined()
  })

  it('configure le tracker : url, site, sans cookie, liens suivis', () => {
    matomoPlugin(fakeNuxtApp as never)
    const paq = window._paq!
    expect(paq).toContainEqual(['setTrackerUrl', 'https://stats.learnup.test/matomo.php'])
    expect(paq).toContainEqual(['setSiteId', '2'])
    expect(paq).toContainEqual(['disableCookies'])
    expect(paq).toContainEqual(['enableLinkTracking'])
    expect(paq.map((c) => c[0])).toContain('trackPageView') // vue initiale
    const script = document.getElementById('matomo-script') as HTMLScriptElement
    expect(script.src).toBe('https://stats.learnup.test/matomo.js')
    expect(script.async).toBe(true)
  })

  it('aucun cookie : disableCookies précède trackPageView', () => {
    matomoPlugin(fakeNuxtApp as never)
    const commands = window._paq!.map((c) => c[0])
    expect(commands.indexOf('disableCookies')).toBeLessThan(commands.indexOf('trackPageView'))
  })

  it('une vue à chaque navigation client (hook page:finish)', async () => {
    matomoPlugin(fakeNuxtApp as never)
    const before = window._paq!.filter((c) => c[0] === 'trackPageView').length
    hookCallbacks.get('page:finish')!()
    await Promise.resolve() // nextTick
    const after = window._paq!.filter((c) => c[0] === 'trackPageView').length
    expect(after).toBe(before + 1)
  })

  it('prévisualisation : la vue initiale n’est pas émise', () => {
    query = { preview: 'tok' }
    matomoPlugin(fakeNuxtApp as never)
    expect(window._paq!.map((c) => c[0])).not.toContain('trackPageView')
  })

  // ST-30 — la conversion n'est mesurée que par la page après validation du
  // drapeau : ni la vue initiale ni les navigations ne la comptent ici.
  it('confirmation : la vue initiale n’est pas émise', () => {
    window.history.pushState({}, '', '/confirmation/devis')
    matomoPlugin(fakeNuxtApp as never)
    expect(window._paq!.map((c) => c[0])).not.toContain('trackPageView')
  })

  it('confirmation : la navigation n’émet pas de vue automatique', async () => {
    matomoPlugin(fakeNuxtApp as never)
    const before = window._paq!.filter((c) => c[0] === 'trackPageView').length
    window.history.pushState({}, '', '/confirmation/candidature')
    hookCallbacks.get('page:finish')!()
    await Promise.resolve() // nextTick
    expect(window._paq!.filter((c) => c[0] === 'trackPageView')).toHaveLength(before)
  })

  it('confirmation : un type inconnu reste suivi normalement', async () => {
    matomoPlugin(fakeNuxtApp as never)
    const before = window._paq!.filter((c) => c[0] === 'trackPageView').length
    window.history.pushState({}, '', '/confirmation/inconnu')
    hookCallbacks.get('page:finish')!()
    await Promise.resolve() // nextTick
    expect(window._paq!.filter((c) => c[0] === 'trackPageView')).toHaveLength(before + 1)
  })

  it('l’url de l’instance est normalisée (pas de double slash)', () => {
    config = { public: { matomoUrl: 'https://stats.learnup.test/', matomoSiteId: '2' } }
    matomoPlugin(fakeNuxtApp as never)
    expect(window._paq).toContainEqual(['setTrackerUrl', 'https://stats.learnup.test/matomo.php'])
  })

  it('dimension Gabarit déduite de la route, posée sur chaque vue (ST-32)', async () => {
    matomoPlugin(fakeNuxtApp as never)
    expect(window._paq).toContainEqual(['setCustomDimension', 1, 'accueil'])
    routeName = 'formations-famille-slug'
    params = { famille: 'securite' }
    hookCallbacks.get('page:finish')!()
    await Promise.resolve()
    expect(window._paq).toContainEqual(['setCustomDimension', 1, 'formation'])
    expect(window._paq).toContainEqual(['setCustomDimension', 2, 'securite'])
  })

  it('dimension Département lue du filtre ?dept= (ST-32)', () => {
    routeName = 'centres'
    query = { dept: '75' }
    matomoPlugin(fakeNuxtApp as never)
    expect(window._paq).toContainEqual(['setCustomDimension', 3, '75'])
  })

  // ST-32 — la fiche centre pose Département depuis `centre.department` au
  // setup (avant page:finish) : applyRouteDimensions ne doit pas l'écraser.
  it('dimension Département de la fiche centre survit à page:finish (ST-32)', async () => {
    routeName = 'centres-slug'
    matomoPlugin(fakeNuxtApp as never)
    useAnalytics().setActionDimension('departement', 'Paris')
    window._paq = []
    hookCallbacks.get('page:finish')!()
    await Promise.resolve()
    expect(window._paq).toContainEqual(['setCustomDimension', 3, 'Paris'])
    expect(window._paq).not.toContainEqual(['deleteCustomDimension', 3])
  })

  it('Landing SEO (visite) figé sur la page d’entrée, une fois par session', async () => {
    routeName = 'formations-famille'
    matomoPlugin(fakeNuxtApp as never)
    expect(window._paq).toContainEqual(['setCustomDimension', 5, 'famille'])
    window._paq = []
    routeName = 'centres'
    hookCallbacks.get('page:finish')!()
    await Promise.resolve()
    expect(window._paq).toContainEqual(['setCustomDimension', 5, 'famille'])
    expect(window._paq).not.toContainEqual(['setCustomDimension', 5, 'centre'])
  })
})
