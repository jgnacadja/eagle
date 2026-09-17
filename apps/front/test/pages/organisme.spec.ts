import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import OrganismePage from '~/pages/organisme.vue'

beforeEach(() => {
  vi.stubGlobal('useContentSeo', vi.fn())
})

const stubs = {
  global: {
    stubs: {
      NuxtLink: {
        props: ['to'],
        template: '<a :href="to"><slot /></a>'
      }
    }
  }
}

describe('pages/organisme.vue', () => {
  it('affiche le titre h1 attendu', async () => {
    const wrapper = await mount(OrganismePage, stubs)
    const h1 = wrapper.find('h1')

    expect(h1.exists()).toBe(true)
    expect(h1.text()).toContain('Référencer vos centres')
  })

  it('expose les ancres #modele et #candidater', async () => {
    const wrapper = await mount(OrganismePage, stubs)

    expect(wrapper.find('#modele').exists()).toBe(true)
    expect(wrapper.find('#candidater').exists()).toBe(true)
  })

  it('lie le titre "maillage" à sa section via aria-labelledby', async () => {
    const wrapper = await mount(OrganismePage, stubs)
    const section = wrapper.find('#maillage')
    const title = wrapper.find('#maillage-title')

    expect(section.exists()).toBe(true)
    expect(title.exists()).toBe(true)
    expect(section.attributes('aria-labelledby')).toBe('maillage-title')
  })

  it('le CTA final pointe vers le formulaire de candidature organisme', async () => {
    const wrapper = await mount(OrganismePage, stubs)
    const cta = wrapper.find('a[href="/centres/demande-de-formation?sujet=organisme"]')

    expect(cta.exists()).toBe(true)
  })
})
