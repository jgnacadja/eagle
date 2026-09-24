import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ClientLogoWall from '~/components/Brand/ClientLogoWall.vue'
import { companyLogos } from '~/data/companies'

describe('ClientLogoWall', () => {
  it('affiche les logos partagés par défaut', () => {
    const wrapper = mount(ClientLogoWall)

    const imgs = wrapper.findAll('img')
    expect(imgs).toHaveLength(companyLogos.length)
    expect(wrapper.find('img[alt="Logo Capgemini"]').exists()).toBe(true)
    expect(wrapper.find('img[alt="Logo Oracle"]').exists()).toBe(true)
    expect(imgs[0]!.attributes('loading')).toBe('lazy')
  })

  it('accepte une liste de logos personnalisée', () => {
    const wrapper = mount(ClientLogoWall, {
      props: { logos: [{ name: 'Acme', logoUrl: 'https://example.com/acme.svg' }] }
    })

    const imgs = wrapper.findAll('img')
    expect(imgs).toHaveLength(1)
    expect(imgs[0]!.attributes('src')).toBe('https://example.com/acme.svg')
    expect(imgs[0]!.attributes('alt')).toBe('Logo Acme')
  })

  it('variante scroll : défilement horizontal sur mobile', () => {
    const wrapper = mount(ClientLogoWall, { props: { variant: 'scroll' } })

    const container = wrapper.find('div')
    expect(container.classes()).toContain('snap-x')
    expect(container.classes()).toContain('overflow-x-auto')
  })

  it('variante grid : grille 3 colonnes sur mobile', () => {
    const wrapper = mount(ClientLogoWall, { props: { variant: 'grid' } })

    const container = wrapper.find('div')
    expect(container.classes()).toContain('grid')
    expect(container.classes()).toContain('grid-cols-3')
  })
})
