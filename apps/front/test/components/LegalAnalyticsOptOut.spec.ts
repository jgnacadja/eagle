import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import AnalyticsOptOut from '~/components/Legal/AnalyticsOptOut.vue'

/** Exécute la commande fonction « isOptedOut » restée dans la file _paq. */
function resolveOptedOut(opted: boolean) {
  const entry = window._paq![window._paq!.length - 1]!
  const command = entry[0] as unknown as (this: { isUserOptedOut: () => boolean }) => void
  command.call({ isUserOptedOut: () => opted })
}

describe('LegalAnalyticsOptOut (ST-33)', () => {
  beforeEach(() => {
    window._paq = []
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('annonce un visiteur suivi quand le marqueur est absent', async () => {
    const wrapper = mount(AnalyticsOptOut)
    resolveOptedOut(false)
    await nextTick()

    const status = wrapper.find('#analytics-optout-status')
    expect(status.text()).toContain('suivi')
    const button = wrapper.find('button')
    expect(button.text()).toContain('Refuser la mesure')
    expect(button.attributes('aria-pressed')).toBe('false')
  })

  it('annonce un visiteur exclu quand le marqueur est posé', async () => {
    const wrapper = mount(AnalyticsOptOut)
    resolveOptedOut(true)
    await nextTick()

    expect(wrapper.find('#analytics-optout-status').text()).toContain('exclu')
    const button = wrapper.find('button')
    expect(button.text()).toContain('Réactiver')
    expect(button.attributes('aria-pressed')).toBe('true')
  })

  it('se replie sur un message informatif sans tracker', async () => {
    delete window._paq
    const wrapper = mount(AnalyticsOptOut)
    await nextTick()

    expect(wrapper.text()).toContain('pas active')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('bascule opt-out puis opt-in au clic', async () => {
    const wrapper = mount(AnalyticsOptOut)
    resolveOptedOut(false)
    await nextTick()

    await wrapper.find('button').trigger('click')
    expect(window._paq).toContainEqual(['optUserOut'])
    expect(wrapper.find('#analytics-optout-status').text()).toContain('exclu')

    await wrapper.find('button').trigger('click')
    expect(window._paq).toContainEqual(['forgetUserOptOut'])
    expect(wrapper.find('#analytics-optout-status').text()).toContain('suivi')
  })

  it('indique indisponible si matomo.js ne se charge jamais (script bloqué)', async () => {
    vi.useFakeTimers()
    const wrapper = mount(AnalyticsOptOut)
    // La commande fonction n'est jamais rejouée : après l'échéance, le
    // statut bascule plutôt que de rester sur « Vérification… ».
    await vi.advanceTimersByTimeAsync(4000)

    expect(wrapper.text()).toContain('pas active')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('expose le statut en live region pour les lecteurs d’écran', () => {
    const wrapper = mount(AnalyticsOptOut)
    expect(wrapper.find('#analytics-optout-status').attributes('aria-live')).toBe('polite')
  })
})
