import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SessionCard from '~/components/SessionCard.vue'

const stubs = {
  Card: { template: '<div><slot /></div>' },
  CardContent: { template: '<div><slot /></div>' },
  Badge: { template: '<span><slot /></span>' },
  Button: { template: '<button><slot /></button>' },
  NuxtLink: { template: '<a><slot /></a>' }
}

const baseProps = {
  day: '12',
  month: 'Sept',
  title: 'CACES R489 — cat. 3 · initial',
  meta: '3 jours · en centre · Créteil'
}

describe('SessionCard', () => {
  it('renders date, title, meta and the places badge', () => {
    const wrapper = mount(SessionCard, {
      props: { ...baseProps, places: 5, type: 'success' as const },
      global: { stubs }
    })

    expect(wrapper.text()).toContain('12')
    expect(wrapper.text()).toContain('Sept')
    expect(wrapper.text()).toContain('CACES R489')
    expect(wrapper.text()).toContain('5 places disponibles')
    expect(wrapper.text()).toContain('Voir la session')
  })

  it('renders the price above the badge and the warning marker', () => {
    const wrapper = mount(SessionCard, {
      props: {
        ...baseProps,
        places: 2,
        type: 'warning' as const,
        price: '490 €',
        priceNote: 'HT / participant'
      },
      global: { stubs }
    })

    expect(wrapper.text()).toContain('490 €')
    expect(wrapper.text()).toContain('HT / participant')
    expect(wrapper.text()).toContain('▲')
    expect(wrapper.text()).toContain('2 places')
  })

  it('omits the status block when neither price nor places are given', () => {
    const wrapper = mount(SessionCard, { props: baseProps, global: { stubs } })

    expect(wrapper.text()).not.toContain('place')
  })
})
