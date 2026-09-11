import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CtaBanner from '~/components/Cta/CtaBanner.vue'

describe('CtaBanner', () => {
  it('renders title, text and slot actions with a linked heading', () => {
    const wrapper = mount(CtaBanner, {
      props: { title: 'Un besoin ?', text: 'On vous rappelle.', titleId: 'cta-test' },
      slots: { default: '<button>Action</button>' }
    })

    const heading = wrapper.find('h2')
    expect(heading.text()).toBe('Un besoin ?')
    expect(heading.attributes('id')).toBe('cta-test')
    expect(wrapper.attributes('aria-labelledby')).toBe('cta-test')
    expect(wrapper.text()).toContain('On vous rappelle.')
    expect(wrapper.text()).toContain('Action')
  })
})
