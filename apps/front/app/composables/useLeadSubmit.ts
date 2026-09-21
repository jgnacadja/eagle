import type {
  CandidatureLeadPayload,
  DemandeLeadPayload,
  NewsletterLeadPayload
} from '@learnup/types'
import { ref } from 'vue'

export type LeadFormName = 'newsletter' | 'demande' | 'candidature'

type LeadPayload = NewsletterLeadPayload | DemandeLeadPayload | CandidatureLeadPayload

/**
 * Soumission des formulaires « lead » à l'API du site (`POST /leads/{form}`),
 * qui fait pivot vers la Forms API HubSpot : mapping des propriétés,
 * contexte de page et consentement sont gérés côté serveur. La validation
 * est assurée par les schémas zod des formulaires ; exposé les états
 * d'envoi et d'erreur partagés.
 */
export function useLeadSubmit() {
  const sending = ref(false)
  const error = ref<string | null>(null)

  // Overloads : le couple form/payload est vérifié à l'appel — un mauvais
  // appariement ne compilerait pas au lieu de mapper silencieusement.
  function submit(form: 'newsletter', payload: NewsletterLeadPayload): Promise<boolean>
  function submit(form: 'demande', payload: DemandeLeadPayload): Promise<boolean>
  function submit(form: 'candidature', payload: CandidatureLeadPayload): Promise<boolean>
  async function submit(form: LeadFormName, payload: LeadPayload): Promise<boolean> {
    if (sending.value) return false
    sending.value = true
    error.value = null
    try {
      const { apiBase } = useRuntimeConfig().public
      if (!apiBase) {
        throw new Error('Configuration API manquante')
      }

      await $fetch(`${apiBase}/leads/${form}`, {
        method: 'POST',
        body: payload
      })
      return true
    } catch (err) {
      // submit() ne tourne que côté navigateur (les formulaires passent
      // window.location.href) — l'échec est loggé ici sinon il serait muet.
      logClientError('[useLeadSubmit] submit failed:', err)
      error.value = 'L’envoi a échoué — réessayez dans un instant.'
      return false
    } finally {
      sending.value = false
    }
  }

  // Efface l'erreur affichée (ex : à la réouverture d'un dialog).
  function reset() {
    error.value = null
  }

  return { submit, sending, error, reset }
}
