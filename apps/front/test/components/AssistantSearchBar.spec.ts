import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AssistantSearchBar from '~/components/Assistant/AssistantSearchBar.vue'

const ERROR = 'Décrivez votre besoin pour lancer la recherche.'

function mountBar(props: Record<string, unknown> = {}) {
  return mount(AssistantSearchBar, { props: { inputId: 'assistant-search', ...props } })
}

describe('AssistantSearchBar', () => {
  it('rend le champ labellisé avec le placeholder du moteur et l’étincelle', () => {
    const wrapper = mountBar()
    const input = wrapper.find('input#assistant-search')

    expect(wrapper.find('[role="search"]').attributes('aria-label')).toBe(
      'Décrivez votre besoin de formation'
    )
    expect(input.attributes('placeholder')).toBe('Décrivez votre besoin de formation…')
    expect(wrapper.find('label[for="assistant-search"]').text()).toBe(
      'Décrivez votre besoin de formation'
    )
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('applique la taille hero et affiche l’aide sous le champ', () => {
    const wrapper = mountBar({ size: 'hero', hint: 'Écrivez comme à un conseiller.' })

    expect(wrapper.find('.md\\:h-16').exists()).toBe(true)
    expect(wrapper.text()).toContain('Écrivez comme à un conseiller.')
  })

  it('soumet la requête trimée à la touche Entrée', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('input#assistant-search')

    await input.setValue('  former 8 salariés  ')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:modelValue')).toEqual([['former 8 salariés']])
    expect(wrapper.emitted('submit')).toEqual([['former 8 salariés']])
    expect(wrapper.text()).not.toContain(ERROR)
  })

  it('refuse une soumission vide : erreur liée au champ, rien d’émis', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('input#assistant-search')

    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.find('#assistant-search-error').text()).toBe(ERROR)
    expect(input.attributes('aria-invalid')).toBe('true')

    await input.setValue('sst')
    expect(wrapper.find('#assistant-search-error').exists()).toBe(false)
  })

  it('effacer le champ n’est pas une soumission vide', async () => {
    const wrapper = mountBar({ modelValue: 'sst' })

    await wrapper.find('button[aria-label="Effacer la recherche"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.find('#assistant-search-error').exists()).toBe(false)
  })
})
