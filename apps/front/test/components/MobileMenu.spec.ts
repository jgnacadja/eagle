import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach } from 'vitest'
import { nextTick } from 'vue'
import MobileMenu from '~/components/Menu/MobileMenu.vue'

const stubs = {
  ClientOnly: { template: '<slot />' },
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  Logo: { template: '<svg></svg>' },
  Accordion: { template: '<div><slot /></div>' },
  AccordionItem: { props: ['value'], template: '<div><slot /></div>' },
  AccordionTrigger: { template: '<button type="button"><slot /></button>' },
  AccordionContent: { template: '<div><slot /></div>' }
}

function mountMenu(open = false) {
  return mount(MobileMenu, {
    props: { open },
    global: { stubs },
    attachTo: document.body
  })
}

afterEach(() => {
  document.body.classList.remove('overflow-hidden')
})

describe('MobileMenu', () => {
  it('ne rend rien quand open est false', () => {
    const wrapper = mountMenu(false)

    expect(wrapper.find('#mobile-menu').exists()).toBe(false)
    wrapper.unmount()
  })

  it('affiche le dialog et les 4 rubriques quand open est true', () => {
    const wrapper = mountMenu(true)

    expect(wrapper.find('#mobile-menu').exists()).toBe(true)
    expect(wrapper.text()).toContain('Formations')
    expect(wrapper.text()).toContain('Centres')
    expect(wrapper.text()).toContain('À propos')
    expect(wrapper.text()).toContain('Actualités')
    expect(wrapper.text()).toContain('Rejoindre le réseau')
    wrapper.unmount()
  })

  it('ajoute overflow-hidden sur body à l’ouverture et le retire à la fermeture', async () => {
    const wrapper = mountMenu(false)

    await wrapper.setProps({ open: true })
    expect(document.body.classList.contains('overflow-hidden')).toBe(true)

    await wrapper.setProps({ open: false })
    expect(document.body.classList.contains('overflow-hidden')).toBe(false)
    wrapper.unmount()
  })

  it('émet update:open false au clic sur Fermer', async () => {
    const wrapper = mountMenu(true)

    await wrapper.find('button[aria-label="Fermer le menu"]').trigger('click')
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    wrapper.unmount()
  })

  it('émet update:open false sur Échap', async () => {
    const wrapper = mountMenu(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    expect(wrapper.emitted('update:open')).toEqual([[false]])
    wrapper.unmount()
  })

  it('ferme le menu au clic sur un lien de navigation', async () => {
    const wrapper = mountMenu(true)

    await wrapper.find('a[href="/formations"]').trigger('click')
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    wrapper.unmount()
  })

  it('nettoie overflow-hidden au démontage', async () => {
    const wrapper = mountMenu(false)
    await wrapper.setProps({ open: true })

    wrapper.unmount()
    expect(document.body.classList.contains('overflow-hidden')).toBe(false)
  })
})
