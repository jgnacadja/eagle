import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Label, labelVariants } from '~/components/ui/label'

describe('ui/Label', () => {
  it('rend un label associé à son champ via for', () => {
    const wrapper = mount(Label, {
      props: { for: 'email' },
      slots: { default: 'Adresse e-mail' }
    })

    expect(wrapper.element.tagName).toBe('LABEL')
    expect(wrapper.attributes('for')).toBe('email')
    expect(wrapper.text()).toBe('Adresse e-mail')
    expect(wrapper.classes()).toContain('text-ink')
  })

  it.each([
    ['body', 'text-ink-body'],
    ['muted', 'text-ink-muted']
  ] as const)('applique le variant %s', (variant, expected) => {
    const wrapper = mount(Label, { props: { variant }, slots: { default: 'x' } })

    expect(wrapper.classes()).toContain(expected)
  })

  it('fusionne les classes additionnelles via cn', () => {
    const wrapper = mount(Label, { props: { class: 'uppercase' }, slots: { default: 'x' } })

    expect(wrapper.classes()).toContain('uppercase')
  })
})

describe('labelVariants', () => {
  it('retombe sur le variant default', () => {
    expect(labelVariants()).toContain('text-ink')
  })
})
