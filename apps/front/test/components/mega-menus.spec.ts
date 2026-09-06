import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import MegaMenuFormations from '~/components/Menu/mega-menu/MegaMenuFormations.vue'
import MegaMenuCentres from '~/components/Menu/mega-menu/MegaMenuCentres.vue'
import MegaMenuAPropos from '~/components/Menu/mega-menu/MegaMenuAPropos.vue'
import MegaMenuActualites from '~/components/Menu/mega-menu/MegaMenuActualites.vue'

const navigateMock = vi.fn()
vi.stubGlobal('navigateTo', navigateMock)

const nuxtLinkStub = { props: ['to'], template: '<a :href="to"><slot /></a>' }

const stubs = {
  NuxtLink: nuxtLinkStub,
  Button: { template: '<button type="button"><slot /></button>' },
  Input: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  Label: { template: '<label><slot /></label>' }
}

describe('MegaMenuFormations', () => {
  it('liste les familles avec CACES sélectionné par défaut', () => {
    const wrapper = mount(MegaMenuFormations, { global: { stubs } })

    expect(wrapper.text()).toContain('Familles')
    expect(wrapper.text()).toContain('Sécurité & prévention')
    expect(wrapper.text()).toContain('CACES & conduite d’engins — par type d’engin')
    expect(wrapper.text()).toContain('Chariots & gerbeurs')
    expect(wrapper.text()).toContain('Les plus consultés')
  })

  it('change de famille au survol', async () => {
    const wrapper = mount(MegaMenuFormations, { global: { stubs } })
    const btn = wrapper.findAll('button').find((b) => b.text().includes('Management'))!

    await btn.trigger('mouseenter')
    // Hors CACES : pas de découpage par engin, fallback compteur
    expect(wrapper.text()).toContain('12 formations dans cette famille')
    expect(wrapper.text()).not.toContain('Management — par type d’engin')
  })

  it('émet close au clic sur un lien', async () => {
    const wrapper = mount(MegaMenuFormations, { global: { stubs } })

    await wrapper.find('a[href="/formations"]').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})

describe('MegaMenuCentres', () => {
  it('liste les régions et les centres Île-de-France par défaut', () => {
    const wrapper = mount(MegaMenuCentres, { global: { stubs } })

    expect(wrapper.text()).toContain('Régions')
    expect(wrapper.text()).toContain('Île-de-France — 43 centres')
    expect(wrapper.text()).toContain('Centre de Créteil')
  })

  it('change de région au clic et met à jour les centres', async () => {
    const wrapper = mount(MegaMenuCentres, { global: { stubs } })
    const btn = wrapper.findAll('button').find((b) => b.text().includes('Occitanie'))!

    await btn.trigger('click')
    expect(wrapper.text()).toContain('Occitanie — 27 centres')
    expect(wrapper.text()).toContain('Centre de Toulouse')
    expect(wrapper.text()).not.toContain('Centre de Créteil')
  })

  it('les liens centre pointent vers /centres/{slug}', () => {
    const wrapper = mount(MegaMenuCentres, { global: { stubs } })

    expect(wrapper.find('a[href="/centres/creteil"]').exists()).toBe(true)
  })

  it('la recherche vide ne navigue pas', async () => {
    const wrapper = mount(MegaMenuCentres, { global: { stubs } })

    await wrapper.find('form').trigger('submit.prevent')
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('la recherche renseignée navigue vers /centres et ferme', async () => {
    const wrapper = mount(MegaMenuCentres, { global: { stubs } })

    await wrapper.find('input').setValue('Lille')
    await wrapper.find('form').trigger('submit.prevent')

    expect(navigateMock).toHaveBeenCalledWith({ path: '/centres', query: { q: 'Lille' } })
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})

describe('MegaMenuAPropos', () => {
  it('liste les liens à propos et légaux', () => {
    const wrapper = mount(MegaMenuAPropos, { global: { stubs } })

    expect(wrapper.text()).toContain('Qui sommes-nous')
    expect(wrapper.text()).toContain('Mentions légales')
    expect(wrapper.find('a[href="/a-propos/contact"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/legal/confidentialite"]').exists()).toBe(true)
  })
})

describe('MegaMenuActualites', () => {
  it('liste les rubriques et seules les régions avec actus', () => {
    const wrapper = mount(MegaMenuActualites, { global: { stubs } })

    expect(wrapper.text()).toContain('Rubriques')
    expect(wrapper.text()).toContain('Île-de-France')
    // PACA et Grand Est n'ont pas d'actus → masquées
    const buttons = wrapper.findAll('button').map((b) => b.text())
    expect(buttons).not.toContain('Provence-Alpes-Côte d’Azur')
    expect(buttons).not.toContain('Grand Est')
  })

  it('affiche les actus de la région sélectionnée', async () => {
    const wrapper = mount(MegaMenuActualites, { global: { stubs } })
    const btn = wrapper.findAll('button').find((b) => b.text().includes('Occitanie'))!

    await btn.trigger('click')
    expect(wrapper.text()).toContain('Occitanie — dernières publications')
    expect(wrapper.text()).toContain('Le centre de Toulouse ouvre une offre management')
  })

  it('les liens article pointent vers /blog/{slug}', () => {
    const wrapper = mount(MegaMenuActualites, { global: { stubs } })

    expect(wrapper.find('a[href="/blog/recyclage-caces-echeances-2027-idf"]').exists()).toBe(true)
  })
})
