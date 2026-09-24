import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import AppHeader from '~/components/Menu/AppHeader.vue'

// useMenuPreload déclenche des useAsyncData qui dépendent des auto-imports
// Nuxt (useRuntimeConfig, $fetch…) absents sous Vitest — on le neutralise.
vi.mock('~/composables/useMenuData', () => ({
  useMenuPreload: () => undefined
}))

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  Logo: { template: '<svg></svg>' },
  NavigationMenu: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<nav><slot /></nav>'
  },
  NavigationMenuList: { template: '<ul><slot /></ul>' },
  NavigationMenuItem: { props: ['value'], template: '<li><slot /></li>' },
  NavigationMenuTrigger: { template: '<button type="button"><slot /></button>' },
  NavigationMenuContent: { template: '<div><slot /></div>' },
  MegaMenuFormations: { template: '<div data-test="mega-formations" />' },
  MegaMenuCentres: { template: '<div data-test="mega-centres" />' },
  MegaMenuAPropos: { template: '<div data-test="mega-apropos" />' },
  MegaMenuActualites: { template: '<div data-test="mega-actualites" />' },
  MobileMenu: {
    props: ['open'],
    template: '<div v-if="open" id="mobile-menu" />'
  },
  AssistantHeaderPill: { template: '<button data-test="assistant-header-pill" />' }
}

function mountHeader() {
  return mount(AppHeader, { global: { stubs }, attachTo: document.body })
}

function navStub(wrapper: ReturnType<typeof mountHeader>) {
  return wrapper.findComponent(stubs.NavigationMenu)
}

describe('AppHeader', () => {
  it('renders the brand name, the enterprise link and the 4 menu triggers', () => {
    const wrapper = mountHeader()

    expect(wrapper.find('[aria-label="LEARN UP ACADEMY — Accueil"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Formations')
    expect(wrapper.text()).toContain('Trouver un Centre')
    expect(wrapper.text()).toContain('Entreprise')
    expect(wrapper.find('a[href="/entreprise"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('À propos')
    expect(wrapper.text()).toContain('Actualités')
    expect(wrapper.text()).toContain('Rejoindre le réseau')
    // Entrée compacte du moteur IA (pages intérieures), avant le CTA réseau.
    expect(wrapper.find('[data-test="assistant-header-pill"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('synchronise openMenu via update:modelValue', async () => {
    const wrapper = mountHeader()

    await navStub(wrapper).vm.$emit('update:modelValue', 'formations')
    expect(navStub(wrapper).props('modelValue')).toBe('formations')

    await navStub(wrapper).vm.$emit('update:modelValue', '')
    expect(navStub(wrapper).props('modelValue')).toBe('')
    wrapper.unmount()
  })

  it('keeps a single menu open at a time', async () => {
    const wrapper = mountHeader()

    await navStub(wrapper).vm.$emit('update:modelValue', 'formations')
    await navStub(wrapper).vm.$emit('update:modelValue', 'centres')

    expect(navStub(wrapper).props('modelValue')).toBe('centres')
    wrapper.unmount()
  })

  it('closes the open menu with Escape', async () => {
    const wrapper = mountHeader()

    await navStub(wrapper).vm.$emit('update:modelValue', 'formations')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    expect(navStub(wrapper).props('modelValue')).toBe('')
    wrapper.unmount()
  })

  it('closes the open menu on outside click', async () => {
    const wrapper = mountHeader()

    await navStub(wrapper).vm.$emit('update:modelValue', 'formations')
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(navStub(wrapper).props('modelValue')).toBe('')
    wrapper.unmount()
  })

  it('opens the mobile menu via the burger button', async () => {
    const wrapper = mountHeader()

    expect(wrapper.find('#mobile-menu').exists()).toBe(false)
    await wrapper.find('button[aria-label="Ouvrir le menu"]').trigger('click')

    expect(wrapper.find('#mobile-menu').exists()).toBe(true)
    wrapper.unmount()
  })
})
