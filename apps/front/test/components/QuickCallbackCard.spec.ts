import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import QuickCallbackCard from '~/components/Cards/QuickCallbackCard.vue'

const leadSubmitMock = vi.fn().mockResolvedValue(true)
const leadState = {
  sending: ref(false),
  error: ref<string | null>(null),
  validationErrors: ref<string[]>([])
}

vi.stubGlobal('useLeadSubmit', () => ({
  submit: leadSubmitMock,
  sending: leadState.sending,
  error: leadState.error,
  validationErrors: leadState.validationErrors,
  reset: vi.fn(() => {
    leadState.error.value = null
    leadState.validationErrors.value = []
  })
}))

const stubs = {
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>'
  },
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
  ConsentField: {
    props: ['modelValue', 'invalid', 'error', 'id'],
    emits: ['update:modelValue'],
    template:
      '<div class="consent-field"><input type="checkbox" :id="id" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" /><label :for="id"><slot /></label><p v-if="invalid" class="consent-error" role="alert">{{ error }}</p></div>'
  },
  Select: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<div class="select" :data-value="modelValue"><button type="button" class="select-change-creneau" @click="$emit(\'update:modelValue\', \'Cet après-midi\')">Changer</button><button type="button" class="select-change-matin" @click="$emit(\'update:modelValue\', \'Ce matin\')">Matin</button><slot /></div>'
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

async function openCard(wrapper: ReturnType<typeof mount>) {
  const ctaButton = wrapper.findAll('button').find((b) => b.text().includes('Me faire appeler'))
  expect(ctaButton).toBeDefined()
  await ctaButton!.trigger('click')
  await flushPromises()
}

async function fillValidForm(wrapper: ReturnType<typeof mount>, telephone = '06 12 34 56 78') {
  await wrapper.find('input#rappel-telephone').setValue(telephone)
  await wrapper.find('input#rappel-consentement').setValue(true)
}

describe('QuickCallbackCard', () => {
  beforeEach(() => {
    vi.useRealTimers()
    leadSubmitMock.mockClear()
    leadSubmitMock.mockResolvedValue(true)
    leadState.error.value = null
    leadState.validationErrors.value = []
    leadState.sending.value = false
  })

  it('affiche l’état initial compact avec titre, texte indicatif, CTA et lien « Trouver un centre »', () => {
    const wrapper = mount(QuickCallbackCard, { global: { stubs } })

    expect(wrapper.text()).toContain("Besoin d'un échange téléphonique direct")
    expect(wrapper.text()).toContain(
      'Saisissez votre numéro afin que votre conseiller puisse vous rappeler.'
    )
    expect(wrapper.text()).toContain('Me faire appeler')
    expect(wrapper.find('a[href="/centres"]').text()).toContain('Trouver un centre')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('applique le variant dark par défaut et le variant light si spécifié', () => {
    const darkWrapper = mount(QuickCallbackCard, { global: { stubs } })
    expect(darkWrapper.find('.card').attributes('data-variant')).toBe('dark')

    const lightWrapper = mount(QuickCallbackCard, {
      props: { variant: 'light' },
      global: { stubs }
    })
    expect(lightWrapper.find('.card').attributes('data-variant')).toBe('surface')
  })

  it('déplie le formulaire au clic sur « Me faire appeler » sans prop de test', async () => {
    const wrapper = mount(QuickCallbackCard, { global: { stubs } })

    await openCard(wrapper)

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('input#rappel-telephone').exists()).toBe(true)
    expect(wrapper.text()).toContain('Votre numéro de téléphone')
    expect(wrapper.text()).toContain('Heure / Créneau souhaité')
    expect(wrapper.text()).toContain('Valider le rappel')
    expect(wrapper.text()).toContain('Annuler')
  })

  it('masque le formulaire et émet « cancel » au clic sur « Annuler »', async () => {
    const wrapper = mount(QuickCallbackCard, { global: { stubs } })
    await openCard(wrapper)

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
    const wrapper = mount(QuickCallbackCard, { global: { stubs } })
    await openCard(wrapper)

    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Indiquez votre téléphone')
    })
    expect(leadSubmitMock).not.toHaveBeenCalled()
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('affiche une erreur quand le numéro a moins de 10 chiffres', async () => {
    const wrapper = mount(QuickCallbackCard, { global: { stubs } })
    await openCard(wrapper)

    await wrapper.find('input#rappel-telephone').setValue('06 12 34')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Numéro incomplet — 10 chiffres attendus')
    })
    expect(leadSubmitMock).not.toHaveBeenCalled()
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('poste la demande au module leads et émet « submit » avec succès puis affiche l’état confirmé avec live region', async () => {
    const wrapper = mount(QuickCallbackCard, { global: { stubs } })
    await openCard(wrapper)

    await fillValidForm(wrapper)
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => {
      expect(leadSubmitMock).toHaveBeenCalledTimes(1)
    })

    expect(leadSubmitMock).toHaveBeenCalledWith('rappel', {
      telephone: '06 12 34 56 78',
      creneau: 'Dès que possible',
      consentement: true,
      consentementTexte: expect.any(String)
    })

    await flushPromises()

    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('submit')![0]).toEqual([
      {
        telephone: '06 12 34 56 78',
        creneau: 'Dès que possible'
      }
    ])

    // Live region status pour les lecteurs d'écran
    const statusRegion = wrapper.find('[role="status"]')
    expect(statusRegion.exists()).toBe(true)
    expect(statusRegion.attributes('aria-live')).toBe('polite')
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
  })

  it('exerce la sélection d’un créneau personnalisé et transmet la valeur au payload', async () => {
    const wrapper = mount(QuickCallbackCard, { global: { stubs } })
    await openCard(wrapper)

    await fillValidForm(wrapper, '06 98 76 54 32')
    await wrapper.find('button.select-change-creneau').trigger('click')
    await flushPromises()

    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => {
      expect(leadSubmitMock).toHaveBeenCalledTimes(1)
    })

    expect(leadSubmitMock).toHaveBeenCalledWith('rappel', {
      telephone: '06 98 76 54 32',
      creneau: 'Cet après-midi',
      consentement: true,
      consentementTexte: expect.any(String)
    })

    await flushPromises()

    expect(wrapper.emitted('submit')![0]).toEqual([
      {
        telephone: '06 98 76 54 32',
        creneau: 'Cet après-midi'
      }
    ])
    expect(wrapper.text()).toContain('cet après-midi')
  })

  it('affiche un message d’erreur si l’appel API échoue et ne confirme pas', async () => {
    leadSubmitMock.mockImplementationOnce(async () => {
      leadState.error.value = 'L’envoi a échoué — réessayez dans un instant.'
      return false
    })

    const wrapper = mount(QuickCallbackCard, { global: { stubs } })
    await openCard(wrapper)

    await fillValidForm(wrapper)
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('L’envoi a échoué')
    })
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('affiche le message de validation de l’API sous le champ téléphone sur un 400', async () => {
    leadSubmitMock.mockImplementationOnce(async () => {
      leadState.validationErrors.value = ['Numéro incomplet — 10 chiffres attendus.']
      leadState.error.value = 'L’envoi a échoué — réessayez dans un instant.'
      return false
    })

    const wrapper = mount(QuickCallbackCard, { global: { stubs } })
    await openCard(wrapper)

    await fillValidForm(wrapper, '0123456789')
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Numéro incomplet — 10 chiffres attendus.')
    })
    // Le message remonte sous le champ, pas en erreur générique doublée.
    expect(leadState.error.value).toBeNull()
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('exige le consentement : bloque la soumission tant que la case n’est pas cochée', async () => {
    const wrapper = mount(QuickCallbackCard, { global: { stubs } })
    await openCard(wrapper)

    await wrapper.find('input#rappel-telephone').setValue('06 12 34 56 78')
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => {
      expect(wrapper.find('.consent-error').text()).toContain(
        'Consentement requis pour demander un rappel.'
      )
    })
    expect(leadSubmitMock).not.toHaveBeenCalled()
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('envoie à l’API le libellé de consentement exactement tel qu’affiché', async () => {
    const wrapper = mount(QuickCallbackCard, { global: { stubs } })
    await openCard(wrapper)

    // Le texte enregistré dans le CRM doit être celui lu par l'utilisateur —
    // capturé avant soumission : le formulaire laisse place à la confirmation.
    const labelText = wrapper.find('.consent-field label').text()
    expect(wrapper.find('.consent-field a[href="/confidentialite"]').exists()).toBe(true)

    await fillValidForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => {
      expect(leadSubmitMock).toHaveBeenCalledTimes(1)
    })

    const payload = leadSubmitMock.mock.calls[0]![1] as { consentementTexte?: string }
    expect(payload.consentementTexte).toBeTruthy()
    expect(labelText).toContain(payload.consentementTexte)
  })

  it('propose « Ce matin » avant midi', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T10:00:00'))

    const wrapper = mount(QuickCallbackCard, { global: { stubs } })
    await openCard(wrapper)

    const options = wrapper.findAll('.select-item').map((o) => o.text())
    expect(options).toEqual(['Dès que possible', 'Ce matin', 'Cet après-midi'])
  })

  it('masque « Ce matin » après midi', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T14:00:00'))

    const wrapper = mount(QuickCallbackCard, { global: { stubs } })
    await openCard(wrapper)

    const options = wrapper.findAll('.select-item').map((o) => o.text())
    expect(options).toEqual(['Dès que possible', 'Cet après-midi'])
    expect(options).not.toContain('Ce matin')
  })

  it('déclasse un « Ce matin » choisi le matin mais soumis l’après-midi', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T11:59:00'))

    const wrapper = mount(QuickCallbackCard, { global: { stubs } })
    await openCard(wrapper)
    await fillValidForm(wrapper)
    await wrapper.find('button.select-change-matin').trigger('click')
    await flushPromises()

    // L'utilisateur met du temps : au submit, « Ce matin » n'est plus valide.
    vi.setSystemTime(new Date('2026-03-10T13:00:00'))
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => {
      expect(leadSubmitMock).toHaveBeenCalledTimes(1)
    })

    expect(leadSubmitMock).toHaveBeenCalledWith(
      'rappel',
      expect.objectContaining({ creneau: 'Dès que possible' })
    )
  })
})
