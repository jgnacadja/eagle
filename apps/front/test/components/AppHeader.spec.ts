import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import AppHeader from '~/components/AppHeader.vue'

describe('AppHeader', () => {
  it('renders the brand name and nav links', () => {
    const wrapper = mount(AppHeader, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          Logo: { template: '<svg></svg>' },
          ClientOnly: { template: '<slot />' }
        }
      }
    })

    expect(wrapper.text()).toContain('LEARN UP ACADEMY')
    expect(wrapper.text()).toContain('Formations')
    expect(wrapper.text()).toContain('Centres')
    expect(wrapper.text()).toContain('À propos')
    expect(wrapper.text()).toContain('Actualités')
    expect(wrapper.text()).toContain('Rejoindre le réseau')
  })

  it('opens and closes the mobile menu', async () => {
    const wrapper = mount(AppHeader, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          Logo: { template: '<svg></svg>' },
          ClientOnly: { template: '<slot />' }
        }
      }
    })

    expect(wrapper.find('#mobile-menu').exists()).toBe(false)

    await wrapper.find('button[aria-label="Ouvrir le menu"]').trigger('click')
    expect(wrapper.find('#mobile-menu').isVisible()).toBe(true)

    await wrapper.find('button[aria-label="Fermer le menu"]').trigger('click')
    expect(wrapper.find('#mobile-menu').exists()).toBe(false)
  })

  it('closes the mobile menu with Escape', async () => {
    const wrapper = mount(AppHeader, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          Logo: { template: '<svg></svg>' },
          ClientOnly: { template: '<slot />' }
        }
      }
    })

    await wrapper.find('button[aria-label="Ouvrir le menu"]').trigger('click')
    expect(wrapper.find('#mobile-menu').isVisible()).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.find('#mobile-menu').exists()).toBe(false)
  })
})
