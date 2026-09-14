import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import StatItem from '~/components/Stats/StatItem.vue'

describe('StatItem', () => {
  it('renders value, unit, and label correctly', () => {
    const wrapper = mount(StatItem, {
      props: {
        value: '+250',
        unit: ' %',
        label: 'formations référencées'
      }
    })

    expect(wrapper.text()).toContain('+250')
    expect(wrapper.text()).toContain('%')
    expect(wrapper.text()).toContain('formations référencées')
  })
})
