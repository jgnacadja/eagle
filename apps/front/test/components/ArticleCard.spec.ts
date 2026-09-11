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
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.text()).toContain('Réglementation')
    expect(wrapper.text()).toContain('Recyclage CACES : les échéances 2026')
    expect(wrapper.text()).toContain('28 août 2026 · 4 min')
  })
})
