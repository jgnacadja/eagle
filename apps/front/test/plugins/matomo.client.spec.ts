import { beforeEach, describe, expect, it, vi } from 'vitest'
import matomoPlugin from '~/plugins/matomo.client'

let query: Record<string, string> = {}
vi.stubGlobal('useRoute', () => ({ query }))

let config = { public: { matomoUrl: 'https://stats.learnup.test', matomoSiteId: '2' } }
vi.stubGlobal('useRuntimeConfig', () => config)

const hookCallbacks = new Map<string, () => void>()
const fakeNuxtApp = { hook: vi.fn((event: string, cb: () => void) => hookCallbacks.set(event, cb)) }

describe('matomo.client plugin (ST-27)', () => {
  beforeEach(() => {
    window._paq = undefined
    query = {}
    hookCallbacks.clear()
    config = { public: { matomoUrl: 'https://stats.learnup.test', matomoSiteId: '2' } }
    document.getElementById('matomo-script')?.remove()
    fakeNuxtApp.hook.mockClear()
    window.history.pushState({}, '', '/')
  })

  it('sans configuration : avertit, ni script ni file', () => {
    config = { public: { matomoUrl: '', matomoSiteId: '' } }
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
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
})
