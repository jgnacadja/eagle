import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CenterResultCard from '~/components/Cards/CenterResultCard.vue'

const center = {
  id: 'creteil',
  name: 'Centre de Créteil',
  cp: '94000',
  address: '14 rue des Refuzniks, Créteil · Val-de-Marne',
  tags: 'CACES · Habilitations électriques · SST · Hauteur',
  tagsShort: 'CACES · Habilitations · SST',
  status: { type: 'success' as const, label: 'Sessions cette semaine' },
  pos: { top: '30%', left: '73%' }
}

describe('CenterResultCard', () => {
  it('renders name, cp, address, tags and status', () => {
    const wrapper = mount(CenterResultCard, {
      props: { center },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.text()).toContain('Centre de Créteil')
    expect(wrapper.text()).toContain('94000')
    expect(wrapper.text()).toContain('14 rue des Refuzniks, Créteil · Val-de-Marne')
    expect(wrapper.text()).toContain('CACES · Habilitations électriques · SST · Hauteur')
    expect(wrapper.text()).toContain('Sessions cette semaine')
    expect(wrapper.text()).toContain('Voir le centre')
  })

  it('emits select when the card is clicked', async () => {
    const wrapper = mount(CenterResultCard, {
      props: { center },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })

    await wrapper.find('article').trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('applies active border and surface background when active', () => {
    const wrapper = mount(CenterResultCard, {
      props: { center, active: true },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.find('article').classes()).toContain('border-2')
    expect(wrapper.find('article').classes()).toContain('border-primary')
    expect(wrapper.find('article').classes()).toContain('bg-surface')
    expect(wrapper.find('article').classes()).toContain('shadow-md')
  })
})
