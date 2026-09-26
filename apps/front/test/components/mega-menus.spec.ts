import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, Suspense } from 'vue'
import MegaMenuFormations from '~/components/Menu/mega-menu/MegaMenuFormations.vue'
import MegaMenuCentres from '~/components/Menu/mega-menu/MegaMenuCentres.vue'
import MegaMenuAPropos from '~/components/Menu/mega-menu/MegaMenuAPropos.vue'
import MegaMenuActualites from '~/components/Menu/mega-menu/MegaMenuActualites.vue'

const navigateMock = vi.fn()
vi.stubGlobal('navigateTo', navigateMock)

interface MenuSlug {
  slug: string
  label: string
}

const menuState = vi.hoisted(() => ({
  refs: {} as {
    familles?: { value: { slug: string; label: string; count: number }[] }
    centreRegions?: { value: { slug: string; label: string; count: number }[] }
    actuRubriques?: { value: MenuSlug[] }
    actuRegions?: { value: { slug: string; label: string; count: number }[] }
  },
  defaultFamilles: [
    { slug: 'securite-prevention', label: 'Sécurité & prévention', count: 32 },
    { slug: 'management', label: 'Management', count: 12 },
    { slug: 'caces-conduite-engins', label: 'CACES & conduite d’engins', count: 58 }
  ],
  defaultCentreRegions: [
    { slug: 'ile-de-france', label: 'Île-de-France', count: 2 },
    { slug: 'occitanie', label: 'Occitanie', count: 1 }
  ],
  defaultActuRubriques: [
    { slug: 'toute-actualite', label: 'Toute l’actualité du réseau' },
    { slug: 'presse', label: 'Presse' },
    { slug: 'reglementation', label: 'Réglementation' },
    { slug: 'vie-du-reseau', label: 'Vie du réseau' }
  ] as MenuSlug[],
  defaultActuRegions: [
    { slug: 'ile-de-france', label: 'Île-de-France', count: 3 },
    { slug: 'occitanie', label: 'Occitanie', count: 1 }
  ],
  centresParRegion: new Map<string, unknown[]>() as Map<string, unknown[]>
}))

const { defaultFamilles, defaultCentreRegions, defaultActuRubriques, defaultActuRegions } =
  menuState

vi.mock('~/composables/useMenuData', async () => {
  const { ref } = await import('vue')
  const familles = ref([...menuState.defaultFamilles])
  const centreRegions = ref([...menuState.defaultCentreRegions])
  const actuRubriques = ref<MenuSlug[]>([...menuState.defaultActuRubriques])
  const actuRegions = ref([...menuState.defaultActuRegions])
  menuState.refs = { familles, centreRegions, actuRubriques, actuRegions }
  return {
    useMenuFamilles: () => familles,
    useMenuFormationsALaUne: () =>
      ref([
        {
          slug: 'caces-r489',
          label: 'CACES R489 — chariots élévateurs',
          to: '/formations/caces-conduite-engins/caces-r489'
        }
      ]),
    useMenuFormationsParFamille: () =>
      ref({
        'securite-prevention': [
          {
            slug: 'sst-initial',
            label: 'SST — Sauveteur secouriste du travail',
            to: '/formations/securite-prevention/sst-initial'
          }
        ],
        management: [
          {
            slug: 'manager-equipe',
            label: 'Manager une équipe',
            to: '/formations/management/manager-equipe'
          }
        ]
      }),
    useMenuCentres: () => ({
      regions: centreRegions,
      centresParRegion: ref(menuState.centresParRegion)
    }),
    useMenuLegalPages: () =>
      ref([
        { slug: 'mentions-legales', label: 'Mentions légales', showInTabs: true },
        {
          slug: 'confidentialite',
          label: 'Politique de confidentialité',
          showInTabs: true
        }
      ]),
    useMenuActualites: () => ({
      rubriques: actuRubriques,
      regions: actuRegions,
      actualitesParRegion: ref({
        'ile-de-france': [
          {
            slug: 'recyclage-caces-echeances-2027-idf',
            categorySlug: 'reglementation',
            tag: 'Réglementation',
            date: '3 septembre 2026',
            title: 'Recyclage CACES : anticiper les échéances 2027 en Île-de-France'
          },
          {
            slug: 'nouveau-centre-creteil',
            categorySlug: 'vie-du-reseau',
            tag: 'Vie du réseau',
            date: '28 août 2026',
            title: 'Nouveau centre ouvert à Créteil'
          }
        ],
        occitanie: [
          {
            slug: 'ouverture-toulouse-management',
            categorySlug: 'vie-du-reseau',
            tag: 'Vie du réseau',
            date: '19 août 2026',
            title: 'Le centre de Toulouse ouvre une offre management'
          },
          {
            slug: 'session-occitanie',
            categorySlug: 'reglementation',
            tag: 'Réglementation',
            date: '18 août 2026',
            title: 'Les obligations évoluent en Occitanie'
          }
        ]
      })
    })
  }
})

beforeEach(() => {
  menuState.refs.familles!.value = [...defaultFamilles]
  menuState.refs.centreRegions!.value = [...defaultCentreRegions]
  menuState.refs.actuRubriques!.value = [...defaultActuRubriques]
  menuState.refs.actuRegions!.value = [...defaultActuRegions]
  menuState.centresParRegion.clear()
  menuState.centresParRegion.set('Île-de-France', [
    {
      slug: 'creteil',
      name: 'Centre de Créteil',
      city: 'Créteil',
      department: 'Val-de-Marne',
      region: 'Île-de-France'
    }
  ])
  menuState.centresParRegion.set('Occitanie', [
    {
      slug: 'toulouse',
      name: 'Centre de Toulouse',
      city: 'Toulouse',
      department: 'Haute-Garonne',
      region: 'Occitanie'
    }
  ])
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
    expect(wrapper.text()).toContain('Les plus consultés')
    expect(wrapper.text()).toContain('CACES R489 — chariots élévateurs')
  })

  it('change de famille au clic', async () => {
    const wrapper = await mountMenu(MegaMenuFormations)
    const btn = wrapper.findAll('button').find((b) => b.text().includes('Management'))!

    await btn.trigger('click')
    expect(wrapper.find('a[href="/formations/management/manager-equipe"]').exists()).toBe(true)
  })

  it('liste les formations de la famille sélectionnée', async () => {
    const wrapper = await mountMenu(MegaMenuFormations)

    expect(wrapper.find('a[href="/formations/securite-prevention/sst-initial"]').exists()).toBe(
      true
    )

    const btn = wrapper.findAll('button').find((b) => b.text().includes('Management'))!
    await btn.trigger('click')
    expect(wrapper.find('a[href="/formations/management/manager-equipe"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/formations/securite-prevention/sst-initial"]').exists()).toBe(
      false
    )
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
    expect(wrapper.find('a[href="/contact"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/confidentialite"]').exists()).toBe(true)
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

  it('filtre les publications quand une rubrique est sélectionnée', async () => {
    const wrapper = mount(MegaMenuActualites, { global: { stubs } })
    const rubrique = wrapper.findAll('button').find((button) => button.text() === 'Vie du réseau')!

    await rubrique.trigger('click')

    expect(wrapper.text()).toContain('Nouveau centre ouvert à Créteil')
    expect(wrapper.text()).not.toContain('Recyclage CACES : anticiper les échéances 2027')
  })

  it('affiche un message rubrique quand aucune actu ne matche', async () => {
    const wrapper = mount(MegaMenuActualites, { global: { stubs } })
    const rubrique = wrapper.findAll('button').find((button) => button.text() === 'Presse')!

    await rubrique.trigger('click')

    // 'Presse' n'a d'actus dans aucune région → pas de région sélectionnée
    expect(wrapper.text()).toContain('Aucune publication récente pour cette rubrique.')
    expect(wrapper.text()).not.toContain('dans cette région')
    expect(wrapper.text()).toContain('Aucune région disponible.')
  })

  it('sélectionne une région au focus et ferme sur les liens et cartes', async () => {
    const wrapper = mount(MegaMenuActualites, { global: { stubs } })

    const region = wrapper.findAll('button').find((b) => b.text().includes('Occitanie'))!
    await region.trigger('focus')
    expect(wrapper.text()).toContain('Le centre de Toulouse ouvre une offre management')

    // Carte article → select → close ; liens « Toutes les régions/actualités » → close.
    await wrapper.find('a[href="/actualites/session-occitanie"]').trigger('click')
    for (const link of wrapper.findAll('a[href="/actualites"]')) await link.trigger('click')

    expect(wrapper.emitted('close')!.length).toBeGreaterThanOrEqual(3)
  })

  it('pré-sélectionne rubrique et région quand les données arrivent tard', async () => {
    menuState.refs.actuRubriques!.value = []
    menuState.refs.actuRegions!.value = []
    const wrapper = mount(MegaMenuActualites, { global: { stubs } })

    menuState.refs.actuRubriques!.value = [...defaultActuRubriques]
    menuState.refs.actuRegions!.value = [...defaultActuRegions]
    await flushPromises()

    expect(wrapper.text()).toContain('Recyclage CACES')
  })

  it('affiche le message région quand « toute l’actualité » est vide', async () => {
    menuState.refs.actuRegions!.value = [
      ...defaultActuRegions,
      { slug: 'bretagne', label: 'Bretagne', count: 0 }
    ]
    const wrapper = mount(MegaMenuActualites, { global: { stubs } })

    const bretagne = wrapper.findAll('button').find((b) => b.text().includes('Bretagne'))!
    await bretagne.trigger('click')

    expect(wrapper.text()).toContain('Aucune publication récente pour cette région.')
  })
})

describe('sélections tardives des méga-menus', () => {
  it('pré-sélectionne la première famille quand elle arrive tard', async () => {
    menuState.refs.familles!.value = []
    const wrapper = await mountMenu(MegaMenuFormations)

    menuState.refs.familles!.value = [...defaultFamilles]
    await flushPromises()

    expect(wrapper.find('a[href="/formations/securite-prevention/sst-initial"]').exists()).toBe(
      true
    )
  })

  it('sélectionne la famille au focus', async () => {
    const wrapper = await mountMenu(MegaMenuFormations)

    const btn = wrapper.findAll('button').find((b) => b.text().includes('Management'))!
    await btn.trigger('focus')

    expect(wrapper.find('a[href="/formations/management/manager-equipe"]').exists()).toBe(true)
  })

  it('pré-sélectionne la première région quand elle arrive tard', async () => {
    menuState.refs.centreRegions!.value = []
    const wrapper = await mountMenu(MegaMenuCentres)

    menuState.refs.centreRegions!.value = [...defaultCentreRegions]
    await flushPromises()

    expect(wrapper.find('a[href="/centres/creteil"]').exists()).toBe(true)
  })

  it('sélectionne la région au focus', async () => {
    const wrapper = await mountMenu(MegaMenuCentres)

    const btn = wrapper.findAll('button').find((b) => b.text().includes('Occitanie'))!
    await btn.trigger('focus')

    expect(wrapper.find('a[href="/centres/toulouse"]').exists()).toBe(true)
  })

  it('émet close sur les liens et la carte centre', async () => {
    const wrapper = await mountMenu(MegaMenuCentres)
    const menu = wrapper.findComponent(MegaMenuCentres)

    await wrapper.find('a[href="/centres"]').trigger('click')
    const tousLesCentres = wrapper.findAll('a').find((a) => a.text().includes('Tous les centres'))!
    await tousLesCentres.trigger('click')
    await wrapper.find('a[href="/centres/demande-de-formation"]').trigger('click')
    await wrapper.find('a[href="/centres/creteil"]').trigger('click')

    expect(menu.emitted('close')!.length).toBeGreaterThanOrEqual(4)
  })

  it('retombe sur la ville quand le centre n’a pas de département', async () => {
    menuState.centresParRegion.set('Occitanie', [
      { slug: 'albi', name: "Centre d'Albi", city: 'Albi', department: null, region: 'Occitanie' }
    ])
    const wrapper = await mountMenu(MegaMenuCentres)

    const btn = wrapper.findAll('button').find((b) => b.text().includes('Occitanie'))!
    await btn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Albi')
  })

  it('retombe sur une liste vide quand la région n’a pas de centres', async () => {
    menuState.refs.centreRegions!.value = [
      ...defaultCentreRegions,
      { slug: 'bretagne', label: 'Bretagne', count: 1 }
    ]
    const wrapper = await mountMenu(MegaMenuCentres)

    const btn = wrapper.findAll('button').find((b) => b.text().includes('Bretagne'))!
    await btn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Tous les centres Bretagne')
  })

  it('monte sans régions', async () => {
    menuState.refs.centreRegions!.value = []
    const wrapper = await mountMenu(MegaMenuCentres)

    expect(wrapper.text()).toContain('centre')
  })
})

describe('MegaMenuFormations — interactions close', () => {
  it('émet close sur la carte, les liens famille et le CTA', async () => {
    const wrapper = await mountMenu(MegaMenuFormations)
    const menu = wrapper.findComponent(MegaMenuFormations)

    await wrapper.find('a[href="/formations/securite-prevention/sst-initial"]').trigger('click')
    const familleLink = wrapper.findAll('a').find((a) => a.text().includes('Voir la famille'))!
    await familleLink.trigger('click')
    await wrapper.find('a[href="/formations/caces-conduite-engins/caces-r489"]').trigger('click')
    await wrapper.find('a[href="/etre-guide"]').trigger('click')

    expect(menu.emitted('close')!.length).toBeGreaterThanOrEqual(4)
  })
})

describe('MegaMenuAPropos — interactions close', () => {
  it('émet close sur les liens à propos et légaux', async () => {
    const wrapper = await mountMenu(MegaMenuAPropos)
    const menu = wrapper.findComponent(MegaMenuAPropos)

    const links = wrapper.findAll('a')
    for (const link of links) {
      await link.trigger('click')
    }

    expect(menu.emitted('close')!.length).toBe(links.length)
  })
})
