import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect } from 'vitest'
import { Button, buttonVariants } from '~/components/ui/button'

const stubs = {
  NuxtLink: { template: '<a><slot /></a>', props: ['to', 'href', 'target'] }
}

describe('Button', () => {
  it('renders a button by default', () => {
    const wrapper = mount(Button, { slots: { default: 'Ok' } })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.text()).toBe('Ok')
  })

  it.each([
    ['default', 'bg-primary'],
    ['accent', 'bg-accent'],
    ['dark', 'bg-primary-dark'],
    ['paper', 'bg-paper'],
    ['outline', 'border-outline'],
    ['outline-inverse', 'border-outline-inverse'],
    ['ghost', 'hover:bg-surface'],
    ['icon-outline', 'border-primary/25'],
    ['link', 'text-primary']
  ] as const)('applies the %s variant classes', (variant, expected) => {
    const wrapper = mount(Button, { props: { variant }, slots: { default: 'x' } })
    expect(wrapper.classes()).toContain(expected)
  })

  it.each([
    ['pill', 'rounded-full'],
    ['pill-sm', 'h-control'],
    ['pill-lg', 'px-xl'],
    ['control', 'h-control'],
    ['icon-sm', 'w-control-sm'],
    ['icon-box', 'rounded-sm'],
    ['chip', 'h-auto'],
    ['inline', 'p-0']
  ] as const)('applies the %s size classes', (size, expected) => {
    const wrapper = mount(Button, { props: { size }, slots: { default: 'x' } })
    expect(wrapper.classes()).toContain(expected)
  })

  it('merges caller classes for layout only', () => {
    const wrapper = mount(Button, {
      props: { variant: 'accent', size: 'pill', class: 'w-full sm:w-auto' },
      slots: { default: 'x' }
    })
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['bg-accent', 'rounded-full', 'w-full', 'sm:w-auto'])
    )
  })

  it('renders as child with as-child', () => {
    const Test = defineComponent({
      components: { Btn: Button },
      template: `<Btn as-child variant="accent" size="pill"><a href="/x">Lien</a></Btn>`
    })
    const wrapper = mount(Test, { global: { stubs } })
    const anchor = wrapper.find('a')
    expect(anchor.exists()).toBe(true)
    expect(anchor.attributes('href')).toBe('/x')
    expect(anchor.classes()).toContain('bg-accent')
  })
})

describe('buttonVariants', () => {
  it('falls back to default variant and size', () => {
    const classes = buttonVariants()
    expect(classes).toContain('bg-primary')
    expect(classes).toContain('h-10')
  })
})
