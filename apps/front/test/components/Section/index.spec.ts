import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import Hero from '~/components/Section/Hero.vue'
import StatsTicker from '~/components/Section/StatsTicker.vue'
import Network from '~/components/Section/Network.vue'
import HowItWorks from '~/components/Section/HowItWorks.vue'
import Formations from '~/components/Section/Formations.vue'
import Centres from '~/components/Section/Centres.vue'
import Confier from '~/components/Section/Confier.vue'
import Stats from '~/components/Section/Stats.vue'
import Testimonials from '~/components/Section/Testimonials.vue'
import News from '~/components/Section/News.vue'

const nuxtStubs = {
  NuxtLink: { template: '<a><slot /></a>' },
  AppLogo: { template: '<svg></svg>' },
  ClientOnly: { template: '<slot />' }
}

describe('Homepage sections', () => {
  it('renders Hero', () => {
    const wrapper = mount(Hero, { global: { stubs: nuxtStubs } })
    expect(wrapper.text()).toContain('orchestrés')
    expect(wrapper.text()).toContain('Confier ma formation')
  })

  it('renders StatsTicker', () => {
    const wrapper = mount(StatsTicker, { global: { stubs: nuxtStubs } })
    expect(wrapper.text()).toContain('312')
    expect(wrapper.text()).toContain('96')
  })

  it('renders Network', () => {
    const wrapper = mount(Network, { global: { stubs: nuxtStubs } })
    expect(wrapper.text()).toContain('Devenir franchisé')
    expect(wrapper.text()).toContain('Organisme partenaire')
    expect(wrapper.text()).toContain('Formateur indépendant')
  })

  it('renders HowItWorks', () => {
    const wrapper = mount(HowItWorks, { global: { stubs: nuxtStubs } })
    expect(wrapper.text()).toContain('Décrivez votre besoin')
    expect(wrapper.text()).toContain('Formez vos équipes')
  })

  it('renders Formations', () => {
    const wrapper = mount(Formations, { global: { stubs: nuxtStubs } })
    expect(wrapper.text()).toContain('Nos formations')
    expect(wrapper.text()).toContain('CACES')
    expect(wrapper.text()).toContain('Travaux en hauteur')
  })

  it('renders Centres with departments', () => {
    const wrapper = mount(Centres, { global: { stubs: nuxtStubs } })
    expect(wrapper.text()).toContain('Le réseau Learn Up Academy')
    expect(wrapper.text()).toContain('Centre de Créteil')
    expect(wrapper.text()).toContain('Départements :')
    expect(wrapper.text()).toContain('94')
  })

  it('renders Confier', () => {
    const wrapper = mount(Confier, { global: { stubs: nuxtStubs } })
    expect(wrapper.text()).toContain('Confier mes formations')
    expect(wrapper.text()).toContain('Qualifier le besoin réglementaire')
  })

  it('renders Stats', () => {
    const wrapper = mount(Stats, { global: { stubs: nuxtStubs } })
    expect(wrapper.text()).toContain('+250')
    expect(wrapper.text()).toContain('formations référencées')
  })

  it('renders Testimonials', () => {
    const wrapper = mount(Testimonials, { global: { stubs: nuxtStubs } })
    expect(wrapper.text()).toContain("Ce qu'en disent les entreprises")
  })

  it('renders News', () => {
    const wrapper = mount(News, { global: { stubs: nuxtStubs } })
    expect(wrapper.text()).toContain('Actualités')
    expect(wrapper.text()).toContain('Recyclage CACES')
  })
})
