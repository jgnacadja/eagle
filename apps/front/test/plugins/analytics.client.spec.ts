import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import analyticsPlugin from '~/plugins/analytics.client'

describe('analytics.client plugin', () => {
  const fakeNuxtApp = {
    hook: vi.fn()
  }

  beforeEach(() => {
    window.dataLayer = []
    const existingScript = document.getElementById('gtm-script')
    if (existingScript) {
      existingScript.remove()
    }
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs a console warning when gtmId is not provided and does not inject script', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        gtmId: ''
      }
    }))

    const nuxtApp = fakeNuxtApp as unknown as Parameters<typeof analyticsPlugin>[0]
    analyticsPlugin(nuxtApp)

    expect(warnSpy).toHaveBeenCalledWith(
      '[Analytics] NUXT_PUBLIC_GTM_ID manquant : le script Google Tag Manager ne sera pas chargé.'
    )
    expect(document.getElementById('gtm-script')).toBeNull()
    expect(window.dataLayer).toEqual([])
  })

  it('injects GTM script when gtmId is provided without warning', () => {
    const appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((el) => el)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        gtmId: 'GTM-TEST1234'
      }
    }))

    const nuxtApp = fakeNuxtApp as unknown as Parameters<typeof analyticsPlugin>[0]
    analyticsPlugin(nuxtApp)

    expect(warnSpy).not.toHaveBeenCalled()
    expect(appendSpy).toHaveBeenCalled()
    const script = appendSpy.mock.calls[0]?.[0] as HTMLScriptElement
    expect(script.id).toBe('gtm-script')
    expect(script.src).toBe('https://www.googletagmanager.com/gtm.js?id=GTM-TEST1234')
    expect(window.dataLayer?.length).toBeGreaterThan(0)
    expect(window.dataLayer?.[0]).toMatchObject({ event: 'gtm.js' })
  })
})
