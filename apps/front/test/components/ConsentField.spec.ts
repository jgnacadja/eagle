import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ConsentField from '~/components/ConsentField.vue'

const stubs = {
  Checkbox: {
    props: ['modelValue', 'id', 'ariaInvalid', 'ariaDescribedby'],
    emits: ['update:modelValue'],
    template:
      '<button type="button" role="checkbox" :aria-checked="String(!!modelValue)" @click="$emit(\'update:modelValue\', !modelValue)" />'
  },
  Label: { props: ['for', 'variant'], template: '<label><slot /></label>' }
}

const mountField = (props: Record<string, unknown> = {}) =>
  mount(ConsentField, {
    props: { modelValue: false, ...props },
    slots: { default: "J'accepte le traitement." },
    global: { stubs }
  })

describe('components/ConsentField', () => {
  it('affiche le libellé passé en slot', () => {
    const wrapper = mountField()
    expect(wrapper.text()).toContain("J'accepte le traitement.")
    expect(wrapper.find('p').exists()).toBe(false)
  })

  it('bascule le v-model au clic sur le checkbox', async () => {
    const wrapper = mountField()
    await wrapper.find('[role="checkbox"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('expose l’erreur via aria-invalid et aria-describedby', () => {
    const wrapper = mountField({ invalid: true, error: 'Consentement requis.' })
    const checkbox = wrapper.findComponent(stubs.Checkbox)
    expect(checkbox.props('ariaInvalid')).toBe(true)
    expect(checkbox.props('ariaDescribedby')).toBe('consentement-error')
    const error = wrapper.find('#consentement-error')
    expect(error.exists()).toBe(true)
    expect(error.text()).toBe('Consentement requis.')
  })

  it('préfixe les identifiants aria avec l’id fourni', () => {
    const wrapper = mountField({ id: 'candidature-consentement', invalid: true })
    const checkbox = wrapper.findComponent(stubs.Checkbox)
    expect(checkbox.props('ariaDescribedby')).toBe('candidature-consentement-error')
    expect(wrapper.find('#candidature-consentement-error').exists()).toBe(true)
  })

  it('laisse les attributs aria à undefined sans erreur', () => {
    const checkbox = mountField().findComponent(stubs.Checkbox)
    expect(checkbox.props('ariaInvalid')).toBeUndefined()
    expect(checkbox.props('ariaDescribedby')).toBeUndefined()
  })
})
