import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { defineComponent, h, nextTick, Suspense } from 'vue'
import MobileMenu from '~/components/Menu/MobileMenu.vue'

const navigateMock = vi.fn()
vi.stubGlobal('navigateTo', navigateMock)

vi.mock('~/composables/useMenuData', async () => {
  const { ref } = await import('vue')
  return {
    useMenuFamilles: () =>
      ref([
        { slug: 'management', label: 'Management', count: 12 },
        { slug: 'securite-prevention', label: 'Sécurité & prévention', count: 32 }
      ]),
    useMenuSousFamillesParFamille: () =>
      ref({
        'securite-prevention': [
          { slug: 'secourisme', label: 'Secourisme', count: 5 },
          { slug: 'incendie', label: 'Incendie', count: 3 }
        ]
      }),
    useMenuCentres: () => ({
      regions: ref([{ slug: 'ile-de-france', label: 'Île-de-France', count: 2 }]),
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
})

describe('MobileMenu', () => {
  it('« Être guidé dans mon choix » ouvre le moteur IA et ferme le menu', async () => {
    const wrapper = await mountMenu(true)

    await wrapper.find('#assistant-trigger-mobile-menu').trigger('click')

    expect(navigateMock).toHaveBeenCalledWith({ path: '/recherche-assistee' })
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    wrapper.unmount()
  })

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

  it('nettoie overflow-hidden au démontage', async () => {
    const wrapper = await mountMenu(false)
    await wrapper.setProps({ open: true })

    wrapper.unmount()
    expect(document.body.classList.contains('overflow-hidden')).toBe(false)
  })
})
