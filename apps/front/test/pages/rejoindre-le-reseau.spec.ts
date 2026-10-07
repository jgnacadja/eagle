import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import RejoindreLeReseauPage from '~/pages/rejoindre-le-reseau.vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('useHead', vi.fn())
vi.stubGlobal('useContentSeo', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({ public: { siteUrl: 'https://learnup.fr' } }))

const CandidatureStub = {
  name: 'Candidature',
  props: ['open', 'voie'],
  emits: ['update:open'],
  template: '<div class="candidature-dialog" :data-open="String(open)" :data-voie="voie" />'
}

function mountPage() {
  return mount(RejoindreLeReseauPage, {
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        IconAward: true,
        IconBook: true,
        IconBuilding: true,
        ProcessSteps: true,
        Benefits: { props: ['title'], template: '<section><h2>{{ title }}</h2></section>' },
        Candidature: CandidatureStub
      }
    }
  })
}

describe('Rejoindre le réseau page', () => {
  it('présente les parcours, bénéfices et étapes du réseau', () => {
    const wrapper = mountPage()

    expect(wrapper.text()).toContain('Un réseau national de centres de formation')
    expect(wrapper.text()).toContain('Trois façons de rejoindre le réseau')
    expect(wrapper.text()).toContain('Ce que le réseau apporte')
    expect(wrapper.text()).toContain("De la candidature à l'ouverture")

    const hrefs = wrapper.findAll('a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/referencer-mon-organisme')
    // Les cartes franchise et formateur ouvrent le dialog — plus de redirection.
    expect(hrefs).not.toContain('/centres/demande-de-formation?sujet=franchise')
    expect(hrefs).not.toContain('/centres/demande-de-formation?sujet=formateur')
  })

  it('pointe l’ancre #candidater sur les cartes de parcours', () => {
    const wrapper = mountPage()

    expect(wrapper.find('a[href="#candidater"]').exists()).toBe(true)
    const target = wrapper.find('#candidater')
    expect(target.exists()).toBe(true)
    expect(target.text()).toContain('Trois façons de rejoindre le réseau')
    expect(target.find('article').exists()).toBe(true)
  })

  it.each([
    ['Candidater pour un centre', 'centre'],
    ['Proposer mes interventions', 'formateur'],
    ['Candidater', 'centre']
  ])('ouvre le dialog de candidature voie « %s » via le CTA', async (label, voie) => {
    const wrapper = mountPage()

    const dialog = () => wrapper.find('.candidature-dialog')
    expect(dialog().attributes('data-open')).toBe('false')

    const cta = wrapper.findAll('button').find((b) => b.text().replace('→', '').trim() === label)
    expect(cta, `bouton « ${label} »`).toBeTruthy()
    await cta!.trigger('click')

    expect(dialog().attributes('data-open')).toBe('true')
    expect(dialog().attributes('data-voie')).toBe(voie)
  })

  it('referme le dialog quand Candidature émet update:open false', async () => {
    const wrapper = mountPage()

    const cta = wrapper.findAll('button').find((b) => b.text().includes('Candidater'))
    await cta!.trigger('click')
    expect(wrapper.find('.candidature-dialog').attributes('data-open')).toBe('true')

    await wrapper.findComponent({ name: 'Candidature' }).vm.$emit('update:open', false)
    expect(wrapper.find('.candidature-dialog').attributes('data-open')).toBe('false')
  })
})
