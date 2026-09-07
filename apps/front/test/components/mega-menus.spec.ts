import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, Suspense } from 'vue'
import MegaMenuFormations from '~/components/Menu/mega-menu/MegaMenuFormations.vue'
import MegaMenuCentres from '~/components/Menu/mega-menu/MegaMenuCentres.vue'
import MegaMenuAPropos from '~/components/Menu/mega-menu/MegaMenuAPropos.vue'
import MegaMenuActualites from '~/components/Menu/mega-menu/MegaMenuActualites.vue'

const navigateMock = vi.fn()
vi.stubGlobal('navigateTo', navigateMock)

vi.mock('~/composables/useMenuData', async () => {
  const { ref } = await import('vue')
  return {
    useMenuFamilles: async () =>
      ref([
        { slug: 'securite-prevention', label: 'Sécurité & prévention', count: 32 },
        { slug: 'management', label: 'Management', count: 12 },
        { slug: 'caces-conduite-engins', label: 'CACES & conduite d’engins', count: 58 }
      ]),
    useMenuFormationsALaUne: async () =>
      ref([
        {
          slug: 'caces-r489',
          label: 'CACES R489 — chariots élévateurs',
          to: '/formations/caces-conduite-engins/caces-r489'
        }
      ]),
    useMenuCentres: async () => ({
      regions: ref([
        { slug: 'ile-de-france', label: 'Île-de-France', count: 2 },
        { slug: 'occitanie', label: 'Occitanie', count: 1 }
      ]),
      centresParRegion: ref(
        new Map([
          [
            'Île-de-France',
            [
              {
                slug: 'creteil',
                name: 'Centre de Créteil',
                city: 'Créteil',
                department: 'Val-de-Marne',
                region: 'Île-de-France'
              }
            ]
          ],
          [
            'Occitanie',
            [
              {
                slug: 'toulouse',
                name: 'Centre de Toulouse',
                city: 'Toulouse',
                department: 'Haute-Garonne',
                region: 'Occitanie'
              }
            ]
          ]
        ])
      )
    })
  }
})

async function mountMenu(component: object) {
  const Host = defineComponent({
    render() {
      return h(Suspense, () => h(component))
    }
  })
  const wrapper = mount(Host, { global: { stubs } })
  await flushPromises()
  return wrapper
}

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
  it('liste les familles dynamiques et la première sélectionnée par défaut', async () => {
    const wrapper = await mountMenu(MegaMenuFormations)

    expect(wrapper.text()).toContain('Familles')
    expect(wrapper.text()).toContain('Sécurité & prévention')
    expect(wrapper.text()).toContain('À la une')
    expect(wrapper.text()).toContain('CACES R489 — chariots élévateurs')
  })

  it('change de famille au survol', async () => {
    const wrapper = await mountMenu(MegaMenuFormations)
    const btn = wrapper.findAll('button').find((b) => b.text().includes('Management'))!

    await btn.trigger('mouseenter')
    expect(wrapper.text()).toContain('12 formations dans cette famille')
  })

  it('émet close au clic sur un lien', async () => {
    const wrapper = await mountMenu(MegaMenuFormations)

    await wrapper.find('a[href="/formations"]').trigger('click')
    expect(wrapper.findComponent(MegaMenuFormations).emitted('close')).toBeTruthy()
  })
})

describe('MegaMenuCentres', () => {
  it('liste les régions et les centres Île-de-France par défaut', async () => {
    const wrapper = await mountMenu(MegaMenuCentres)

    expect(wrapper.text()).toContain('Régions')
    expect(wrapper.text()).toContain('Île-de-France — 2 centres')
    expect(wrapper.text()).toContain('Centre de Créteil')
  })

  it('change de région au clic et met à jour les centres', async () => {
    const wrapper = await mountMenu(MegaMenuCentres)
    const btn = wrapper.findAll('button').find((b) => b.text().includes('Occitanie'))!

    await btn.trigger('click')
    expect(wrapper.text()).toContain('Occitanie — 1 centre')
    expect(wrapper.text()).toContain('Centre de Toulouse')
    expect(wrapper.text()).not.toContain('Centre de Créteil')
  })

  it('les liens centre pointent vers /centres/{slug}', async () => {
    const wrapper = await mountMenu(MegaMenuCentres)

    expect(wrapper.find('a[href="/centres/creteil"]').exists()).toBe(true)
  })

  it('la recherche vide ne navigue pas', async () => {
    const wrapper = await mountMenu(MegaMenuCentres)

    await wrapper.find('form').trigger('submit.prevent')
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('la recherche renseignée navigue vers /centres et ferme', async () => {
    const wrapper = await mountMenu(MegaMenuCentres)

    await wrapper.find('input').setValue('Lille')
    await wrapper.find('form').trigger('submit.prevent')

    expect(navigateMock).toHaveBeenCalledWith({ path: '/centres', query: { q: 'Lille' } })
    expect(wrapper.findComponent(MegaMenuCentres).emitted('close')).toBeTruthy()
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

  it('les liens article pointent vers /actualites/{slug}', () => {
    const wrapper = mount(MegaMenuActualites, { global: { stubs } })

    expect(wrapper.find('a[href="/actualites/recyclage-caces-echeances-2027-idf"]').exists()).toBe(
      true
    )
  })
})
