import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CentreCard from '~/components/CentreCard.vue'

describe('CentreCard', () => {
  it('renders name, distance, formations and tags without departments', () => {
    const wrapper = mount(CentreCard, {
      props: {
        name: 'Centre de Créteil',
        distance: 'à 6 km',
        formations: 'CACES · SST',
        tags: ['Sessions cette semaine', 'Intra sur site']
      }
    })

    expect(wrapper.text()).toContain('Centre de Créteil')
    expect(wrapper.text()).toContain('à 6 km')
    expect(wrapper.text()).toContain('CACES · SST')
    expect(wrapper.text()).toContain('Sessions cette semaine')
    expect(wrapper.text()).not.toContain('Départements')
  })
})
