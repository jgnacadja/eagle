import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import FormationCard from '~/components/Cards/FormationCard.vue'

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  NuxtImg: { props: ['src', 'alt'], template: '<img :src="src" :alt="alt" />' }
}

describe('FormationCard', () => {
  it('renders the title, link and placeholder when no image', () => {
    const wrapper = mount(FormationCard, {
      props: {
        title: "CACES & conduite d'engins",
        imageTop: 'Photo à fournir',
        imageBottom: 'cariste en manœuvre',
        to: '/formations/caces/caces-r489'
      },
      global: { stubs }
    })

    expect(wrapper.text()).toContain("CACES & conduite d'engins")
    expect(wrapper.text()).toContain('Voir le détail →')
    expect(wrapper.find('a').attributes('href')).toBe('/formations/caces/caces-r489')
    expect(wrapper.text()).toContain('cariste en manœuvre')
  })

  it('renders the image when provided instead of the placeholder', () => {
    const wrapper = mount(FormationCard, {
      props: {
        title: 'SST',
        imageTop: 'Photo à fournir',
        imageBottom: 'secours',
        image: 'https://example.test/sst.jpg',
        to: '/formations/sante/sst'
      },
      global: { stubs }
    })

    expect(wrapper.classes()).toContain('motion-surface')
    expect(wrapper.classes()).not.toContain('transition')

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.test/sst.jpg')
    expect(wrapper.text()).not.toContain('Photo à fournir')
  })

  it('hides the link when no destination is provided', () => {
    const wrapper = mount(FormationCard, {
      props: { title: 'SST', imageTop: '', imageBottom: '' },
      global: { stubs }
    })

    expect(wrapper.text()).not.toContain('Voir le détail')
  })

  it('renders body when provided and omits it when absent', () => {
    const withBody = mount(FormationCard, {
      props: {
        title: 'SST',
        imageTop: '',
        imageBottom: '',
        body: 'Formation aux premiers secours'
      },
      global: { stubs }
    })
    expect(withBody.text()).toContain('Formation aux premiers secours')

    const withoutBody = mount(FormationCard, {
      props: { title: 'SST', imageTop: '', imageBottom: '' },
      global: { stubs }
    })
    expect(withoutBody.find('p').exists()).toBe(false)
  })

  it('pushes select_formation_card when clicking link', async () => {
    window.dataLayer = []
    const wrapper = mount(FormationCard, {
      props: {
        title: 'SST',
        imageTop: 'Sécurité',
        imageBottom: 'secours',
        to: '/formations/sante/sst'
      },
      global: { stubs }
    })

    const link = wrapper.find('a')
    await link.trigger('click')

    const event = window.dataLayer?.find((e) => e.event === 'select_formation_card')
    expect(event).toMatchObject({
      event: 'select_formation_card',
      formation_id: 'sst',
      formation_name: 'SST',
      formation_family: 'Sécurité',
      list_name: 'catalogue'
    })
  })
})
