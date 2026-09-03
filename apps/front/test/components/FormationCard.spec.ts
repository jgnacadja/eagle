import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import FormationCard from '~/components/FormationCard.vue'

describe('FormationCard', () => {
  it('renders the title and link', () => {
    const wrapper = mount(FormationCard, {
      props: {
        title: "CACES & conduite d'engins",
        imageTop: 'Photo à fournir',
        imageBottom: 'cariste en manœuvre'
      },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.text()).toContain("CACES & conduite d'engins")
    expect(wrapper.text()).toContain('Voir le détail →')
    expect(wrapper.text()).toContain('cariste en manœuvre')
  })
})
