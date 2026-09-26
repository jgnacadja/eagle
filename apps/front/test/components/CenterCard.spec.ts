import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CenterCard from '~/components/Cards/CenterCard.vue'

describe('CenterCard', () => {
  it('renders name, distance, formations and tags without departments', () => {
    const wrapper = mount(CenterCard, {
      props: {
        name: 'Centre de Créteil',
        distance: 'à 6 km',
        formations: 'CACES · SST',
        tags: ['Sessions cette semaine', 'Intra sur site']
      },
      global: {
        stubs: {
          Badge: { template: '<span><slot /></span>' }
        }
      }
    })

    expect(wrapper.text()).toContain('Centre de Créteil')
    expect(wrapper.text()).toContain('à 6 km')
    expect(wrapper.text()).toContain('CACES · SST')
    expect(wrapper.text()).toContain('Sessions cette semaine')
    expect(wrapper.text()).not.toContain('Départements')
  })

  it('lie le nom du centre quand titleTo est fourni', () => {
    const wrapper = mount(CenterCard, {
      props: {
        name: 'Centre de Créteil',
        distance: 'à 6 km',
        formations: 'CACES · SST',
        titleTo: '/centres/creteil'
      },
      global: {
        stubs: {
          NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          Badge: { template: '<span><slot /></span>' }
        }
      }
    })

    expect(wrapper.find('a[href="/centres/creteil"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Centre de Créteil')
  })

  it('affiche le badge statut succès avec le libellé court', () => {
    const wrapper = mount(CenterCard, {
      props: {
        name: 'Centre de Créteil',
        distance: 'à 6 km',
        formations: 'CACES · SST',
        status: { type: 'success', label: 'Sessions cette semaine', labelShort: 'Cette semaine' },
        to: '/centres/creteil'
      },
      global: {
        stubs: {
          NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          Badge: { template: '<span><slot /></span>' }
        }
      }
    })

    expect(wrapper.text()).toContain('Sessions cette semaine')
    expect(wrapper.text()).toContain('Cette semaine')
    expect(wrapper.find('a[href="/centres/creteil"]').text()).toContain('Voir le centre')
  })

  it('affiche le badge statut warning', () => {
    const wrapper = mount(CenterCard, {
      props: {
        name: 'Centre de Créteil',
        distance: 'à 6 km',
        formations: 'CACES · SST',
        status: { type: 'warning', label: 'Prochaine session le 14/09' }
      },
      global: {
        stubs: { Badge: { template: '<span><slot /></span>' } }
      }
    })

    expect(wrapper.text()).toContain('Prochaine session le 14/09')
    expect(wrapper.text()).toContain('▲')
    expect(wrapper.text()).not.toContain('Voir le centre')
  })

  it('n’affiche aucun marqueur pour un statut ni succès ni warning', () => {
    const wrapper = mount(CenterCard, {
      props: {
        name: 'Centre de Créteil',
        distance: 'à 6 km',
        formations: 'CACES · SST',
        status: { type: 'neutral', label: 'Complet' }
      },
      global: {
        stubs: { Badge: { template: '<span><slot /></span>' } }
      }
    })

    expect(wrapper.text()).toContain('Complet')
    expect(wrapper.text()).not.toContain('▲')
  })

  it('affiche le titre non lié quand titleTo est nul', () => {
    const wrapper = mount(CenterCard, {
      props: {
        name: 'Centre de Créteil',
        distance: 'à 6 km',
        formations: 'CACES · SST',
        titleTo: null
      },
      global: {
        stubs: {
          NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          Badge: { template: '<span><slot /></span>' }
        }
      }
    })

    expect(wrapper.find('h3').text()).toBe('Centre de Créteil')
  })

  it('colore les tags préfixés ▲ en warning', () => {
    const wrapper = mount(CenterCard, {
      props: {
        name: 'Centre de Créteil',
        distance: 'à 6 km',
        formations: 'CACES · SST',
        tags: ['▲ Dernières places']
      },
      global: {
        stubs: {
          Badge: { props: ['variant'], template: '<span :data-variant="variant"><slot /></span>' }
        }
      }
    })

    expect(wrapper.find('[data-variant="warning"]').exists()).toBe(true)
  })
})
