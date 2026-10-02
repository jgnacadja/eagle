import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'

function mountGroup(props: Record<string, unknown> = {}) {
  return mount(RadioGroup, {
    props,
    slots: {
      default: () => [
        h(RadioGroupItem, { value: 'a', id: 'radio-a' }),
        h(RadioGroupItem, { value: 'b', id: 'radio-b' })
      ]
    }
  })
}

describe('ui/RadioGroup', () => {
  it('rend un groupe role="radiogroup" avec des items role="radio"', () => {
    const wrapper = mountGroup()

    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true)
    const radios = wrapper.findAll('[role="radio"]')
    expect(radios).toHaveLength(2)
    expect(radios.every((r) => r.attributes('aria-checked') === 'false')).toBe(true)
  })

  it('émet update:modelValue et coche l’item au clic', async () => {
    const wrapper = mountGroup()
    const radio = wrapper.find('#radio-b')

    await radio.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
    expect(radio.attributes('aria-checked')).toBe('true')
    expect(radio.attributes('data-state')).toBe('checked')
  })

  it('honore modelValue : l’item correspondant est coché', () => {
    const wrapper = mountGroup({ modelValue: 'a' })
    const radio = wrapper.find('#radio-a')

    expect(radio.attributes('aria-checked')).toBe('true')
    expect(radio.find('[data-state="checked"] span').exists()).toBe(true)
  })

  it('fusionne les classes additionnelles via cn', () => {
    const wrapper = mountGroup({ class: 'sm:grid-cols-2' })
    const group = wrapper.find('[role="radiogroup"]')

    expect(group.classes()).toContain('sm:grid-cols-2')
    expect(group.classes()).toContain('grid')
  })

  it('désactive les items quand disabled', async () => {
    const wrapper = mountGroup({ disabled: true })
    const radio = wrapper.find('#radio-a')

    expect(radio.attributes('disabled')).toBeDefined()
    await radio.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
