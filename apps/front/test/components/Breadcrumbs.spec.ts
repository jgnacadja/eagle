import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Breadcrumbs } from '~/components/ui/breadcrumb'

const items = [
  { label: 'Accueil', to: '/' },
  { label: 'Centres', to: '/centres' },
  { label: 'Centre de Créteil' }
]

describe('ui/Breadcrumbs', () => {
  it('rend un lien pour chaque item sauf le dernier', () => {
    const wrapper = mount(Breadcrumbs, { props: { items } })
    const [home, centres] = wrapper.findAll('a')

    expect(wrapper.findAll('a')).toHaveLength(2)
    expect(home?.attributes('href')).toBe('/')
    expect(home?.text()).toContain('Accueil')
    expect(centres?.attributes('href')).toBe('/centres')
    expect(centres?.text()).toContain('Centres')
  })

  it('rend le dernier item comme page courante, sans lien', () => {
    const wrapper = mount(Breadcrumbs, { props: { items } })
    const current = wrapper.find('[aria-current="page"]')

    expect(current.exists()).toBe(true)
    expect(current.text()).toContain('Centre de Créteil')
    expect(wrapper.findAll('a')).toHaveLength(2)
  })

  it('rend un séparateur entre chaque item (n - 1)', () => {
    const wrapper = mount(Breadcrumbs, { props: { items } })

    expect(wrapper.findAll('li[data-slot="breadcrumb-item"]')).toHaveLength(3)
    expect(wrapper.findAll('li[data-slot="breadcrumb-separator"]')).toHaveLength(2)
  })

  it('rend un seul item sans lien ni séparateur', () => {
    const wrapper = mount(Breadcrumbs, { props: { items: [{ label: 'Accueil' }] } })

    expect(wrapper.findAll('a')).toHaveLength(0)
    expect(wrapper.text()).toContain('Accueil')
  })
})
