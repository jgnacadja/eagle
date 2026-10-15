import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetAnalyticsDimensions, useAnalytics } from '~/composables/useAnalytics'

let query: Record<string, string> = {}
vi.stubGlobal('useRoute', () => ({ query }))

let config = { public: { matomoUrl: 'https://stats.learnup.test', matomoSiteId: '2' } }
vi.stubGlobal('useRuntimeConfig', () => config)

describe('useAnalytics (ST-27)', () => {
  beforeEach(() => {
    window._paq = []
    query = {}
    config = { public: { matomoUrl: 'https://stats.learnup.test', matomoSiteId: '2' } }
    resetAnalyticsDimensions()
  })

  it('trackPageView empile url nettoyée, titre et commande', () => {
    const { trackPageView } = useAnalytics()
    trackPageView()
    const commands = window._paq!.map((c) => c[0])
    expect(commands[0]).toBe('setCustomUrl')
    expect(commands[1]).toBe('setDocumentTitle')
    expect(commands.at(-1)).toBe('trackPageView')
    expect(window._paq![0][1]).toBe(window.location.pathname)
  })

  it('les paramètres utm/tri/page ne quittent pas le navigateur', () => {
    window.history.replaceState({}, '', '/formations?utm_source=x&tri=prix&q=caces')
    const { trackPageView } = useAnalytics()
    trackPageView()
    expect(window._paq![0]).toEqual(['setCustomUrl', '/formations?q=caces'])
    window.history.replaceState({}, '', '/')
  })

  it('pousse les dimensions personnalisées avant la vue', () => {
    const { trackPageView } = useAnalytics()
    trackPageView({ 1: 'formation', 2: 'securite' })
    const commands = window._paq!.map((c) => c[0])
    expect(commands.at(-1)).toBe('trackPageView')
    expect(commands.indexOf('setDocumentTitle')).toBeLessThan(
      commands.indexOf('setCustomDimension')
    )
    expect(window._paq).toContainEqual(['setCustomDimension', 1, 'formation'])
    expect(window._paq).toContainEqual(['setCustomDimension', 2, 'securite'])
  })

  it('les dimensions du registre sont posées, les absentes retirées (ST-32)', () => {
    const { setActionDimension, setVisitDimension, trackPageView } = useAnalytics()
    setActionDimension('gabarit', 'formation')
    setActionDimension('famille', 'securite')
    setVisitDimension('landingSeo', 'famille')
    trackPageView()
    // action 1..2 posées ; action 3 (département) et 4 (source) retirées
    expect(window._paq).toContainEqual(['setCustomDimension', 1, 'formation'])
    expect(window._paq).toContainEqual(['setCustomDimension', 2, 'securite'])
    expect(window._paq).toContainEqual(['setCustomDimension', 5, 'famille']) // visite : id global
    expect(window._paq).toContainEqual(['deleteCustomDimension', 3])
    expect(window._paq).toContainEqual(['deleteCustomDimension', 4])
  })

  it('une dimension retirée disparaît de la vue suivante', () => {
    const { setActionDimension, trackPageView } = useAnalytics()
    setActionDimension('departement', '75')
    trackPageView()
    window._paq = []
    setActionDimension('departement', null)
    trackPageView()
    expect(window._paq).toContainEqual(['deleteCustomDimension', 3])
    expect(window._paq).not.toContainEqual(['setCustomDimension', 3, '75'])
  })

  it('les dimensions explicites priment sur le registre', () => {
    const { setActionDimension, trackPageView } = useAnalytics()
    setActionDimension('gabarit', 'centre')
    trackPageView({ 1: 'formation' })
    const commands = window._paq as unknown as Array<[string, number, string]>
    const indexOf = (value: string) =>
      commands.findIndex((c) => c[0] === 'setCustomDimension' && c[1] === 1 && c[2] === value)
    // Matomo applique la dernière valeur posée : la dimension explicite doit
    // venir après celle du registre.
    expect(indexOf('formation')).toBeGreaterThan(indexOf('centre'))
  })

  it('pushEvent traduit un événement du plan en commande Matomo', () => {
    const { pushEvent } = useAnalytics()
    pushEvent({
      event: 'select_formation_card',
      formation_id: 'sst',
      formation_name: 'SST',
      formation_family: 'Sécurité',
      list_name: 'catalogue'
    })
    expect(window._paq).toEqual([
      ['trackEvent', 'Formations', 'select_formation_card', 'SST:catalogue']
    ])
  })

  it('pushEvent retire les clés PII avant envoi', () => {
    const { pushEvent } = useAnalytics()
    pushEvent({
      event: 'form_submit',
      form_id: 'demande_formation',
      form_name: 'Demande de formation',
      email: 'user@example.com'
    } as never)
    expect(window._paq).toEqual([['trackEvent', 'Formulaires', 'form_submit', 'demande_formation']])
  })

  it('pushEvent ignore les vues de page (couvertes par trackPageView)', () => {
    const { pushEvent } = useAnalytics()
    pushEvent({ event: 'page_view', page_path: '/x', page_title: 'X' })
    expect(window._paq).toEqual([])
  })

  it('pushEvent est muet pendant une prévisualisation', () => {
    query = { preview: 'tok' }
    const { pushEvent } = useAnalytics()
    pushEvent({ event: 'view_centres_list', page_path: '/centres' })
    expect(window._paq).toEqual([])
  })

  it('trackEvent empile la commande Matomo', () => {
    const { trackEvent } = useAnalytics()
    trackEvent('formulaire', 'submit', 'demande-formation', 1)
    expect(window._paq).toEqual([['trackEvent', 'formulaire', 'submit', 'demande-formation', 1]])
  })

  it('trackEvent sans nom ni valeur reste minimal', () => {
    const { trackEvent } = useAnalytics()
    trackEvent('cta', 'click')
    expect(window._paq).toEqual([['trackEvent', 'cta', 'click']])
  })

  it.each([{ preview: 'tok' }])('aucun envoi pendant une prévisualisation %j', (q) => {
    query = q
    const { trackPageView, trackEvent } = useAnalytics()
    trackPageView()
    trackEvent('a', 'b')
    expect(window._paq).toEqual([])
  })

  it('no-op sans configuration Matomo', () => {
    config = { public: { matomoUrl: '', matomoSiteId: '' } }
    const { trackPageView, trackEvent, enabled } = useAnalytics()
    expect(enabled).toBe(false)
    trackPageView()
    trackEvent('a', 'b')
    expect(window._paq).toEqual([])
  })

  it('no-op si _paq absent (script bloqué)', () => {
    delete window._paq
    const { trackPageView } = useAnalytics()
    trackPageView()
    expect(window._paq).toBeUndefined()
  })
})
