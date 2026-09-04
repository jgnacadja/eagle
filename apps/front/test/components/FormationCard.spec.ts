import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormationCard from '~/components/FormationCard.vue'

describe('FormationCard', () => {
  it('renders the title and image props correctly', () => {
    const title = 'Développement Web Fullstack'
    const image = 'Image de présentation'

    const wrapper = mount(FormationCard, {
      props: {
        title,
        image
      },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.text()).toContain(title)
    expect(wrapper.text()).toContain(image)
    expect(wrapper.find('h3').text()).toBe(title)
  })

  it('renders the "Voir le détail" link', () => {
    const wrapper = mount(FormationCard, {
      props: {
        title: 'Design UX/UI',
        image: 'UX Image'
      },
      global: {
        stubs: {
          NuxtLink: { template: '<a :href="$attrs.to"><slot /></a>' }
        }
      }
    })

    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Voir le détail')
  })
})
