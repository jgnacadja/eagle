import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import ConfirmationPage from '~/pages/confirmation/[type].vue'
import {
  CONFIRMATION_TYPES,
  confirmationFlagKey,
  markConfirmationFlag,
  type ConfirmationType
} from '~/utils/confirmation'

// Route paramétrable par spec — `params.type` pilote le gabarit de contenu.
const routeStub = { params: { type: 'devis' as string } }
vi.stubGlobal('useRoute', () => routeStub)
vi.stubGlobal('ref', ref)
vi.stubGlobal('nextTick', nextTick)
vi.stubGlobal('onMounted', (fn: () => unknown) => fn())

const navigateMock = vi.fn()
vi.stubGlobal('navigateTo', navigateMock)

const headMock = vi.fn()
vi.stubGlobal('useHead', headMock)

// Vue mesurable : émise par la page elle-même, après validation du drapeau.
const trackPageViewMock = vi.hoisted(() => vi.fn())
vi.mock('~/composables/useAnalytics', () => ({
  useAnalytics: () => ({ trackPageView: trackPageViewMock })
}))

// createError (auto-import Nuxt) : le setup de la page le lève pour les types
// inconnus — converti en erreur testable.
vi.stubGlobal('createError', (input: { statusCode: number; statusMessage?: string }) => {
  const err = new Error(input.statusMessage ?? 'error') as Error & { statusCode: number }
  err.statusCode = input.statusCode
  return err
})

const stubs = {
  Card: { template: '<div><slot /></div>' },
  Button: { template: '<button><slot /></button>' },
  IconCheck: { template: '<span />' }
}

async function mountPage(type: string) {
  routeStub.params.type = type
  // attachTo body : le focus du titre n'existe que sur un arbre connecté.
  const wrapper = mount(ConfirmationPage, { attachTo: document.body, global: { stubs } })
  await flushPromises()
  return wrapper
}

describe('pages/confirmation/[type] (ST-30)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.sessionStorage.clear()
    document.body.innerHTML = ''
  })

  it('refuse un type de confirmation inconnu en 404', async () => {
    await expect(mountPage('inconnu')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('affiche le contenu du type quand le drapeau de conversion existe', async () => {
    window.sessionStorage.setItem(confirmationFlagKey('devis'), '{}')

    const wrapper = await mountPage('devis')

    expect(wrapper.text()).toContain('Votre demande est transmise')
    expect(wrapper.text()).toContain('sous 24 h')
    expect(wrapper.find('a[href="/"]').text()).toContain("Retour à l'accueil")
    expect(wrapper.find('a[href="/formations"]').text()).toContain('Parcourir le catalogue')
  })

  it.each(CONFIRMATION_TYPES)('couvre le type « %s » avec le drapeau posé', async (type) => {
    window.sessionStorage.setItem(confirmationFlagKey(type as ConfirmationType), '{}')

    const wrapper = await mountPage(type)

    expect(wrapper.find('h1').exists()).toBe(true)
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it("consomme le drapeau : un rechargement n'affiche plus la confirmation", async () => {
    window.sessionStorage.setItem(confirmationFlagKey('inscription'), '{}')
    await mountPage('inscription')

    expect(window.sessionStorage.getItem(confirmationFlagKey('inscription'))).toBeNull()
  })

  it("redirige vers l'accueil sans historiser en accès direct (pas de drapeau)", async () => {
    const wrapper = await mountPage('candidature')

    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true })
    expect(wrapper.text()).not.toContain('Candidature transmise')
  })

  it('restitue référence et CTA retour depuis le contexte du drapeau', async () => {
    window.sessionStorage.setItem(
      confirmationFlagKey('rendez-vous'),
      JSON.stringify({
        reference: 'LU-2026-1012-042',
        backTo: '/formations/sante/sst-initial',
        backLabel: 'Retour à la formation'
      })
    )

    const wrapper = await mountPage('rendez-vous')

    expect(wrapper.text()).toContain('LU-2026-1012-042')
    expect(wrapper.find('a[href="/formations/sante/sst-initial"]').text()).toContain(
      'Retour à la formation'
    )
  })

  it('restitue la ligne de détail du contexte', async () => {
    window.sessionStorage.setItem(
      confirmationFlagKey('devis'),
      JSON.stringify({ detail: 'au sujet de la formation SST — Sauveteur secouriste du travail.' })
    )

    const wrapper = await mountPage('devis')

    expect(wrapper.text()).toContain('au sujet de la formation SST — Sauveteur secouriste')
  })

  it("retombe sur l'accueil si le CTA retour du drapeau n'est pas un chemin interne", async () => {
    window.sessionStorage.setItem(
      confirmationFlagKey('devis'),
      JSON.stringify({ backTo: 'https://externe.example', backLabel: 'Suite' })
    )

    const wrapper = await mountPage('devis')

    expect(wrapper.find('a[href="https://externe.example"]').exists()).toBe(false)
    expect(wrapper.find('a[href="/"]').text()).toContain('Suite')
  })

  it('affiche la confirmation via le secours mémoire si sessionStorage est bloqué', async () => {
    const setItemSpy = vi.spyOn(window.sessionStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('denied')
    })
    const getItemSpy = vi.spyOn(window.sessionStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('denied')
    })
    markConfirmationFlag('devis', JSON.stringify({ reference: 'LU-9' }))

    const wrapper = await mountPage('devis')

    expect(wrapper.text()).toContain('Votre demande est transmise')
    expect(trackPageViewMock).toHaveBeenCalledTimes(1)
    setItemSpy.mockRestore()
    getItemSpy.mockRestore()
  })

  it('affiche la confirmation même si le drapeau est corrompu', async () => {
    window.sessionStorage.setItem(confirmationFlagKey('inscription'), '{json-cassé')

    const wrapper = await mountPage('inscription')

    expect(wrapper.text()).toContain('Inscription confirmée')
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('émet la vue mesurable après validation du drapeau et focus le titre', async () => {
    window.sessionStorage.setItem(confirmationFlagKey('devis'), '{}')

    const wrapper = await mountPage('devis')

    expect(trackPageViewMock).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(wrapper.find('h1').element)
  })

  it("n'émet aucune vue en accès direct (pas de drapeau)", async () => {
    await mountPage('candidature')

    expect(trackPageViewMock).not.toHaveBeenCalled()
  })

  it('marque la page noindex/nofollow', async () => {
    window.sessionStorage.setItem(confirmationFlagKey('devis'), '{}')
    await mountPage('devis')

    expect(headMock).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: [{ name: 'robots', content: 'noindex, nofollow' }]
      })
    )
  })
})
