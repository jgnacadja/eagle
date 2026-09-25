import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Checkbox } from '~/components/ui/checkbox'

describe('ui/Checkbox', () => {
  it('rend un bouton role="checkbox" décoché par défaut', () => {
    const wrapper = mount(Checkbox)
    const box = wrapper.find('[role="checkbox"]')

    expect(box.exists()).toBe(true)
    expect(box.attributes('data-state')).toBe('unchecked')
    expect(box.find('svg').exists()).toBe(false)
  })

  it('émet update:modelValue au clic', async () => {
    const wrapper = mount(Checkbox)
    const box = wrapper.find('[role="checkbox"]')

    await box.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(box.attributes('data-state')).toBe('checked')
  })

  it('affiche la coche IconCheck quand coché', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: true } })
    const box = wrapper.find('[role="checkbox"]')

    expect(box.attributes('data-state')).toBe('checked')
    expect(box.find('svg').exists()).toBe(true)
  })

  it('honore un slot d’indicateur personnalisé', () => {
    const wrapper = mount(Checkbox, {
      props: { modelValue: true },
      slots: { default: '<span data-testid="custom-check" />' }
    })

    expect(wrapper.find('[data-testid="custom-check"]').exists()).toBe(true)
  })

  it('fusionne les classes additionnelles via cn', () => {
    const wrapper = mount(Checkbox, { props: { class: 'mt-sm' } })
    const box = wrapper.find('[role="checkbox"]')

    expect(box.classes()).toContain('mt-sm')
    expect(box.classes()).toContain('rounded')
  })
})
