import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Input, inputVariants } from '~/components/ui/input'

describe('ui/Input', () => {
  it('rend un input avec son id et le variant par défaut', () => {
    const wrapper = mount(Input, { props: { id: 'email' } })

    expect(wrapper.element.tagName).toBe('INPUT')
    expect(wrapper.attributes('id')).toBe('email')
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['h-9', 'rounded-md', 'border-input']))
  })

  it.each([
    ['field', 'h-control'],
    ['field-lg', 'px-lg']
  ] as const)('applique le variant %s', (variant, expected) => {
    const wrapper = mount(Input, { props: { id: 'x', variant } })

    expect(wrapper.classes()).toContain(expected)
    expect(wrapper.classes()).toContain('rounded-full')
  })

  it('émet update:modelValue à la saisie', async () => {
    const wrapper = mount(Input, { props: { id: 'x' } })

    await wrapper.setValue('jean@entreprise.fr')

    expect(wrapper.emitted('update:modelValue')).toEqual([['jean@entreprise.fr']])
  })

  it('reflète la valeur du v-model', () => {
    const wrapper = mount(Input, { props: { id: 'x', modelValue: 'init' } })
    const input = wrapper.element as HTMLInputElement

    expect(input.value).toBe('init')
  })

  it('fusionne les classes additionnelles via cn', () => {
    const wrapper = mount(Input, { props: { id: 'x', class: 'w-auto' } })

    expect(wrapper.classes()).toContain('w-auto')
  })
})

describe('inputVariants', () => {
  it('retombe sur le variant default', () => {
    expect(inputVariants()).toContain('h-9')
  })
})
