import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CenterCard from '~/components/CenterCard.vue'

describe('CenterCard', () => {
  it('renders name, distance, formations and tags without departments', () => {
    const wrapper = mount(CenterCard, {
      props: {
        name: 'Centre de Créteil',
        distance: 'à 6 km',
        formations: 'CACES · SST',
        tags: ['Sessions cette semaine', 'Intra sur site']
      },
      global: {
        stubs: {
          Badge: { template: '<span><slot /></span>' }
        }
      }
    })

    expect(wrapper.text()).toContain('Centre de Créteil')
    expect(wrapper.text()).toContain('à 6 km')
    expect(wrapper.text()).toContain('CACES · SST')
    expect(wrapper.text()).toContain('Sessions cette semaine')
    expect(wrapper.text()).not.toContain('Départements')
  })
})
