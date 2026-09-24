import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AssistantRecommendationCard from '~/components/Assistant/AssistantRecommendationCard.vue'
import AssistantRecommendations from '~/components/Assistant/AssistantRecommendations.vue'
import type { AssistantRecommendation } from '~/types/assistant'

const conflits: AssistantRecommendation = {
  course: { title: 'Gestion des conflits en équipe', to: '/formations/management/conflits' },
  justification: 'Cette formation semble adaptée parce qu’elle s’adresse aux managers.',
  attributes: ['2 jours', 'Inter / intra'],
  sessionsTo: '/formations/management/conflits#sessions'
}

const communication: AssistantRecommendation = {
  course: { title: 'Communication managériale', to: '/formations/management/communication' },
  justification: 'Semble pertinente si le besoin porte sur la posture.',
  attributes: []
}

const sst: AssistantRecommendation = {
  course: { title: 'SST — Sauveteur Secouriste du Travail', to: '/formations/securite/sst' },
  justification: 'Cette formation semble adaptée parce qu’elle forme aux premiers secours.',
  attributes: ['2 jours', 'Certifiante'],
  availability: {
    centre: 'Centre LEARN UP de Créteil',
    distance: 'à 2,1 km du centre-ville',
    nextSession: 'jeudi 18 septembre 2026',
    seats: 'available',
    sessionsTo: '/formations/securite/sst#sessions',
    requestTo: '/centres/demande-de-formation?formation=sst'
  }
}

function mountCard(props: Record<string, unknown>) {
  return mount(AssistantRecommendationCard, { props: { position: 1, total: 3, ...props } })
}

describe('AssistantRecommendationCard', () => {
  it('carte principale sans session : intitulé exact, attributs, CTA ambre « Voir la formation »', () => {
    const wrapper = mountCard({ recommendation: conflits, rank: 'principal' })

    expect(wrapper.find('article').attributes('aria-label')).toBe('Recommandation 1 sur 3')
    expect(wrapper.text()).toContain('Recommandation principale')
    expect(wrapper.find('h3').text()).toBe('Gestion des conflits en équipe')
    expect(wrapper.findAll('li').map((li) => li.text())).toEqual(['2 jours', 'Inter / intra'])
    expect(wrapper.find('a.bg-accent').text()).toBe('Voir la formation')
    expect(wrapper.find('a[href="/formations/management/conflits#sessions"]').text()).toBe(
      'Voir les sessions'
    )
    expect(wrapper.find('a[href="/parler-a-votre-conseiller"]').text()).toBe('Être accompagné')
    expect(wrapper.findAll('a.bg-accent')).toHaveLength(1)
  })

  it('carte principale avec disponibilité réelle : bloc centre / session, sessions en CTA ambre', () => {
    const wrapper = mountCard({ recommendation: sst, rank: 'principal', total: 3 })

    expect(wrapper.text()).toContain('Centre LEARN UP de Créteil')
    expect(wrapper.text()).toContain('à 2,1 km du centre-ville')
    expect(wrapper.text()).toContain('Prochaine session : jeudi 18 septembre 2026')
    expect(wrapper.text()).toContain('Places disponibles')
    expect(wrapper.find('a.bg-accent').text()).toBe('Voir les sessions')
    expect(wrapper.find('a[href="/centres/demande-de-formation?formation=sst"]').text()).toBe(
      'Demander cette formation'
    )
    expect(wrapper.findAll('a[href="/formations/securite/sst"]')).toHaveLength(2)
  })

  it('signale les dernières places en avertissement', () => {
    const wrapper = mountCard({
      recommendation: { ...sst, availability: { ...sst.availability!, seats: 'limited' } },
      rank: 'principal'
    })

    expect(wrapper.text()).toContain('Dernières places')
    expect(wrapper.find('.bg-warning-soft').exists()).toBe(true)
  })

  it('alternative : même anatomie sans disponibilité ni chips, lien « Voir la formation »', () => {
    const wrapper = mountCard({ recommendation: { ...sst, attributes: [] }, position: 2 })

    expect(wrapper.find('article').attributes('aria-label')).toBe('Recommandation 2 sur 3')
    expect(wrapper.text()).toContain('Alternative')
    expect(wrapper.text()).not.toContain('Centre LEARN UP de Créteil')
    expect(wrapper.find('ul').exists()).toBe(false)
    expect(wrapper.findAll('a').map((a) => a.text())).toEqual([
      'SST — Sauveteur Secouriste du Travail',
      'Voir la formation'
    ])
  })
})

describe('AssistantRecommendations', () => {
  it('hiérarchise 1 principale + 2 alternatives, propose la comparaison et cite la source', async () => {
    const wrapper = mount(AssistantRecommendations, {
      props: { recommendations: { principal: conflits, alternatives: [communication, sst] } }
    })
    const cards = wrapper.findAll('article')

    expect(wrapper.find('h2').text()).toBe('Nous vous recommandons')
    expect(cards.map((c) => c.attributes('aria-label'))).toEqual([
      'Recommandation 1 sur 3',
      'Recommandation 2 sur 3',
      'Recommandation 3 sur 3'
    ])
    expect(wrapper.text()).toContain('Recommandations issues des formations publiées du catalogue')
    expect(wrapper.findAll('a').some((a) => a.text() === 'Être accompagné par un conseiller')).toBe(
      true
    )

    const compare = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Comparer ces trois formations')
    await compare!.trigger('click')
    expect(wrapper.emitted('compare')).toHaveLength(1)
  })

  it('sans alternative : pas de comparaison', () => {
    const wrapper = mount(AssistantRecommendations, {
      props: { recommendations: { principal: conflits, alternatives: [] } }
    })

    expect(wrapper.findAll('article')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('Comparer ces trois formations')
  })
})
