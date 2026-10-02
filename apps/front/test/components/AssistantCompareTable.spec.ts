import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { AssistantRecommendation } from '@learnup/types'
import AssistantCompareTable from '~/components/Assistant/CompareTable.vue'

const primary: AssistantRecommendation = {
  slug: 'gestion-conflits',
  title: 'Gestion des conflits en équipe',
  description: 'Prévenir et résoudre les conflits au sein d’une équipe.',
  justification: 'Répond directement au besoin exprimé.',
  rank: 'primary',
  durationDays: 2,
  durationHours: null,
  modalities: ['presentiel', 'distanciel'],
  certification: null,
  familySlug: 'management',
  availability: null,
  url: '/formations/management/gestion-conflits'
}

const alternative: AssistantRecommendation = {
  ...primary,
  slug: 'communication',
  title: 'Communication managériale',
  justification: 'Adaptée si l’enjeu porte sur les échanges quotidiens.',
  rank: 'alternative',
  durationDays: 3,
  modalities: ['presentiel'],
  url: '/formations/management/communication'
}

function mountTable(props: Record<string, unknown> = {}) {
  return mount(AssistantCompareTable, {
    props: {
      recommendations: [primary, alternative],
      needSummary: 'gestion des conflits pour des managers',
      advisorTo: '/centres/demande-de-formation?sujet=conseiller',
      ...props
    },
    global: {
      stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } }
    }
  })
}

describe('AssistantCompareTable', () => {
  it('affiche le titre et le besoin rappelé', () => {
    const text = mountTable().text()
    expect(text).toContain('Comparer les formations recommandées')
    expect(text).toContain('gestion des conflits pour des managers')
  })

  it('rend les lignes avec rang, durée et modalité', () => {
    const wrapper = mountTable()
    const text = wrapper.text()
    expect(text).toContain('Principale')
    expect(text).toContain('Gestion des conflits en équipe')
    expect(text).toContain('Communication managériale')
    expect(text).toContain('2 jours')
    expect(text).toContain('3 jours')
    expect(text).toContain('Présentiel')
  })

  it('lie le CTA à la fiche de la formation principale', () => {
    const wrapper = mountTable()
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/formations/management/gestion-conflits')
    expect(hrefs).toContain('/centres/demande-de-formation?sujet=conseiller')
    expect(wrapper.text()).toContain('Voir la formation principale')
    expect(wrapper.text()).toContain('Être accompagné dans le choix')
  })
})
