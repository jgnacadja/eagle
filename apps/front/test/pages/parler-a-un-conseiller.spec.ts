import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, ref } from 'vue'
import ConseillerPage from '~/pages/parler-a-un-conseiller.vue'

const seoMock = vi.fn()

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useContentSeo', seoMock)

// Stub du composable de soumission : le mock contrôle le résultat de l'appel API.
const leadSubmitMock = vi.fn<(endpoint: string, payload: unknown) => Promise<boolean>>()
vi.stubGlobal('useLeadSubmit', () => ({
  submit: leadSubmitMock,
  sending: ref(false),
  error: ref(null)
}))

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  Button: { template: '<button><slot /></button>' },
  Card: { template: '<div><slot /></div>' },
  Input: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  Textarea: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  Label: { template: '<label><slot /></label>' },
  Checkbox: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<button type="button" role="checkbox" :aria-checked="String(!!modelValue)" @click="$emit(\'update:modelValue\', !modelValue)" />'
  },
  IconCheck: true
}

const Host = defineComponent({
  setup: () => () => h(ConseillerPage)
})

async function mountPage() {
  const wrapper = mount(Host, { global: { stubs } })
  await flushPromises()
  return wrapper
}

// La validation zod/vee-validate est asynchrone : on polle le DOM jusqu'à la condition.
async function waitUntil(ok: () => boolean) {
  for (let i = 0; i < 50 && !ok(); i++) {
    await new Promise((resolve) => setTimeout(resolve, 5))
    await flushPromises()
  }
}

// Remplit tous les champs obligatoires avec des valeurs valides.
async function fillValidForm(wrapper: Awaited<ReturnType<typeof mountPage>>) {
  await wrapper.find('#nom').setValue('Camille Moreau')
  await wrapper.find('#email').setValue('camille@acme.fr')
  await wrapper.find('#telephone').setValue('06 12 34 56 78')
  const checkbox = wrapper.find('[role="checkbox"]')
  if (checkbox.attributes('aria-checked') !== 'true') {
    await checkbox.trigger('click')
  }
}

describe('pages/parler-a-un-conseiller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    leadSubmitMock.mockReset().mockResolvedValue(true)
  })

  it('affiche le titre, le formulaire et la sidebar', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Parler à votre conseiller')
    expect(wrapper.text()).toContain('Ce qui se passe ensuite')
    expect(wrapper.text()).toContain('Vous préférez téléphoner')
    expect(wrapper.text()).toContain('politique de confidentialité')
  })

  it('affiche les quatre natures de besoin, sans terme « franchise »', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Un besoin de formation')
    expect(wrapper.text()).toContain('Ouvrir un centre')
    expect(wrapper.text()).toContain('Devenir formateur')
    expect(wrapper.text()).toContain('Organisme du réseau')
    expect(wrapper.text().toLowerCase()).not.toContain('franchise')
  })

  it('présélectionne « Un besoin de formation »', async () => {
    const wrapper = await mountPage()

    const radio = wrapper.find('[role="radio"][value="conseiller"]')
    expect(radio.attributes('aria-checked')).toBe('true')
  })

  it('affiche les erreurs sur les champs obligatoires à l’envoi', async () => {
    const wrapper = await mountPage()

    await wrapper.find('form').trigger('submit.prevent')
    await waitUntil(() => wrapper.find('[aria-invalid="true"]').exists())

    expect(wrapper.text()).toContain('Indiquez votre nom et prénom')
    expect(wrapper.text()).toContain('Indiquez votre adresse e-mail')
    expect(wrapper.text()).toContain('Indiquez votre téléphone')
    expect(wrapper.text()).toContain('Consentement requis')
    expect(leadSubmitMock).not.toHaveBeenCalled()
  })

  it('SIRET facultatif : envoi accepté sans SIRET', async () => {
    const wrapper = await mountPage()
    await fillValidForm(wrapper)

    await wrapper.find('form').trigger('submit.prevent')
    await waitUntil(() => leadSubmitMock.mock.calls.length > 0)

    expect(leadSubmitMock).toHaveBeenCalledWith(
      'conseiller',
      expect.objectContaining({ nom: 'Camille Moreau', siret: undefined })
    )
  })

  it('signale un SIRET incomplet', async () => {
    const wrapper = await mountPage()
    await fillValidForm(wrapper)
    await wrapper.find('#siret').setValue('123')

    await wrapper.find('form').trigger('submit.prevent')
    await waitUntil(() => wrapper.find('#siret-error').exists())

    expect(wrapper.text()).toContain('SIRET invalide — 14 chiffres attendus')
    expect(leadSubmitMock).not.toHaveBeenCalled()
  })

  it('accepte un SIRET espacé et le normalise avant envoi', async () => {
    const wrapper = await mountPage()
    await fillValidForm(wrapper)
    await wrapper.find('#siret').setValue('1234 5678 9012 34')

    await wrapper.find('form').trigger('submit.prevent')
    await waitUntil(() => leadSubmitMock.mock.calls.length > 0)

    expect(leadSubmitMock).toHaveBeenCalledWith(
      'conseiller',
      expect.objectContaining({ siret: '12345678901234' })
    )
  })

  it('poste le besoin sélectionné au module leads', async () => {
    const wrapper = await mountPage()
    await fillValidForm(wrapper)
    await wrapper.find('[role="radio"][value="formateur"]').trigger('click')

    await wrapper.find('form').trigger('submit.prevent')
    await waitUntil(() => leadSubmitMock.mock.calls.length > 0)

    expect(leadSubmitMock).toHaveBeenCalledWith(
      'conseiller',
      expect.objectContaining({
        besoin: 'formateur',
        consentement: true,
        pageName: 'Parler à votre conseiller'
      })
    )
  })

  it('affiche la confirmation avec référence de suivi après envoi', async () => {
    const wrapper = await mountPage()
    await fillValidForm(wrapper)

    await wrapper.find('form').trigger('submit.prevent')
    await waitUntil(() => wrapper.text().includes('Demande transmise'))

    expect(wrapper.text()).toContain('Demande transmise')
    expect(wrapper.text()).toContain('Référence de suivi')
    expect(wrapper.text()).toMatch(/LU-\d{4}-\d{4}-\d{3}/)
    // La référence affichée est bien celle envoyée au back-office
    // (suffixée au message → learnup_precisions).
    const sent = leadSubmitMock.mock.calls[0]?.[1] as { message: string }
    expect(sent.message).toMatch(/^Référence : LU-\d{4}-\d{4}-\d{3}$/)
    expect(wrapper.text()).toContain(sent.message.replace('Référence : ', ''))
    // v-show : le formulaire reste monté mais masqué après confirmation.
    expect(wrapper.find('form').attributes('style')).toContain('display: none')
  })

  it('garde le formulaire si l’envoi échoue', async () => {
    leadSubmitMock.mockResolvedValue(false)
    const wrapper = await mountPage()
    await fillValidForm(wrapper)

    await wrapper.find('form').trigger('submit.prevent')
    await waitUntil(() => leadSubmitMock.mock.calls.length > 0)

    expect(wrapper.find('form').attributes('style') ?? '').not.toContain('display: none')
    expect(wrapper.text()).not.toContain('Demande transmise')
  })

  it('applique le SEO noindex de la page', async () => {
    await mountPage()

    expect(seoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        seo_title: 'Parler à votre conseiller | LEARN UP ACADEMY',
        seo_noindex: true
      }),
      'Parler à votre conseiller'
    )
  })
})
