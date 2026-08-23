import { mount } from '@vue/test-utils'
import AppBrand from '~/components/AppBrand.vue'

describe('AppBrand', () => {
  it('renders the TaskFlow brand name', () => {
    const wrapper = mount(AppBrand)
    expect(wrapper.text()).toContain('TaskFlow')
  })
})
