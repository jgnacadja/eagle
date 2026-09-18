import { DOMWrapper, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import Candidature from '~/components/Candidature/index.vue'

// Stub du composable de soumission : le mock contrôle succès/échec et latence,
// l'état `sending`/`error` est piloté comme le fait le vrai composable.
const leadSubmitMock = vi.fn<(endpoint: string, payload: unknown) => Promise<boolean>>()
const leadSending = ref(false)
const leadError = ref<string | null>(null)

vi.stubGlobal('useLeadSubmit', () => ({
  submit: async (endpoint: string, payload: unknown) => {
    leadSending.value = true
    leadError.value = null
    try {
      const ok = await leadSubmitMock(endpoint, payload)
      if (!ok) leadError.value = 'L’envoi a échoué — réessayez dans un instant.'
      return ok
    } finally {
      leadSending.value = false
    }
  },
  sending: leadSending,
  error: leadError,
  reset: () => {
    leadError.value = null
  }
}))

// Le contenu du dialog est téléporté dans document.body (reka-ui DialogPortal) :
// on l'y interroge directement plutôt que via le wrapper.
function mountDialog(props: Record<string, unknown> = {}) {
  return mount(Candidature, {
    props: { open: true, ...props },
    attachTo: document.body
  })
}

function bodyEl<T extends Element = HTMLElement>(selector: string) {
  const el = document.body.querySelector<T>(selector)
  if (!el) throw new Error(`Élément introuvable : ${selector}`)
  return new DOMWrapper(el)
}

// La validation zod/vee-validate est asynchrone : on polle le DOM jusqu'à ce que
// la condition soit remplie (setTimeout est gelé sous fake timers — on avance à la place).
async function waitUntil(ok: () => boolean) {
  for (let i = 0; i < 50 && !ok(); i++) {
    if (vi.isFakeTimers()) {
      await vi.advanceTimersByTimeAsync(5)
    } else {
      await new Promise((resolve) => setTimeout(resolve, 5))
    }
    await flushPromises()
  }
}

// Attend que la validation ait rendu une erreur ou l'état d'envoi.
async function settleValidation() {
  await waitUntil(
    () =>
      Boolean(document.querySelector('[aria-invalid="true"]')) ||
      Boolean(document.body.textContent?.includes('Envoi en cours'))
  )
}

// Voie sélectionnée = le radio coché (propriété DOM, pas attribut).
function checkedVoieLabel() {
  const checked = [...document.body.querySelectorAll<HTMLInputElement>('input[type="radio"]')].find(
    (r) => r.checked
  )
  return checked?.closest('label')?.textContent ?? ''
}

// Remplit tous les champs requis avec des valeurs valides.
async function fillValidForm(overrides: Record<string, string> = {}) {
  const values = {
    '#candidature-nom': 'Jean Dupont',
    '#candidature-email': 'jean@entreprise.fr',
    '#candidature-telephone': '0612345678',
    '#candidature-ville': 'Créteil (94)',
    ...overrides
  }
  for (const [id, value] of Object.entries(values)) {
    await bodyEl<HTMLInputElement>(id).setValue(value)
  }
  await bodyEl<HTMLTextAreaElement>('#candidature-parcours').setValue('Parcours de test.')
  const checkbox = document.body.querySelector('[role="checkbox"]')
  if (checkbox?.getAttribute('aria-checked') !== 'true') {
    await new DOMWrapper(checkbox as HTMLElement).trigger('click')
  }
}

beforeEach(() => {
  leadSubmitMock.mockReset().mockResolvedValue(true)
  leadSending.value = false
  leadError.value = null
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('components/Candidature', () => {
  it('présélectionne « Ouvrir un centre » par défaut', () => {
    mountDialog()

    expect(checkedVoieLabel()).toContain('Ouvrir un centre')
  })

  it('présélectionne la voie passée en prop', () => {
    mountDialog({ voie: 'formateur' })

    expect(checkedVoieLabel()).toContain('Formateur indépendant')
  })

  it('bloque l’envoi et affiche les erreurs quand le formulaire est vide', async () => {
    mountDialog()

    await bodyEl('form').trigger('submit')
    await settleValidation()

    expect(document.body.textContent).toContain('Indiquez votre nom et prénom')
    expect(document.body.textContent).toContain('Indiquez votre e-mail professionnel')
    expect(document.body.textContent).toContain('Consentement requis')
    expect(document.body.textContent).not.toContain('Envoi en cours')
    // Champs marqués en erreur pour les technologies d'assistance.
    expect(bodyEl('#candidature-nom').attributes('aria-invalid')).toBe('true')
  })

  it('signale un e-mail invalide sans bloquer les champs valides', async () => {
    mountDialog()

    await fillValidForm({ '#candidature-email': 'pas-un-email' })
    await bodyEl('form').trigger('submit')
    await settleValidation()

    expect(document.body.textContent).toContain('Format d’e-mail invalide')
    expect(document.body.textContent).not.toContain('Indiquez votre nom et prénom')
    expect(document.body.textContent).not.toContain('Envoi en cours')
  })

  it('efface l’erreur dès que le champ redevient valide', async () => {
    mountDialog()

    await bodyEl('form').trigger('submit')
    await settleValidation()
    expect(document.body.textContent).toContain('Indiquez votre nom et prénom')

    await bodyEl<HTMLInputElement>('#candidature-nom').setValue('Jean Dupont')
    await waitUntil(() => !document.body.textContent?.includes('Indiquez votre nom et prénom'))
    expect(document.body.textContent).not.toContain('Indiquez votre nom et prénom')
  })

  it('poste la candidature au module leads puis affiche la confirmation', async () => {
    vi.useFakeTimers()
    // Latence simulée : l'état d'envoi reste observable le temps de la requête.
    leadSubmitMock.mockImplementation(
      () => new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 900))
    )
    mountDialog()

    await fillValidForm()
    await bodyEl('form').trigger('submit')
    await settleValidation()

    // État d'envoi avant la confirmation (transition non instantanée).
    expect(document.body.textContent).toContain('Envoi en cours…')
    expect(document.body.textContent).not.toContain('Votre candidature est transmise')

    await vi.advanceTimersByTimeAsync(1000)

    expect(document.body.textContent).toContain('Votre candidature est transmise')
    expect(document.body.textContent).toContain('Ouvrir un centre — Créteil (94)')
    expect(document.body.textContent).toContain('Découvrir les actualités du réseau')
    expect(leadSubmitMock).toHaveBeenCalledWith(
      'candidature',
      expect.objectContaining({
        voie: 'centre',
        nom: 'Jean Dupont',
        email: 'jean@entreprise.fr',
        telephone: '0612345678',
        ville: 'Créteil (94)',
        consentement: true
      })
    )
  })

  it('affiche une erreur sans passer à la confirmation si l’envoi échoue', async () => {
    leadSubmitMock.mockResolvedValue(false)
    mountDialog()

    await fillValidForm()
    await bodyEl('form').trigger('submit')
    await settleValidation()
    await waitUntil(() => Boolean(document.body.textContent?.includes('envoi a échoué')))

    expect(document.body.textContent).toContain('envoi a échoué')
    expect(document.body.textContent).not.toContain('Votre candidature est transmise')
  })

  it('revient au formulaire avec la nouvelle voie à la réouverture', async () => {
    vi.useFakeTimers()
    const wrapper = mountDialog({ voie: 'organisme' })

    await fillValidForm({ '#candidature-ville': 'Lyon' })
    await bodyEl('form').trigger('submit')
    await settleValidation()
    await vi.advanceTimersByTimeAsync(1000)
    expect(document.body.textContent).toContain('Votre candidature est transmise')

    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true, voie: 'centre' })

    expect(document.body.textContent).toContain('Candidater au réseau')
    expect(checkedVoieLabel()).toContain('Ouvrir un centre')
  })
})
