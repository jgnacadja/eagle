import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MegaMenuCard from '~/components/Menu/mega-menu/MegaMenuCard.vue'

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' }
}

describe('MegaMenuCard', () => {
  it('rend un lien carte avec titre et meta', () => {
    const wrapper = mount(MegaMenuCard, {
      props: { to: '/centres/creteil', title: 'Centre de Créteil', meta: 'Val-de-Marne' },
      global: { stubs }
    })

    const link = wrapper.find('a[href="/centres/creteil"]')
    expect(link.exists()).toBe(true)
    expect(wrapper.text()).toContain('Centre de Créteil')
    expect(wrapper.text()).toContain('Val-de-Marne')
  })

  it('masque la meta quand elle est absente', () => {
    const wrapper = mount(MegaMenuCard, {
      props: { to: '/centres/creteil', title: 'Centre de Créteil' },
      global: { stubs }
    })

    expect(wrapper.findAll('span')).toHaveLength(1)
  })

  it('émet select au clic', async () => {
    const wrapper = mount(MegaMenuCard, {
      props: { to: '/centres/creteil', title: 'Centre de Créteil' },
      global: { stubs }
    })

    await wrapper.find('a').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
  })
})
