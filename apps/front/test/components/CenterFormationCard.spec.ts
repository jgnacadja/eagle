import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CenterFormationCard from '~/components/Cards/CenterFormationCard.vue'

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
  subFamily: 'Chariots élévateurs',
  title: 'CACES R489 — chariots élévateurs',
  description: 'Conduite en sécurité des chariots de manutention.',
  meta: '2 à 5 jours · Inter / intra · Recyclage : 5 ans',
  status: { type: 'success' as const, label: 'Sessions ce mois-ci' }
}

describe('CenterFormationCard', () => {
  it('renders sub-family, title, meta and status label', () => {
    const wrapper = mount(CenterFormationCard, {
      props: baseProps,
      global: { stubs }
    })

    expect(wrapper.text()).toContain('Chariots élévateurs')
    expect(wrapper.text()).toContain('CACES R489 — chariots élévateurs')
    expect(wrapper.text()).toContain('2 à 5 jours')
    expect(wrapper.text()).toContain('Sessions ce mois-ci')
  })

  it('shows the family in the overline for the similar variant', () => {
    const wrapper = mount(CenterFormationCard, {
      props: {
        subFamily: 'Chariots élévateurs',
        family: "CACES & conduite d'engins",
        variant: 'similar' as const,
        title: 'CACES R485 — gerbeurs',
        meta: '1 à 2 jours · Inter / intra',
        to: '/formations/caces-conduite-engins/caces-r485'
      },
      global: { stubs }
    })

    expect(wrapper.text()).toContain("CACES & conduite d'engins")
    expect(wrapper.text()).not.toContain('Chariots élévateurs')
    expect(wrapper.text()).toContain('Consulter')
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

  it('renders the « Voir la formation » button for the button variant', () => {
    const wrapper = mount(CenterFormationCard, {
      props: { ...baseProps, to: '/formations/f/caces', variant: 'button' as const },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('Voir la formation')
  })

  it('falls back to the full label when labelShort is absent', () => {
    const wrapper = mount(CenterFormationCard, {
      props: {
        ...baseProps,
        status: { type: 'neutral' as const, label: 'Sur demande', labelShort: 'Demande' }
      },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('Demande')
    expect(wrapper.text()).toContain('Sur demande')
  })

  it('renders eyebrow and family overline in the similar variant', () => {
    const wrapper = mount(CenterFormationCard, {
      props: { ...baseProps, eyebrow: 'Nouveau', variant: 'similar', family: 'Engins de chantier' },
      global: { stubs }
    })

    expect(wrapper.text()).toContain('Nouveau')
    expect(wrapper.text()).toContain('Engins de chantier')
  })

  it('masque l’overline sans sous-famille ni famille', () => {
    const wrapper = mount(CenterFormationCard, {
      props: { ...baseProps, subFamily: '' },
      global: { stubs }
    })

    expect(wrapper.find('.text-accent-text').exists()).toBe(false)
  })

  it('renders the « Consulter » link for the default variant', () => {
    const wrapper = mount(CenterFormationCard, {
      props: {
        ...baseProps,
        to: '/formations/caces-conduite-engins/caces-r489'
      },
      global: { stubs }
    })

    expect(wrapper.text()).toContain('Consulter')
    expect(wrapper.text()).not.toContain('Voir la formation')
  })
})
