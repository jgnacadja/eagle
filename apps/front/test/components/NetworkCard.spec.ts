import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import NetworkCard from '~/components/NetworkCard.vue'

describe('NetworkCard', () => {
  it('renders the title, subtitle, body and cta link', () => {
    const wrapper = mount(NetworkCard, {
      props: {
        title: 'Devenir franchisé',
        subtitle: 'Rejoignez un réseau en pleine croissance',
        body: 'Ouvrez votre centre.',
        cta: 'Découvrir la franchise →'
      },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.text()).toContain('Devenir franchisé')
    expect(wrapper.text()).toContain('Rejoignez un réseau en pleine croissance')
    expect(wrapper.text()).toContain('Ouvrez votre centre.')
    expect(wrapper.text()).toContain('Découvrir la franchise →')
  })

  it('applies uppercase style to the title', () => {
    const wrapper = mount(NetworkCard, {
      props: {
        title: 'Devenir franchisé',
        subtitle: '',
        body: '',
        cta: ''
      },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.find('h3').classes()).toContain('uppercase')
  })
})
