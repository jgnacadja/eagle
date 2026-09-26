import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { AssistantEntry } from '~/composables/useAssistant'
import AssistantConversation from '~/components/Assistant/Conversation.vue'

const mountOptions = {
  props: {
    entries: [] as AssistantEntry[],
    pending: false,
    unavailable: false,
    contextChips: [] as string[],
    needSummary: '',
    headcount: undefined as number | undefined,
    location: undefined as string | undefined
  },
  global: {
    stubs: {
      NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
      AssistantRecommendationCard: {
        props: ['recommendation', 'demandeTo', 'advisorTo'],
        template:
          '<article class="rec-card" :data-rank="recommendation.rank">{{ recommendation.title }}</article>'
      },
      AssistantCompareTable: {
        props: ['recommendations'],
        template: '<table class="compare-table" />'
      }
    }
  }
}

function mountConversation(props: Partial<typeof mountOptions.props> = {}) {
  return mount(AssistantConversation, {
    ...mountOptions,
    props: { ...mountOptions.props, ...props }
  })
}

describe('AssistantConversation', () => {
  it('renders user messages as right-aligned bubbles', () => {
    const wrapper = mountConversation({
      entries: [{ role: 'user', content: 'former mes équipes' }]
    })
    expect(wrapper.text()).toContain('former mes équipes')
  })

  it('renders a clarify reply with question and clickable suggestions', async () => {
    const wrapper = mountConversation({
      entries: [
        { role: 'user', content: 'sécurité' },
        {
          role: 'assistant',
          content: 'Votre besoin nécessite une précision.',
          reply: {
            kind: 'clarify',
            text: 'Votre besoin nécessite une précision.',
            question: 'Quel type de risque ?',
            suggestions: ['Premiers secours', 'Risque incendie']
          }
        }
      ]
    })

    expect(wrapper.text()).toContain('Quel type de risque ?')
    const pills = wrapper.findAll('button').filter((b) => b.text() === 'Premiers secours')
    await pills[0]!.trigger('click')
    expect(wrapper.emitted('send')?.[0]).toEqual(['Premiers secours'])
  })

  it('renders recommendations and toggles the compare table', async () => {
    const rec = {
      slug: 'sst',
      familySlug: 'secours',
      title: 'SST',
      description: null,
      durationDays: 2,
      durationHours: null,
      modalities: ['presentiel'],
      certification: 'SST',
      justification: 'Semble adaptée.',
      availability: null,
      url: '/formations/secours/sst'
    }
    const wrapper = mountConversation({
      entries: [
        {
          role: 'assistant',
          content: 'Nous vous recommandons',
          reply: {
            kind: 'recommend',
            text: 'Nous vous recommandons',
            recommendations: [
              { ...rec, rank: 'primary' as const },
              { ...rec, slug: 'mac-sst', title: 'MAC SST', rank: 'alternative' as const }
            ]
          }
        }
      ]
    })

    expect(wrapper.findAll('.rec-card')).toHaveLength(2)
    expect(wrapper.find('.compare-table').exists()).toBe(false)

    const compareBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Comparer ces 2 formations'))
    await compareBtn!.trigger('click')
    expect(wrapper.find('.compare-table').exists()).toBe(true)
  })

  it('renders the no_results action grid', () => {
    const wrapper = mountConversation({
      entries: [
        {
          role: 'assistant',
          content: 'Aucune formation identifiée.',
          reply: { kind: 'no_results', text: 'Aucune formation identifiée.' }
        }
      ]
    })
    const text = wrapper.text()
    expect(text).toContain('Reformuler mon besoin')
    expect(text).toContain('Consulter le catalogue')
    expect(text).toContain('Parler à un conseiller')
    expect(text).toContain('Faire une demande personnalisée')
  })

  it('renders out_of_catalog without approximate recommendations', () => {
    const wrapper = mountConversation({
      entries: [
        {
          role: 'assistant',
          content: 'Ce besoin ne correspond pas au catalogue.',
          reply: { kind: 'out_of_catalog', text: 'Ce besoin ne correspond pas au catalogue.' }
        }
      ]
    })
    expect(wrapper.text()).toContain('Décrire mon besoin à un conseiller')
    expect(wrapper.findAll('.rec-card')).toHaveLength(0)
  })

  it('shows the pending skeleton while analyzing and emits stop', async () => {
    const wrapper = mountConversation({ pending: true })
    expect(wrapper.text()).toContain('Analyse de votre besoin')

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Arrêter la réponse')!
      .trigger('click')
    expect(wrapper.emitted('stop')).toHaveLength(1)
  })

  it('edits a user message and emits edit with its id', async () => {
    const wrapper = mountConversation({
      entries: [{ id: 'msg-1', role: 'user', content: 'ancien besoin' }]
    })

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Modifier')!
      .trigger('click')

    const editInput = wrapper.find('input[aria-label="Modifier votre message"]')
    await editInput.setValue('nouveau besoin')
    await wrapper.findAll('form')[0]!.trigger('submit.prevent')

    expect(wrapper.emitted('edit')?.[0]).toEqual(['msg-1', 'nouveau besoin'])
  })

  it('shows the unavailable state and emits retry', async () => {
    const wrapper = mountConversation({ unavailable: true })
    expect(wrapper.text()).toContain('momentanément indisponible')
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Réessayer'))!
      .trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('renders context chips and emits reset', async () => {
    const wrapper = mountConversation({
      entries: [{ role: 'user', content: 'x' }],
      contextChips: ['SST', 'Créteil']
    })
    expect(wrapper.text()).toContain('SST')
    expect(wrapper.text()).toContain('Créteil')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Nouvelle recherche')!
      .trigger('click')
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })

  it('emits send with the composer value and clears the field', async () => {
    const wrapper = mountConversation()
    const input = wrapper.find('textarea')
    await input.setValue('former 8 salariés au SST')
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.emitted('send')?.[0]).toEqual(['former 8 salariés au SST'])
    expect((input.element as HTMLTextAreaElement).value).toBe('')
  })

  it('uses a single scroller viewport for the transcript', () => {
    const wrapper = mountConversation({
      entries: [{ role: 'user', content: 'former mes équipes' }]
    })

    expect(wrapper.findAll('[data-slot="message-scroller-viewport"]')).toHaveLength(1)
    expect(wrapper.find('[data-slot="message-scroller-content"]').attributes('role')).toBe('log')
    expect(
      wrapper.find('[data-slot="message-scroller-item"]').attributes('data-scroll-anchor')
    ).toBe('true')
  })
})
