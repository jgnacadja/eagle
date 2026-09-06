import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { useMegaMenu } from '~/composables/useMegaMenu'

const Host = defineComponent({
  setup() {
    const menu = useMegaMenu()
    return { ...menu }
  },
  template:
    '<div ref="rootEl"><button data-test="inside" @click="toggle(\'formations\')">toggle</button></div>'
})

function mountHost() {
  return mount(Host, { attachTo: document.body })
}

describe('useMegaMenu', () => {
  it('toggle ouvre puis ferme le même menu', async () => {
    const wrapper = mountHost()
    const vm = wrapper.vm as unknown as ReturnType<typeof useMegaMenu>

    await wrapper.find('[data-test="inside"]').trigger('click')
    expect(vm.openMenu).toBe('formations')
    expect(vm.isOpen('formations')).toBe(true)

    await wrapper.find('[data-test="inside"]').trigger('click')
    expect(vm.openMenu).toBeNull()
    wrapper.unmount()
  })

  it('un seul menu ouvert à la fois', async () => {
    const wrapper = mountHost()
    const vm = wrapper.vm as unknown as ReturnType<typeof useMegaMenu>

    vm.toggle('formations')
    vm.toggle('centres')
    await nextTick()

    expect(vm.openMenu).toBe('centres')
    expect(vm.isOpen('formations')).toBe(false)
    wrapper.unmount()
  })

  it('ferme au clic en dehors du menu', async () => {
    const wrapper = mountHost()
    const vm = wrapper.vm as unknown as ReturnType<typeof useMegaMenu>

    vm.toggle('formations')
    await nextTick()
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(vm.openMenu).toBeNull()
    wrapper.unmount()
  })

  it('ne ferme pas au clic à l’intérieur du menu', async () => {
    const wrapper = mountHost()
    const vm = wrapper.vm as unknown as ReturnType<typeof useMegaMenu>

    vm.toggle('formations')
    await nextTick()
    // Le clic sur le bouton toggle est à l'intérieur de rootEl : il rouvre/referme
    // via toggle, pas via le listener document. On simule un clic interne neutre.
    wrapper.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(vm.openMenu).toBe('formations')
    wrapper.unmount()
  })

  it('ferme avec Échap', async () => {
    const wrapper = mountHost()
    const vm = wrapper.vm as unknown as ReturnType<typeof useMegaMenu>

    vm.toggle('actualites')
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    expect(vm.openMenu).toBeNull()
    wrapper.unmount()
  })

  it('ignore les clics extérieurs quand aucun menu n’est ouvert', async () => {
    const wrapper = mountHost()
    const vm = wrapper.vm as unknown as ReturnType<typeof useMegaMenu>

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(vm.openMenu).toBeNull()
    wrapper.unmount()
  })
})
