import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AssistantComparison from '~/components/Assistant/AssistantComparison.vue'
import type { AssistantComparison as Comparison } from '~/types/assistant'

const comparison: Comparison = {
  need: 'gestion des conflits pour des managers',
  rows: [
    {
      course: { title: 'Gestion des conflits en équipe', to: '/formations/management/conflits' },
      principal: true,
      why: 'Répond directement au besoin exprimé.',
      duration: '2 jours',
      modality: 'Présentiel / distanciel'
    },
    {
      course: { title: 'Communication managériale', to: '/formations/management/communication' },
      why: 'Plus adaptée si l’enjeu porte sur la posture.',
      duration: '2 jours',
      modality: 'Présentiel'
    }
  ]
}

describe('AssistantComparison', () => {
  it('rend un tableau accessible avec la principale mise en avant', () => {
    const wrapper = mount(AssistantComparison, { props: { comparison } })
    const table = wrapper.find('table')

    expect(wrapper.find('h2').text()).toBe('Comparer les formations recommandées')
    expect(wrapper.text()).toContain('gestion des conflits pour des managers')
    expect(table.find('caption').text()).toBe('Comparaison des formations recommandées')
    expect(table.findAll('th[scope="col"]').map((th) => th.text())).toEqual([
      'Formation',
      'Pourquoi la choisir',
      'Durée',
      'Modalité'
    ])
    const rows = table.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.classes()).toContain('bg-surface-soft')
    expect(rows[0]!.find('th[scope="row"]').text()).toContain('Principale')
    expect(rows[1]!.text()).toContain('Communication managériale')
  })

  it('décline la comparaison en cartes sur mobile et mène à la formation principale', () => {
    const wrapper = mount(AssistantComparison, { props: { comparison } })
    const cards = wrapper.findAll('ul li')

    expect(cards).toHaveLength(2)
    expect(cards[0]!.text()).toContain('Principale')
    expect(cards[1]!.text()).toContain('2 jours · Présentiel')
    expect(wrapper.find('a.bg-accent').attributes('href')).toBe('/formations/management/conflits')
    expect(wrapper.find('a[href="/parler-a-votre-conseiller"]').text()).toBe(
      'Être accompagné dans le choix'
    )
  })

  it('émet back pour revenir aux recommandations', async () => {
    const wrapper = mount(AssistantComparison, { props: { comparison } })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  it('sans ligne principale, pas de CTA formation principale', () => {
    const wrapper = mount(AssistantComparison, {
      props: { comparison: { need: 'x', rows: [comparison.rows[1]!] } }
    })

    expect(wrapper.find('a.bg-accent').exists()).toBe(false)
  })
})
