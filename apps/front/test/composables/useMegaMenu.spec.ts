import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { useMegaMenu, type MegaMenuKey } from '~/composables/useMegaMenu'

// Sur le vm du composant, les refs sont unwrapées : openMenu est un MegaMenuKey.
type HostVm = { openMenu: MegaMenuKey; close: () => void }

const Host = defineComponent({
  setup() {
    const menu = useMegaMenu()
    return { ...menu }
  },
  template:
    '<div ref="rootEl"><button data-test="inside" @click="openMenu = \'formations\'">open</button></div>'
})

function mountHost() {
  return mount(Host, { attachTo: document.body })
}

describe('useMegaMenu', () => {
  it('ouvre un menu puis le ferme via close()', async () => {
    const wrapper = mountHost()
    const vm = wrapper.vm as unknown as HostVm

    await wrapper.find('[data-test="inside"]').trigger('click')
    expect(vm.openMenu).toBe('formations')

    vm.close()
    await nextTick()
    expect(vm.openMenu).toBeNull()
    wrapper.unmount()
  })

  it('un seul menu ouvert à la fois', async () => {
    const wrapper = mountHost()
    const vm = wrapper.vm as unknown as HostVm

    vm.openMenu = 'formations'
    vm.openMenu = 'centres'
    await nextTick()

    expect(vm.openMenu).toBe('centres')
    wrapper.unmount()
  })

  it('ferme au clic en dehors du menu', async () => {
    const wrapper = mountHost()
    const vm = wrapper.vm as unknown as HostVm

    vm.openMenu = 'formations'
    await nextTick()
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(vm.openMenu).toBeNull()
    wrapper.unmount()
  })

  it('ne ferme pas au clic à l’intérieur du menu', async () => {
    const wrapper = mountHost()
    const vm = wrapper.vm as unknown as HostVm

    vm.openMenu = 'formations'
    await nextTick()
    // Un clic à l'intérieur de rootEl ne doit pas fermer le menu.
    wrapper.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(vm.openMenu).toBe('formations')
    wrapper.unmount()
  })

  it('ferme avec Échap', async () => {
    const wrapper = mountHost()
    const vm = wrapper.vm as unknown as HostVm

    vm.openMenu = 'actualites'
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    expect(vm.openMenu).toBeNull()
    wrapper.unmount()
  })

  it('ignore les clics extérieurs quand aucun menu n’est ouvert', async () => {
    const wrapper = mountHost()
    const vm = wrapper.vm as unknown as HostVm

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(vm.openMenu).toBeNull()
    wrapper.unmount()
  })
})
