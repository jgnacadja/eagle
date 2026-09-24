import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AssistantShell from '~/components/Assistant/AssistantShell.vue'

describe('AssistantShell', () => {
  it('affiche le titre du moteur et les deux sorties distinctes', () => {
    const wrapper = mount(AssistantShell)

    expect(wrapper.text()).toContain('Recherche assistée')
    expect(wrapper.text()).toContain('LEARN UP ACADEMY')
    expect(wrapper.text()).toContain('Fermer')
    expect(wrapper.text()).toContain('Nouvelle recherche')
  })

  it('« Fermer » émet close avec un libellé accessible explicite', async () => {
    const wrapper = mount(AssistantShell)
    const close = wrapper.find(
      'button[aria-label="Fermer la recherche assistée et revenir à la page précédente"]'
    )

    expect(close.exists()).toBe(true)
    await close.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('reset')).toBeUndefined()
  })

  it('« Nouvelle recherche » émet reset sans fermer', async () => {
    const wrapper = mount(AssistantShell)
    const reset = wrapper.findAll('button').find((b) => b.text() === 'Nouvelle recherche')

    await reset!.trigger('click')

    expect(wrapper.emitted('reset')).toHaveLength(1)
    expect(wrapper.emitted('close')).toBeUndefined()
  })
})
