import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SubFamilyCard from '~/components/Cards/SubFamilyCard.vue'

const stubs = {
  Card: { template: '<div><slot /></div>' },
  Button: { template: '<button><slot /></button>' }
}

describe('SubFamilyCard', () => {
  it('renders name, caption and the action label', () => {
    const wrapper = mount(SubFamilyCard, {
      props: { name: 'Chariots & gerbeurs', caption: 'R489 · R485' },
      global: { stubs }
    })

    expect(wrapper.text()).toContain('Chariots & gerbeurs')
    expect(wrapper.text()).toContain('R489 · R485')
    expect(wrapper.text()).toContain('Voir la sous-famille →')
  })

  it('emits select when the action is clicked', async () => {
    const wrapper = mount(SubFamilyCard, {
      props: { name: 'Grues & levage' },
      global: { stubs }
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('supports a custom action label', () => {
    const wrapper = mount(SubFamilyCard, {
      props: { name: 'Nacelles', actionLabel: 'Explorer' },
      global: { stubs }
    })

    expect(wrapper.text()).toContain('Explorer →')
  })
})
