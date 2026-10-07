import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { defineComponent, h, nextTick, Suspense } from 'vue'
import MobileMenu from '~/components/Menu/MobileMenu.vue'

const menuState = vi.hoisted(() => ({
  familles: [
    { slug: 'management', label: 'Management', count: 12 },
    { slug: 'securite-prevention', label: 'Sécurité & prévention', count: 32 }
  ] as { slug: string; label: string; count: number }[] | null,
  regions: null as { slug: string; label: string; count: number }[] | null,
  centres: null as Map<
    string,
    { slug: string; name: string; city: string; department: string | null; region: string }[]
  > | null
}))

vi.mock('~/composables/useMenuData', async () => {
  const { ref } = await import('vue')
  return {
    useMenuFamilles: () => ref(menuState.familles),
    useMenuSousFamillesParFamille: () =>
      ref({
        'securite-prevention': [
          { slug: 'secourisme', label: 'Secourisme', count: 5 },
          { slug: 'incendie', label: 'Incendie', count: 3 }
        ]
      }),
    useMenuCentres: () => ({
      regions: ref(menuState.regions),
      centresParRegion: ref(
        menuState.centres ??
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
            ]
          ])
      )
    }),
    useMenuActualites: () => ({
      rubriques: ref([{ slug: 'reglementation', label: 'Réglementation' }]),
      regions: ref([{ slug: 'ile-de-france', label: 'Île-de-France', count: 2 }]),
      actualitesParRegion: ref({})
    }),
    useMenuFormationsALaUne: () => ref([]),
    useMenuLegalPages: () =>
      ref([
        { slug: 'mentions-legales', label: 'Mentions légales', showInTabs: true },
        { slug: 'confidentialite', label: 'Politique de confidentialité', showInTabs: true }
      ])
  }
})

const stubs = {
  ClientOnly: { template: '<slot />' },
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  Logo: { template: '<svg></svg>' },
  Accordion: { template: '<div><slot /></div>' },
  AccordionItem: { props: ['value'], template: '<div><slot /></div>' },
  AccordionTrigger: { template: '<button type="button"><slot /></button>' },
  AccordionContent: { template: '<div><slot /></div>' }
}

async function mountMenu(open = false) {
  const Host = defineComponent({
    props: { open: { type: Boolean, default: open } },
    emits: ['update:open'],
    render() {
      return h(Suspense, () =>
        h(MobileMenu, {
          open: this.open,
          'onUpdate:open': (v: boolean) => this.$emit('update:open', v)
        })
      )
    }
  })
  const wrapper = mount(Host, {
    global: { stubs },
    attachTo: document.body
  })
  await flushPromises()
  return wrapper
}

afterEach(() => {
  document.body.classList.remove('overflow-hidden')
  menuState.familles = [
    { slug: 'management', label: 'Management', count: 12 },
    { slug: 'securite-prevention', label: 'Sécurité & prévention', count: 32 }
  ]
  menuState.regions = [
    { slug: 'ile-de-france', label: 'Île-de-France', count: 2 },
    { slug: 'bretagne', label: 'Bretagne', count: 7 }
  ]
  menuState.centres = null
})

describe('MobileMenu', () => {
  it('ne rend rien quand open est false', async () => {
    const wrapper = await mountMenu(false)

    expect(wrapper.find('#mobile-menu').exists()).toBe(false)
    wrapper.unmount()
  })

  it('affiche le dialog et les rubriques quand open est true', async () => {
    const wrapper = await mountMenu(true)

    expect(wrapper.find('#mobile-menu').exists()).toBe(true)
    expect(wrapper.text()).toContain('Formations')
    expect(wrapper.text()).toContain('Trouver un Centre')
    expect(wrapper.text()).toContain('Entreprise')
    expect(wrapper.find('a[href="/entreprise"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('À propos')
    expect(wrapper.text()).toContain('Actualités')
    expect(wrapper.text()).toContain('Rejoindre le réseau')
    wrapper.unmount()
  })

  it('ajoute overflow-hidden sur body à l’ouverture et le retire à la fermeture', async () => {
    const wrapper = await mountMenu(false)

    await wrapper.setProps({ open: true })
    expect(document.body.classList.contains('overflow-hidden')).toBe(true)

    await wrapper.setProps({ open: false })
    expect(document.body.classList.contains('overflow-hidden')).toBe(false)
    wrapper.unmount()
  })

  it('émet update:open false au clic sur Fermer', async () => {
    const wrapper = await mountMenu(true)

    await wrapper.find('button[aria-label="Fermer le menu"]').trigger('click')
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    wrapper.unmount()
  })

  it('émet update:open false sur Échap', async () => {
    const wrapper = await mountMenu(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    expect(wrapper.emitted('update:open')).toEqual([[false]])
    wrapper.unmount()
  })

  it('affiche les sous-familles dépliables et le lien Voir la famille', async () => {
    const wrapper = await mountMenu(true)

    // Famille avec sous-familles : accordéon + encart ; sans : lien direct.
    expect(wrapper.text()).toContain('Secourisme')
    expect(wrapper.text()).toContain('Incendie')
    expect(wrapper.text()).toContain('Voir la famille')
    expect(wrapper.find('a[href="/formations/management"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('ferme le menu au clic sur un lien de navigation', async () => {
    const wrapper = await mountMenu(true)

    await wrapper.find('a[href="/formations"]').trigger('click')
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    wrapper.unmount()
  })

  it('ferme le menu au clic sur le lien Entreprise', async () => {
    const wrapper = await mountMenu(true)

    await wrapper.find('a[href="/entreprise"]').trigger('click')
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    wrapper.unmount()
  })

  it('affiche le lien région sans centres et ferme le menu au clic', async () => {
    const wrapper = await mountMenu(true)

    const link = wrapper.findAll('a').find((a) => a.text().includes('Bretagne'))
    expect(link?.exists()).toBe(true)
    expect(link?.text()).toContain('Bretagne')
    expect(link?.text()).toContain('7')

    await link?.trigger('click')
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    wrapper.unmount()
  })

  it('tolère des listes de familles et régions absentes', async () => {
    menuState.familles = null
    menuState.regions = null
    const wrapper = await mountMenu(true)

    expect(wrapper.find('#mobile-menu').exists()).toBe(true)
    wrapper.unmount()
  })

  it('affiche la ville quand le centre n’a pas de département', async () => {
    menuState.centres = new Map([
      [
        'Île-de-France',
        [
          {
            slug: 'sans-dept',
            name: 'Centre sans département',
            city: 'Melun',
            department: null,
            region: 'Île-de-France'
          }
        ]
      ]
    ])
    const wrapper = await mountMenu(true)

    expect(wrapper.text()).toContain('Centre sans département')
    expect(wrapper.text()).toContain('Melun')
    wrapper.unmount()
  })

  it('nettoie overflow-hidden au démontage', async () => {
    const wrapper = await mountMenu(false)
    await wrapper.setProps({ open: true })

    wrapper.unmount()
    expect(document.body.classList.contains('overflow-hidden')).toBe(false)
  })
})
