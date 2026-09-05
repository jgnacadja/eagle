import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CenterFormationCard from '~/components/CenterFormationCard.vue'

const stubs = {
  NuxtLink: { template: '<a><slot /></a>' },
  Card: { template: '<div><slot /></div>' },
  CardHeader: { template: '<div><slot /></div>' },
  CardTitle: { template: '<div><slot /></div>' },
  CardContent: { template: '<div><slot /></div>' },
  CardDescription: { template: '<p><slot /></p>' },
  CardFooter: { template: '<div><slot /></div>' },
  Badge: { template: '<span><slot /></span>' },
  Button: { template: '<button><slot /></button>' }
}

const baseProps = {
  family: "Caces · Conduite d'engins",
  title: 'CACES R489 — chariots élévateurs',
  description: 'Conduite en sécurité des chariots de manutention.',
  meta: '2 à 5 jours · Inter / intra · Recyclage : 5 ans',
  status: { type: 'success' as const, label: 'Sessions ce mois-ci' }
}

describe('CenterFormationCard', () => {
  it('renders family, title, meta and status label', () => {
    const wrapper = mount(CenterFormationCard, {
      props: baseProps,
      global: { stubs }
    })

    expect(wrapper.text()).toContain("Caces · Conduite d'engins")
    expect(wrapper.text()).toContain('CACES R489 — chariots élévateurs')
    expect(wrapper.text()).toContain('2 à 5 jours')
    expect(wrapper.text()).toContain('Sessions ce mois-ci')
  })

  it('shows the warning marker for a warning status', () => {
    const wrapper = mount(CenterFormationCard, {
      props: {
        ...baseProps,
        status: { type: 'warning' as const, label: 'Session le 18/09' }
      },
      global: { stubs }
    })

    expect(wrapper.text()).toContain('▲')
    expect(wrapper.text()).toContain('Session le 18/09')
  })
})
