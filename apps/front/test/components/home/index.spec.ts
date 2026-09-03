import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import HomeHero from '~/components/home/HomeHero.vue'
import HomeNetwork from '~/components/home/HomeNetwork.vue'
import HomeHowItWorks from '~/components/home/HomeHowItWorks.vue'
import HomeFormations from '~/components/home/HomeFormations.vue'
import HomeCenters from '~/components/home/HomeCenters.vue'
import HomeConfier from '~/components/home/HomeConfier.vue'
import HomeStats from '~/components/home/HomeStats.vue'
import HomeStatsTicker from '~/components/home/HomeStatsTicker.vue'
import HomeTestimonials from '~/components/home/HomeTestimonials.vue'
import HomeNews from '~/components/home/HomeNews.vue'
import type { Article, Centre, FamilleFormation, Stat } from '@learnup/types'

const nuxtStubs = {
  NuxtLink: { template: '<a><slot /></a>' },
  AppLogo: { template: '<svg></svg>' },
  ClientOnly: { template: '<slot />' }
}

const formations = [
  {
    id: 1,
    slug: 'caces',
    name: 'CACES',
    icon: 'icon-1',
    status: 'published' as const,
    intro: null,
    seo_title: null,
    seo_description: null,
    seo_canonical: null
  },
  {
    id: 2,
    slug: 'habilitations',
    name: 'Habilitations électriques',
    icon: null,
    status: 'published' as const,
    intro: null,
    seo_title: null,
    seo_description: null,
    seo_canonical: null
  }
] satisfies FamilleFormation[]

const centres = [
  {
    id: 1,
    slug: 'creteil',
    name: 'Centre de Créteil',
    city: 'Créteil',
    address: '12 rue de la Paix',
    postal_code: '94000',
    phone: '01 84 60 00 00',
    email: null,
    contact_name: null,
    contact_role: null,
    departments_covered: ['94'],
    digiforma_url: null,
    qualiopi_certified: true,
    qualiopi_certificate_number: null,
    image: null,
    status: 'published' as const,
    seo_title: null,
    seo_description: null,
    seo_canonical: null
  },
  {
    id: 2,
    slug: 'villeneuve',
    name: 'Centre de Villeneuve-le-Roi',
    city: null,
    address: null,
    postal_code: null,
    phone: null,
    email: null,
    contact_name: null,
    contact_role: null,
    departments_covered: [],
    digiforma_url: null,
    qualiopi_certified: false,
    qualiopi_certificate_number: null,
    image: null,
    status: 'published' as const,
    seo_title: null,
    seo_description: null,
    seo_canonical: null
  }
] satisfies Centre[]

const articles = [
  {
    id: 1,
    slug: 'recyclage',
    title: 'Recyclage CACES',
    category: 'Réglementation',
    publish_at: '2026-08-28T00:00:00Z',
    cover_image: 'cover-1',
    excerpt: null,
    content: null,
    centre: null,
    status: 'published' as const,
    seo_title: null,
    seo_description: null,
    seo_canonical: null
  },
  {
    id: 2,
    slug: 'habilitations',
    title: 'Habilitations électriques',
    category: 'Conformité',
    publish_at: null,
    cover_image: null,
    excerpt: null,
    content: null,
    centre: null,
    status: 'published' as const,
    seo_title: null,
    seo_description: null,
    seo_canonical: null
  }
] satisfies Article[]

const stats = [
  { id: 1, status: 'published' as const, sort: 1, label: 'formations', value: '+250' },
  { id: 2, status: 'published' as const, sort: 2, label: 'centres', value: '+400' }
] satisfies Stat[]

describe('Homepage sections', () => {
  it('renders HomeHero and submits the search form', async () => {
    const wrapper = mount(HomeHero, { global: { stubs: nuxtStubs } })
    expect(wrapper.text()).toContain('orchestrés')
    expect(wrapper.text()).toContain('Confier ma formation')

    await wrapper.find('input[type="text"]').setValue('CACES Lyon')
    await wrapper.find('form').trigger('submit.prevent')
  })

  it('renders HomeNetwork', () => {
    const wrapper = mount(HomeNetwork, { global: { stubs: nuxtStubs } })
    expect(wrapper.text()).toContain('Devenir franchisé')
    expect(wrapper.text()).toContain('Organisme partenaire')
    expect(wrapper.text()).toContain('Formateur indépendant')
  })

  it('renders HomeHowItWorks', () => {
    const wrapper = mount(HomeHowItWorks, { global: { stubs: nuxtStubs } })
    expect(wrapper.text()).toContain('Décrivez votre besoin')
    expect(wrapper.text()).toContain('Formez vos équipes')
  })

  it('renders HomeFormations', () => {
    const wrapper = mount(HomeFormations, {
      props: { familles: formations },
      global: { stubs: nuxtStubs }
    })
    expect(wrapper.text()).toContain('Nos formations')
    expect(wrapper.text()).toContain('CACES')
  })

  it('renders HomeCenters', () => {
    const wrapper = mount(HomeCenters, {
      props: { centres },
      global: { stubs: nuxtStubs }
    })
    expect(wrapper.text()).toContain('Le réseau Learn Up Academy')
    expect(wrapper.text()).toContain('Centre de Créteil')
    expect(wrapper.text()).toContain('Coordonnées sur demande')
  })

  it('renders HomeConfier', () => {
    const wrapper = mount(HomeConfier, { global: { stubs: nuxtStubs } })
    expect(wrapper.text()).toContain('Confier mes formations')
    expect(wrapper.text()).toContain('Qualifier le besoin réglementaire')
  })

  it('renders HomeStats', () => {
    const wrapper = mount(HomeStats, {
      props: { items: stats },
      global: { stubs: nuxtStubs }
    })
    expect(wrapper.text()).toContain('+250')
    expect(wrapper.text()).toContain('formations')
  })

  it('renders HomeStatsTicker', () => {
    const wrapper = mount(HomeStatsTicker, {
      props: { items: stats },
      global: { stubs: nuxtStubs }
    })
    expect(wrapper.text()).toContain('+250')
  })

  it('renders HomeTestimonials', () => {
    const wrapper = mount(HomeTestimonials, { global: { stubs: nuxtStubs } })
    expect(wrapper.text()).toContain("Ce qu'en disent les entreprises")
  })

  it('renders HomeNews', () => {
    const wrapper = mount(HomeNews, {
      props: { articles },
      global: { stubs: nuxtStubs }
    })
    expect(wrapper.text()).toContain('Actualités')
    expect(wrapper.text()).toContain('Recyclage CACES')
    expect(wrapper.text()).toContain('Habilitations électriques')
  })
})
