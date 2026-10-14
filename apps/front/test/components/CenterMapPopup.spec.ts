import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import CenterMapPopup from '~/components/Map/CenterMapPopup.vue'

const baseProps = {
  id: 'creteil',
  name: 'Centre de Créteil',
  locationLabel: 'Créteil · Val-de-Marne',
  tagsShort: 'CACES · SST'
}

describe('components/CenterMapPopup', () => {
  it('affiche le nom, la localisation, les tags et le lien vers la fiche', () => {
    const wrapper = mount(CenterMapPopup, { props: baseProps })

    expect(wrapper.text()).toContain('Centre de Créteil')
    expect(wrapper.text()).toContain('Créteil · Val-de-Marne')
    expect(wrapper.text()).toContain('CACES · SST')
    expect(wrapper.find('a').attributes('href')).toBe('/centres/creteil')
  })

  it('émet close et appelle la prop onClose au clic sur Fermer', async () => {
    const onClose = vi.fn()
    const wrapper = mount(CenterMapPopup, { props: { ...baseProps, onClose } })

    await wrapper.find('button[aria-label="Fermer"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(onClose).toHaveBeenCalled()
  })

  it('se positionne en absolu avec la prop pos', () => {
    const wrapper = mount(CenterMapPopup, {
      props: { ...baseProps, pos: { top: '10px', left: '50%' } }
    })
    const el = wrapper.element as HTMLElement

    expect(wrapper.classes()).toContain('absolute')
    expect(wrapper.classes()).toContain('-translate-x-1/2')
    expect(el.style.top).toBe('10px')
    expect(el.style.left).toBe('50%')
  })

  it('reste en flux relatif sans pos', () => {
    const wrapper = mount(CenterMapPopup, { props: baseProps })
    const el = wrapper.element as HTMLElement

    expect(wrapper.classes()).toContain('relative')
    expect(el.style.top).toBe('')
  })
})
