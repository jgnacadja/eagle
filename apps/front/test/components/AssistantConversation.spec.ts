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
        emits: ['select'],
        template:
          '<article class="rec-card" :data-rank="recommendation.rank" :data-advisor="advisorTo" @click="$emit(\'select\', \'sessions\')">{{ recommendation.title }}</article>'
      },
      AssistantCompareTable: {
        props: ['recommendations', 'advisorTo'],
        emits: ['select'],
        template:
          '<table class="compare-table" :data-advisor="advisorTo" @click="$emit(\'select\', recommendations[1], \'formation\')" />'
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
    expect(wrapper.emitted('send')?.[0]).toEqual(['Premiers secours', 'suggestion'])
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

  it('relays recommendation CTA clicks with the course and its rank', async () => {
    const rec = {
      slug: 'sst',
      familySlug: 'secours',
      title: 'SST',
      description: null,
      durationDays: 2,
      durationHours: null,
      modalities: ['presentiel'],
      certification: null,
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

    await wrapper.findAll('.rec-card')[1]!.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([
      { slug: 'mac-sst', rank: 'alternative', action: 'sessions' }
    ])

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Comparer ces 2 formations'))!
      .trigger('click')
    await wrapper.find('.compare-table').trigger('click')
    expect(wrapper.emitted('select')?.[1]).toEqual([
      { slug: 'mac-sst', rank: 'alternative', action: 'formation' }
    ])
  })

  it('carries the need in natural language to every advisor exit', () => {
    const rec = {
      slug: 'sst',
      familySlug: 'secours',
      title: 'SST',
      description: null,
      durationDays: 2,
      durationHours: null,
      modalities: ['presentiel'],
      certification: null,
      justification: 'Semble adaptée.',
      availability: null,
      url: '/formations/secours/sst',
      rank: 'primary' as const
    }
    const wrapper = mountConversation({
      needSummary: 'former 8 salariés au SST à Créteil',
      unavailable: true,
      entries: [
        {
          role: 'assistant',
          content: 'Nous vous recommandons',
          reply: { kind: 'recommend', text: 'Nous vous recommandons', recommendations: [rec] }
        },
        {
          role: 'assistant',
          content: 'Aucune formation identifiée.',
          reply: { kind: 'no_results', text: 'Aucune formation identifiée.' }
        },
        {
          role: 'assistant',
          content: 'Hors catalogue.',
          reply: { kind: 'out_of_catalog', text: 'Hors catalogue.' }
        }
      ]
    })

    const advisorTo =
      '/parler-a-votre-conseiller?q=former+8+salari%C3%A9s+au+SST+%C3%A0+Cr%C3%A9teil'
    const advisorLinks = wrapper.findAll('a').filter((a) => a.attributes('href') === advisorTo)
    // Pied des recommandations, aucun résultat, hors catalogue, indisponible.
    expect(advisorLinks).toHaveLength(4)
    expect(advisorLinks.map((a) => a.text())).toEqual([
      'Être accompagné par votre conseiller',
      'Parler à votre conseiller',
      'Décrire mon besoin à votre conseiller',
      'Parler à votre conseiller'
    ])
    // Carte sans session : le même lien est transmis à la carte.
    expect(wrapper.find('.rec-card').attributes('data-advisor')).toBe(advisorTo)
  })

  it('links the advisor page without a query while nothing was described', () => {
    const wrapper = mountConversation({ unavailable: true })
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/parler-a-votre-conseiller')
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
    expect(text).toContain('Parler à votre conseiller')
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
    expect(wrapper.text()).toContain('Décrire mon besoin à votre conseiller')
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
    expect(wrapper.emitted('send')?.[0]).toEqual(['former 8 salariés au SST', 'text'])
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

  it('announces new replies politely and marks the log busy while analyzing', async () => {
    const wrapper = mountConversation({ pending: true })
    const log = wrapper.find('[data-slot="message-scroller-content"]')

    expect(log.attributes('aria-live')).toBe('polite')
    expect(log.attributes('aria-busy')).toBe('true')

    await wrapper.setProps({ pending: false })
    expect(log.attributes('aria-busy')).toBe('false')
  })

  it('keeps the header actions reachable on touch screens', () => {
    const wrapper = mountConversation()
    const close = wrapper.find('button[aria-label="Fermer la recherche assistée"]')
    expect(close.classes()).toEqual(expect.arrayContaining(['h-touch', 'w-touch']))
  })
})
