import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import RejoindreLeReseauPage from '~/pages/rejoindre-le-reseau.vue'

vi.stubGlobal('useHead', vi.fn())
vi.stubGlobal('useContentSeo', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({ public: { siteUrl: 'https://learnup.fr' } }))

describe('Rejoindre le réseau page', () => {
  it('présente les parcours, bénéfices et étapes du réseau', () => {
    const wrapper = mount(RejoindreLeReseauPage, {
      global: {
        stubs: {
          NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          IconAward: true,
          IconBook: true,
          IconBuilding: true,
          ProcessSteps: true,
          Benefits: { props: ['title'], template: '<section><h2>{{ title }}</h2></section>' }
        }
      }
    })

    expect(wrapper.text()).toContain('Un réseau national de centres de formation')
    expect(wrapper.text()).toContain('Trois façons de rejoindre le réseau')
    expect(wrapper.text()).toContain('Ce que le réseau apporte')
    expect(wrapper.text()).toContain("De la candidature à l'ouverture")

    const hrefs = wrapper.findAll('a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/centres/demande-de-formation?sujet=franchise')
    expect(hrefs).toContain('/referencer-mon-organisme')
    expect(hrefs).toContain('/centres/demande-de-formation?sujet=formateur')
  })
})
