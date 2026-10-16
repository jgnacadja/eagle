import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { layout } from '@learnup/ui'
import Logo from '~/components/Brand/Logo.vue'

describe('Logo', () => {
  it('renders the 15 logo mark paths on the full original canvas, decorative only', () => {
    const wrapper = mount(Logo)
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('viewBox')).toBe('0 0 749 638')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('focusable')).toBe('false')
    expect(svg.findAll('path')).toHaveLength(15)
    expect(svg.find('text').exists()).toBe(false)
  })

  it('renders brand name and tagline as separate HTML spans after the mark', () => {
    const wrapper = mount(Logo)
    const svg = wrapper.find('svg')
    const name = wrapper.find('.logo-name')
    const tagline = wrapper.find('.logo-tagline')
    expect(name.exists()).toBe(true)
    expect(name.text()).toBe('Learn Up Academy')
    expect(tagline.exists()).toBe(true)
    expect(tagline.text()).toBe('Déclencheur de réussite')
    expect(svg.element.nextElementSibling).toBe(name.element)
    expect(name.element.nextElementSibling).toBe(tagline.element)
  })

  it('does not use the old oversized typography or gap utilities', () => {
    const wrapper = mount(Logo)
    expect(wrapper.find('.gap-xs').exists()).toBe(false)
    expect(wrapper.find('.text-small').exists()).toBe(false)
    expect(wrapper.find('.text-overline').exists()).toBe(false)
    expect(wrapper.find('.flex-col').exists()).toBe(false)
  })

  it('binds name and tagline to the layout logo geometry tokens', () => {
    const source = readFileSync(resolve('app/components/Brand/Logo.vue'), 'utf-8')
    expect(source).toContain('top: var(--layout-logo-name-top);')
    expect(source).toContain('transform: translateX(-50%) scaleX(var(--layout-logo-name-scale-x));')
    expect(source).toContain('top: var(--layout-logo-tagline-top);')
    expect(source).toContain(
      'transform: translateX(-50%) scaleX(var(--layout-logo-tagline-scale-x));'
    )
  })

  it('keeps the logo geometry tokens calibrated on the original painted bounds', () => {
    expect(layout.logoNameTop).toBe('76.5%')
    expect(layout.logoTaglineTop).toBe('93.6%')
    expect(layout.logoNameScaleX).toBe('0.937931')
    expect(layout.logoTaglineScaleX).toBe('0.975728')

    const css = readFileSync(resolve('../../packages/ui/src/tokens.css'), 'utf-8')
    expect(css).toContain('--layout-logo-name-top: 76.5%;')
    expect(css).toContain('--layout-logo-tagline-top: 93.6%;')
    expect(css).toContain('--layout-logo-name-scale-x: 0.937931;')
    expect(css).toContain('--layout-logo-tagline-scale-x: 0.975728;')
  })

  it('defaults to the color variant and exposes the white variant class', () => {
    const color = mount(Logo)
    expect(color.find('.logo--white').exists()).toBe(false)

    const white = mount(Logo, { props: { variant: 'white' } })
    expect(white.find('.logo--white').exists()).toBe(true)
  })
})
