import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import LegalSummary from '~/components/Legal/Summary.vue'

const sections = [
  { id: 'editeur', title: '1. Éditeur du site', paragraphs: [''] },
  { id: 'hebergement', title: '2. Hébergement', paragraphs: [''] }
]

const defaultRect: DOMRect = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  toJSON: () => {}
}

describe('components/LegalSummary', () => {
  const originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect

  beforeEach(() => {
    Object.defineProperty(window.HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: function (this: HTMLElement) {
        const top = Number(this.dataset.rectTop ?? 0)
        const height = Number(this.dataset.rectHeight ?? this.offsetHeight ?? 0)
        return { ...defaultRect, top, height, bottom: top + height } as DOMRect
      }
    })
  })

  afterEach(() => {
    Object.defineProperty(window.HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: originalGetBoundingClientRect
    })
  })

  it('affiche un lien par section', () => {
    const wrapper = mount(LegalSummary, {
      props: { sections, activeId: 'editeur' }
    })

    const links = wrapper.findAll('a')
    expect(links).toHaveLength(sections.length)
    expect(links[0]!.attributes('href')).toBe('#editeur')
    expect(links[1]!.attributes('href')).toBe('#hebergement')
    expect(wrapper.text()).toContain('1. Éditeur du site')
    expect(wrapper.text()).toContain('2. Hébergement')
  })

  it('met en évidence la section active', () => {
    const wrapper = mount(LegalSummary, {
      props: { sections, activeId: 'editeur' }
    })

    const activeLink = wrapper.find('a[href="#editeur"]')
    expect(activeLink.classes()).toContain('bg-transparent')
    expect(activeLink.classes()).toContain('text-primary')

    const inactiveLink = wrapper.find('a[href="#hebergement"]')
    expect(inactiveLink.classes()).toContain('text-ink-muted')
    expect(inactiveLink.classes()).not.toContain('bg-surface')
  })

  it("déplace l'indicateur actif quand la section change", async () => {
    const wrapper = mount(LegalSummary, {
      props: { sections, activeId: 'editeur' }
    })

    const links = wrapper.findAll('a')
    links[0]!.element.dataset.rectTop = '0'
    links[0]!.element.dataset.rectHeight = '32'
    links[1]!.element.dataset.rectTop = '40'
    links[1]!.element.dataset.rectHeight = '32'

    await flushPromises()

    const indicator = wrapper.find('.bg-accent')
    expect(indicator.exists()).toBe(true)
    const indicatorEl = indicator.element as HTMLElement
    expect(indicatorEl.style.height).toBe('32px')
    expect(indicatorEl.style.top).toBe('0px')

    await wrapper.setProps({ activeId: 'hebergement' })
    await flushPromises()

    expect(indicatorEl.style.height).toBe('32px')
    expect(indicatorEl.style.top).toBe('40px')
  })

  it('affiche la ligne de repère grise', () => {
    const wrapper = mount(LegalSummary, {
      props: { sections, activeId: 'editeur' }
    })

    const track = wrapper.find('.bg-rule')
    expect(track.exists()).toBe(true)
  })

  it('fusionne les classes personnalisées', () => {
    const wrapper = mount(LegalSummary, {
      props: { sections, activeId: 'editeur', class: 'my-class' }
    })

    expect(wrapper.classes()).toContain('my-class')
  })
})
