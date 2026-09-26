import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ArticleCard from '~/components/Cards/ArticleCard.vue'

describe('ArticleCard', () => {
  it('renders category, title and date', () => {
    const wrapper = mount(ArticleCard, {
      props: {
        category: 'Réglementation',
        title: 'Recyclage CACES : les échéances 2026',
        date: '28 août 2026 · 4 min',
        excerpt: 'Calendrier de recyclage et points de vigilance.'
      },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          NuxtImg: { template: '<img />' }
        }
      }
    })

    expect(wrapper.classes()).toContain('transition-[border-color,box-shadow]')
    expect(wrapper.classes()).not.toContain('transition')

    expect(wrapper.text()).toContain('Réglementation')
    expect(wrapper.text()).toContain('Recyclage CACES : les échéances 2026')
    expect(wrapper.text()).toContain('28 août 2026 · 4 min')
  })

  it('renders variant="card" with mobile row layout and desktop column classes', () => {
    const wrapper = mount(ArticleCard, {
      props: {
        variant: 'card',
        category: 'Conseil',
        title: 'Quelle AIPR choisir pour vos salariés ?',
        date: '8 sept. 2026 · 4 min',
        to: '/actualites/quelle-aipr-choisir'
      },
      global: {
        stubs: {
          NuxtLink: { template: '<a :href="$attrs.to"><slot /></a>' },
          NuxtImg: { template: '<img />' }
        }
      }
    })

    expect(wrapper.classes()).toContain('flex-row')
    expect(wrapper.classes()).toContain('md:flex-col')
    expect(wrapper.classes()).toContain('rounded-2xl')
    expect(wrapper.text()).toContain('Conseil')
    expect(wrapper.text()).toContain('Quelle AIPR choisir pour vos salariés ?')
    expect(wrapper.text()).toContain('8 sept. 2026 · 4 min')
    expect(wrapper.text()).toContain('Visuel')
    expect(wrapper.find('a').attributes('href')).toBe('/actualites/quelle-aipr-choisir')
  })

  it('renders NuxtImg when imageUrl is provided in variant="card"', () => {
    const wrapper = mount(ArticleCard, {
      props: {
        variant: 'card',
        category: 'Conseil',
        title: 'Quel CACES® pour quel équipement ?',
        date: '1 sept. 2026 · 5 min',
        imageUrl: 'https://example.com/cover.jpg'
      },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          NuxtImg: { template: '<img :src="$attrs.src" :alt="$attrs.alt" />' }
        }
      }
    })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/cover.jpg')
    expect(img.attributes('alt')).toBe('Quel CACES® pour quel équipement ?')
    expect(wrapper.text()).not.toContain('Visuel')
  })

  it('renders NuxtImg when imageUrl is provided in the default variant', () => {
    const wrapper = mount(ArticleCard, {
      props: {
        category: 'Conseil',
        title: 'Quel CACES® pour quel équipement ?',
        date: '1 sept. 2026 · 5 min',
        imageUrl: 'https://example.com/cover.jpg'
      },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          NuxtImg: { template: '<img :src="$attrs.src" :alt="$attrs.alt" />' }
        }
      }
    })

    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Visuel article à fournir')
  })
})
