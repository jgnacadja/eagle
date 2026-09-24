import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AssistantThread from '~/components/Assistant/AssistantThread.vue'
import { ASSISTANT_DEMO_STATES } from '~/data/assistant-demo'
import type { AssistantConversation } from '~/types/assistant'

function conversationOf(state: keyof typeof ASSISTANT_DEMO_STATES): AssistantConversation {
  const view = ASSISTANT_DEMO_STATES[state]
  if (view.kind !== 'conversation') throw new Error(`${state} is not a conversation`)
  return view.conversation
}

describe('AssistantThread', () => {
  it('rend le fil dans une zone aria-live polite avec la demande visible', () => {
    const wrapper = mount(AssistantThread, { props: { conversation: conversationOf('analyzing') } })
    const log = wrapper.find('[role="log"]')

    expect(log.attributes('aria-live')).toBe('polite')
    expect(log.text()).toContain('Je cherche une formation pour nos managers')
    expect(log.text()).toContain('Analyse de votre besoin…')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('clarification : chips et saisie libre remontent la réponse', async () => {
    const wrapper = mount(AssistantThread, {
      props: { conversation: conversationOf('clarification') }
    })

    const chip = wrapper.findAll('button').find((b) => b.text() === 'Risque incendie')
    await chip!.trigger('click')
    await wrapper.find('input').setValue('Gestes et postures')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('answer')).toEqual([['Risque incendie'], ['Gestes et postures']])
  })

  it('recommandations avec bandeau contexte : compare et edit remontent', async () => {
    const wrapper = mount(AssistantThread, {
      props: { conversation: conversationOf('availability') }
    })

    expect(wrapper.text()).toContain('Contexte')
    expect(wrapper.text()).toContain('Nous vous recommandons')
    expect(wrapper.findAll('article')).toHaveLength(3)

    const edit = wrapper.findAll('button').find((b) => b.text() === 'Modifier mon besoin')
    await edit!.trigger('click')
    const compare = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Comparer ces trois formations')
    await compare!.trigger('click')

    expect(wrapper.emitted('edit')).toHaveLength(1)
    expect(wrapper.emitted('compare')).toHaveLength(1)
  })

  it('rend les états sans session, aucun résultat, hors catalogue et historique', async () => {
    const noSession = mount(AssistantThread, {
      props: { conversation: conversationOf('no-session') }
    })
    expect(noSession.text()).toContain("aucune session n'est actuellement programmée")

    const noResult = mount(AssistantThread, {
      props: { conversation: conversationOf('no-result') }
    })
    expect(noResult.text()).toContain("Nous n'avons pas identifié de formation")
    await noResult
      .findAll('button')
      .find((b) => b.text().includes('Reformuler'))!
      .trigger('click')
    expect(noResult.emitted('reformulate')).toHaveLength(1)

    const outOfCatalog = mount(AssistantThread, {
      props: { conversation: conversationOf('out-of-catalog') }
    })
    expect(outOfCatalog.text()).toContain('ne correspond pas aux formations actuellement proposées')

    const history = mount(AssistantThread, { props: { conversation: conversationOf('history') } })
    expect(history.text()).toContain('Pour combien de personnes, et dans quelle ville ?')
    expect(history.text()).toContain('Votre demande complète')
  })
})
