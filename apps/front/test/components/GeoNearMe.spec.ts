import { DOMWrapper, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GeoNearMe from '~/components/Map/GeoNearMe.vue'
import { useGeolocation } from '~/composables/useGeolocation'

// Le Dialog est téléporté dans document.body (reka-ui DialogPortal) :
// on l'y interroge directement plutôt que via le wrapper.
function bodyButton(label: string) {
  const btn = [...document.body.querySelectorAll('button')].find((b) =>
    b.textContent?.includes(label)
  )
  if (!btn) throw new Error(`Bouton introuvable : ${label}`)
  return new DOMWrapper(btn)
}

async function waitUntil(ok: () => boolean) {
  for (let i = 0; i < 50 && !ok(); i++) {
    await new Promise((resolve) => setTimeout(resolve, 5))
    await flushPromises()
  }
}

// Le composable partage son état au niveau module : chaque test repart d'une
// ardoise vide (même approche que test/composables/useGeolocation.spec.ts).
const geo = useGeolocation()

beforeEach(() => {
  geo.clear()
  geo.permission.value = null
  vi.stubGlobal('navigator', {})
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('components/GeoNearMe', () => {
  it('affiche un bouton « Près de moi » inactif par défaut', () => {
    const wrapper = mount(GeoNearMe, { attachTo: document.body })
    const button = wrapper.find('button')

    expect(button.text()).toContain('Près de moi')
    expect(button.attributes('aria-pressed')).toBe('false')
    expect(button.attributes('aria-label')).toBe('Activer la géolocalisation')
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('ouvre le dialogue de consentement au clic', async () => {
    const wrapper = mount(GeoNearMe, { attachTo: document.body })

    await wrapper.find('button').trigger('click')
    await waitUntil(() =>
      Boolean(document.body.textContent?.includes('Autoriser la géolocalisation'))
    )

    expect(document.body.textContent).toContain('Voir les centres autour de vous')
    expect(document.body.textContent).toContain('Refuser')
  })

  it('expose activate() pour un déclenchement externe (menu mobile)', async () => {
    const wrapper = mount(GeoNearMe, { attachTo: document.body })

    ;(wrapper.vm as unknown as { activate: () => void }).activate()
    await waitUntil(() =>
      Boolean(document.body.textContent?.includes('Autoriser la géolocalisation'))
    )
  })

  it('demande la position après consentement explicite', async () => {
    const getCurrentPosition = vi.fn()
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    const wrapper = mount(GeoNearMe, { attachTo: document.body })

    await wrapper.find('button').trigger('click')
    await waitUntil(() =>
      Boolean(document.body.textContent?.includes('Autoriser la géolocalisation'))
    )
    await bodyButton('Autoriser la géolocalisation').trigger('click')
    await flushPromises()

    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
    // Le dialogue est refermé après consentement.
    expect(document.body.textContent).not.toContain('Autoriser la géolocalisation')
  })

  it('ferme le dialogue sur « Refuser » sans demander la position', async () => {
    const getCurrentPosition = vi.fn()
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    const wrapper = mount(GeoNearMe, { attachTo: document.body })

    await wrapper.find('button').trigger('click')
    await waitUntil(() => Boolean(document.body.textContent?.includes('Refuser')))
    await bodyButton('Refuser').trigger('click')
    await flushPromises()

    expect(getCurrentPosition).not.toHaveBeenCalled()
    expect(document.body.textContent).not.toContain('Voir les centres autour de vous')
  })

  it('affiche le dialogue « bloqué » quand la permission est refusée', async () => {
    geo.permission.value = 'denied'
    const wrapper = mount(GeoNearMe, { attachTo: document.body })

    await wrapper.find('button').trigger('click')
    await waitUntil(() => Boolean(document.body.textContent?.includes('Localisation bloquée')))

    expect(document.body.textContent).toContain("J'ai compris")
    expect(document.body.textContent).not.toContain('Autoriser la géolocalisation')

    await bodyButton("J'ai compris").trigger('click')
    await flushPromises()
    expect(document.body.textContent).not.toContain('Localisation bloquée')
  })

  it('affiche le dialogue « bloqué » quand le navigateur a déjà refusé', async () => {
    geo.status.value = 'denied'
    const wrapper = mount(GeoNearMe, { attachTo: document.body })

    await wrapper.find('button').trigger('click')
    await waitUntil(() => Boolean(document.body.textContent?.includes('Localisation bloquée')))
  })

  it('désactive la géolocalisation quand la position est déjà connue', async () => {
    geo.position.value = { lat: 48.8566, lng: 2.3522 }
    const wrapper = mount(GeoNearMe, { attachTo: document.body })
    const button = wrapper.find('button')

    expect(button.attributes('aria-pressed')).toBe('true')
    expect(button.attributes('aria-label')).toBe('Désactiver la géolocalisation')

    await button.trigger('click')
    await flushPromises()

    expect(geo.position.value).toBeNull()
    // Position connue : pas de réouverture du dialogue.
    expect(document.body.textContent).not.toContain('Voir les centres autour de vous')
  })

  it('désactive le bouton et montre le spinner pendant la localisation', async () => {
    geo.status.value = 'locating'
    const wrapper = mount(GeoNearMe, { attachTo: document.body })
    const button = wrapper.find('button')

    expect(button.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('honore les labels personnalisés', () => {
    const wrapper = mount(GeoNearMe, {
      attachTo: document.body,
      props: { label: 'Autour de moi', activeLabel: 'Géolocalisé' }
    })

    expect(wrapper.find('button').text()).toContain('Autour de moi')
  })
})
