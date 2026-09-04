import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CenterMap from '~/components/CenterMap.vue'

const centers = [
  {
    id: 'creteil',
    name: 'Centre de Créteil',
    cp: '94000',
    address: '14 rue des Refuzniks, Créteil · Val-de-Marne',
    tags: 'CACES · SST',
    tagsShort: 'CACES · SST',
    status: { type: 'success' as const, label: 'Sessions cette semaine' },
    pos: { top: '30%', left: '73%' }
  },
  {
    id: 'vitry',
    name: 'Centre de Vitry-sur-Seine',
    cp: '94400',
    address: '22 quai Jules Guesde, Vitry · Val-de-Marne',
    tags: 'CACES · AIPR',
    tagsShort: 'CACES · AIPR',
    status: { type: 'warning' as const, label: 'Prochaine session le 14/09' },
    pos: { top: '52%', left: '55%' }
  }
]

describe('CenterMap', () => {
  it('renders the caption and all pins', () => {
    const wrapper = mount(CenterMap, {
      props: { centers, activeId: null, caption: 'département 94 cadré' },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.text()).toContain('Carte Leaflet · OpenStreetMap — département 94 cadré')
    expect(wrapper.findAll('.pin')).toHaveLength(2)
  })

  it('emits select when a pin is clicked', async () => {
    const wrapper = mount(CenterMap, {
      props: { centers, activeId: null, caption: 'département 94 cadré' },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })

    await wrapper.findAll('.pin')[0].trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
    expect(wrapper.emitted('select')![0]).toEqual(['creteil'])
  })

  it('shows the popup for the active center', () => {
    const wrapper = mount(CenterMap, {
      props: { centers, activeId: 'creteil', caption: 'département 94 cadré' },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.text()).toContain('Centre de Créteil')
    expect(wrapper.text()).toContain('Val-de-Marne')
    expect(wrapper.text()).toContain('CACES · SST')
  })

  it('shows the empty message when no centers', () => {
    const wrapper = mount(CenterMap, {
      props: { centers: [], activeId: null, caption: 'département 48 cadré' },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.text()).toContain('Aucun centre à afficher sur la carte')
  })
})
