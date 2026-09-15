import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import RejoindreLeReseauPage from '~/pages/rejoindre-le-reseau.vue'

vi.stubGlobal('useHead', vi.fn())

describe('Rejoindre le réseau page', () => {
  it('présente les parcours, bénéfices et étapes du réseau', () => {
    const wrapper = mount(RejoindreLeReseauPage, {
      global: {
        stubs: {
          NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          IconAward: true,
          IconBook: true,
          IconBuilding: true
        }
      }
    })

    expect(wrapper.text()).toContain('Un réseau national de centres de formation')
    expect(wrapper.text()).toContain('Trois façons de rejoindre le réseau')
    expect(wrapper.text()).toContain('Ce que le réseau apporte')
    expect(wrapper.text()).toContain("De la candidature à l'ouverture")
    expect(wrapper.findAll('article')).toHaveLength(11)
  })
})
