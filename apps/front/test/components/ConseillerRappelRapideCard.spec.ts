import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ConseillerRappelRapideCard from '~/components/Conseiller/RappelRapideCard.vue'

const stubs = {
  Button: {
    props: ['disabled', 'type', 'variant'],
    template: '<button :type="type || \'button\'" :disabled="disabled"><slot /></button>'
  },
  Card: {
    props: ['variant'],
    template: '<div class="card" :data-variant="variant"><slot /></div>'
  },
  Input: {
    props: ['modelValue', 'id', 'placeholder', 'type'],
    emits: ['update:modelValue'],
    template:
      '<input :id="id" :type="type" :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  Label: {
    template: '<label><slot /></label>'
  },
  Select: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="select" :data-value="modelValue"><slot /></div>'
  },
  SelectTrigger: { template: '<button type="button" class="select-trigger"><slot /></button>' },
  SelectValue: { props: ['placeholder'], template: '<span>{{ placeholder }}</span>' },
  SelectContent: { template: '<div class="select-content"><slot /></div>' },
  SelectItem: {
    props: ['value'],
    template: '<div class="select-item" :data-value="value"><slot /></div>'
  },
  IconCheck: true,
  IconClock: true,
  IconPhone: true
}

describe('ConseillerRappelRapideCard', () => {
  it('affiche l’état initial compact avec titre, texte indicatif et CTA', () => {
    const wrapper = mount(ConseillerRappelRapideCard, { global: { stubs } })

    expect(wrapper.text()).toContain("Besoin d'un échange téléphonique direct")
    expect(wrapper.text()).toContain("Saisissez votre numéro pour qu'un conseiller vous rappelle")
    expect(wrapper.text()).toContain('Me faire appeler')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('applique le variant dark par défaut et le variant light si spécifié', () => {
    const darkWrapper = mount(ConseillerRappelRapideCard, { global: { stubs } })
    expect(darkWrapper.find('.card').attributes('data-variant')).toBe('dark')

    const lightWrapper = mount(ConseillerRappelRapideCard, {
      props: { variant: 'light' },
      global: { stubs }
    })
    expect(lightWrapper.find('.card').attributes('data-variant')).toBe('surface')
  })

  it('déplie le formulaire au clic sur « Me faire appeler »', async () => {
    const wrapper = mount(ConseillerRappelRapideCard, { global: { stubs } })

    const ctaButton = wrapper.findAll('button').find((b) => b.text().includes('Me faire appeler'))
    expect(ctaButton).toBeDefined()
    await ctaButton!.trigger('click')
    await flushPromises()

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('input#rappel-telephone').exists()).toBe(true)
    expect(wrapper.text()).toContain('Votre numéro de téléphone')
    expect(wrapper.text()).toContain('Heure / Créneau souhaité')
    expect(wrapper.text()).toContain('Valider le rappel')
    expect(wrapper.text()).toContain('Annuler')
  })

  it('masque le formulaire et émet « cancel » au clic sur « Annuler »', async () => {
    const wrapper = mount(ConseillerRappelRapideCard, {
      props: { initialOpen: true },
      global: { stubs }
    })

    expect(wrapper.find('form').exists()).toBe(true)

    const cancelButton = wrapper.findAll('button').find((b) => b.text() === 'Annuler')
    expect(cancelButton).toBeDefined()
    await cancelButton!.trigger('click')
    await flushPromises()

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.text()).toContain('Me faire appeler')
  })

  it('affiche une erreur quand le numéro est vide à la soumission', async () => {
    const wrapper = mount(ConseillerRappelRapideCard, {
      props: { initialOpen: true },
      global: { stubs }
    })

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Indiquez votre numéro de téléphone')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('affiche une erreur quand le numéro a moins de 10 chiffres', async () => {
    const wrapper = mount(ConseillerRappelRapideCard, {
      props: { initialOpen: true },
      global: { stubs }
    })

    await wrapper.find('input#rappel-telephone').setValue('06 12 34')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Numéro incomplet — 10 chiffres attendus')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('valide et émet l’événement « submit » avec succès puis affiche l’état confirmé', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mount(ConseillerRappelRapideCard, {
        props: { initialOpen: true },
        global: { stubs }
      })

      await wrapper.find('input#rappel-telephone').setValue('06 12 34 56 78')
      await wrapper.find('form').trigger('submit')

      // Avance le timer de feedback
      await vi.advanceTimersByTimeAsync(350)
      await flushPromises()

      expect(wrapper.emitted('submit')).toHaveLength(1)
      expect(wrapper.emitted('submit')![0]).toEqual([
        {
          telephone: '06 12 34 56 78',
          creneau: 'Dès que possible'
        }
      ])

      expect(wrapper.text()).toContain('Demande de rappel enregistrée')
      expect(wrapper.text()).toContain('06 12 34 56 78')
      expect(wrapper.text()).toContain('Faire une autre demande')

      // Clic sur « Faire une autre demande »
      const resetButton = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Faire une autre demande'))
      expect(resetButton).toBeDefined()
      await resetButton!.trigger('click')
      await flushPromises()

      expect(wrapper.find('form').exists()).toBe(false)
      expect(wrapper.text()).toContain('Me faire appeler')
    } finally {
      vi.useRealTimers()
    }
  })
})
