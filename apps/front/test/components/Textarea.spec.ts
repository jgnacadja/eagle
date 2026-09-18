import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Textarea } from '~/components/ui/textarea'

describe('ui/Textarea', () => {
  it('rend un textarea avec son id et les classes de base', () => {
    const wrapper = mount(Textarea, { props: { id: 'parcours' } })

    expect(wrapper.element.tagName).toBe('TEXTAREA')
    expect(wrapper.attributes('id')).toBe('parcours')
    expect(wrapper.attributes('data-slot')).toBe('textarea')
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['rounded-md', 'border-outline', 'bg-paper'])
    )
  })

  it('émet update:modelValue à la saisie', async () => {
    const wrapper = mount(Textarea)

    await wrapper.setValue('Parcours de test.')

    expect(wrapper.emitted('update:modelValue')).toEqual([['Parcours de test.']])
  })

  it('reflète la valeur du v-model', () => {
    const wrapper = mount(Textarea, { props: { modelValue: 'init' } })
    const textarea = wrapper.element as HTMLTextAreaElement

    expect(textarea.value).toBe('init')
  })

  it('fusionne les classes additionnelles via cn', () => {
    const wrapper = mount(Textarea, { props: { class: 'min-h-32' } })

    expect(wrapper.classes()).toContain('min-h-32')
  })
})
