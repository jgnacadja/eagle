import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { AssistantRecommendation } from '@learnup/types'
import AssistantRecommendationCard from '~/components/Assistant/RecommendationCard.vue'

const base: AssistantRecommendation = {
  slug: 'sst',
  familySlug: 'secours',
  title: 'SST — Sauveteur Secouriste du Travail',
  description: null,
  durationDays: 2,
  durationHours: null,
  modalities: ['presentiel', 'distanciel'],
  certification: 'SST',
  rank: 'primary',
  justification: 'Semble adaptée à votre besoin.',
  availability: {
    sessionId: 's1',
    startDate: '2999-09-18',
    modality: 'presentiel',
    seatsRemaining: 8,
    centreName: 'Centre LEARN UP de Créteil',
    centreSlug: 'creteil',
    city: 'Créteil',
    department: 'Val-de-Marne'
  },
  url: '/formations/secours/sst'
}

const mountOptions = {
  props: {
    recommendation: base,
    demandeTo: '/centres/demande-de-formation?formation=sst'
  },
  global: {
    stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } }
  }
}

function mountCard(overrides: Partial<AssistantRecommendation> = {}) {
  return mount(AssistantRecommendationCard, {
    ...mountOptions,
    props: { ...mountOptions.props, recommendation: { ...base, ...overrides } }
  })
}

describe('AssistantRecommendationCard', () => {
  it('labels the primary recommendation', () => {
    expect(mountCard().text()).toContain('Recommandation principale')
    expect(mountCard({ rank: 'alternative' }).text()).toContain('Alternative')
  })

  it('shows factual attributes from the catalog only', () => {
    const text = mountCard().text()
    expect(text).toContain('2 jours')
    expect(text).toContain('Présentiel / Distanciel')
    expect(text).toContain('Certifiante')
    expect(text).toContain('Semble adaptée à votre besoin.')
  })

  it('shows the availability block when a session exists', () => {
    const text = mountCard().text()
    expect(text).toContain('Centre LEARN UP de Créteil')
    expect(text).toContain('Prochaine session')
    expect(text).toContain('8 places disponibles')
    expect(text).toContain('Voir les sessions')
    expect(text).toContain('Demander cette formation')
  })

  it('renders the no-session variant without availability (E6)', () => {
    const wrapper = mount(AssistantRecommendationCard, {
      ...mountOptions,
      props: {
        ...mountOptions.props,
        recommendation: { ...base, availability: null },
        advisorTo: '/centres/demande-de-formation?sujet=conseiller'
      }
    })
    const text = wrapper.text()
    expect(text).toContain("aucune session n'est actuellement programmée")
    expect(text).toContain('Demander une session')
    expect(text).toContain('Être accompagné')
    expect(text).toContain('La page formation reste consultable')
    expect(text).toContain('Voir la formation')
    expect(text).not.toContain('Voir les sessions')
  })

  it('renders the compact alternative variant (E4)', () => {
    const wrapper = mount(AssistantRecommendationCard, {
      ...mountOptions,
      props: {
        ...mountOptions.props,
        recommendation: { ...base, rank: 'alternative' },
        compact: true
      }
    })
    const text = wrapper.text()
    expect(text).toContain('Alternative')
    expect(text).toContain('Voir la formation')
    expect(text).not.toContain('Demander cette formation')
    expect(text).not.toContain('Prochaine session')
  })

  it('links the title and CTAs', () => {
    const wrapper = mountCard()
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/formations/secours/sst')
    expect(hrefs).toContain('/formations/secours/sst#sessions')
    expect(hrefs).toContain('/centres/demande-de-formation?formation=sst')
  })
})
