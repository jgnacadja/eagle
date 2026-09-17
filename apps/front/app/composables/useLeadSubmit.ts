import type {
  CandidatureLeadPayload,
  DemandeLeadPayload,
  NewsletterLeadPayload
} from '@learnup/types'
import { ref } from 'vue'

export type LeadFormName = 'newsletter' | 'demande' | 'candidature'

type LeadPayload = NewsletterLeadPayload | DemandeLeadPayload | CandidatureLeadPayload

interface HubSpotField {
  objectTypeId: '0-1'
  name: string
  value: string
}

// Champ présent seulement s'il a une valeur : une chaîne vide écraserait
// une propriété HubSpot déjà renseignée par une soumission précédente.
function field(name: string, value: string | number | null | undefined): HubSpotField | null {
  const v = value == null ? '' : String(value).trim()
  return v ? { objectTypeId: '0-1', name, value: v } : null
}

function fields(entries: (HubSpotField | null)[]): HubSpotField[] {
  return entries.filter((entry): entry is HubSpotField => entry !== null)
}

// « Nom et prénom » unique côté site → firstname/lastname HubSpot :
// 1er mot = prénom, le reste = nom. Un seul mot → prénom seul.
function splitName(nom: string): { firstname: string; lastname: string } {
  const [firstname, ...rest] = nom.trim().split(/\s+/)
  return { firstname: firstname ?? '', lastname: rest.join(' ') }
}

// Les CTA réseau historiques envoient ?sujet=franchise — la propriété
// HubSpot `learnup_type_projet` attend `centre`.
function mapSujet(sujet: string | undefined): string | undefined {
  if (!sujet) return undefined
  return sujet === 'franchise' ? 'centre' : sujet
}

function newsletterFields(payload: NewsletterLeadPayload): HubSpotField[] {
  return fields([field('email', payload.email)])
}

function demandeFields(payload: DemandeLeadPayload): HubSpotField[] {
  const { firstname, lastname } = splitName(payload.nom)
  return fields([
    field('firstname', firstname),
    field('lastname', lastname),
    field('email', payload.email),
    field('phone', payload.telephone),
    field('company', payload.raisonSociale),
    field('jobtitle', payload.fonction),
    field('learnup_siret', payload.siret),
    field('learnup_salaries', payload.salaries),
    field('learnup_echeance', payload.echeance),
    field('learnup_precisions', payload.precisions),
    field('learnup_centre', payload.centre),
    field('learnup_formation', payload.formation),
    field('learnup_session', payload.session),
    field('learnup_type_projet', mapSujet(payload.sujet))
  ])
}

function candidatureFields(payload: CandidatureLeadPayload): HubSpotField[] {
  const { firstname, lastname } = splitName(payload.nom)
  return fields([
    field('firstname', firstname),
    field('lastname', lastname),
    field('email', payload.email),
    field('phone', payload.telephone),
    field('learnup_territoire', payload.ville),
    field('learnup_parcours', payload.parcours),
    field('learnup_type_projet', payload.voie)
  ])
}

function buildFields(form: LeadFormName, payload: LeadPayload): HubSpotField[] {
  switch (form) {
    case 'newsletter':
      return newsletterFields(payload as NewsletterLeadPayload)
    case 'demande':
      return demandeFields(payload as DemandeLeadPayload)
    case 'candidature':
      return candidatureFields(payload as CandidatureLeadPayload)
  }
}

// Texte de consentement joint aux forms qui portent une case explicite
// (demande, candidature). La newsletter n'en a pas : y joindre
// legalConsentOptions ferait jeter la soumission par HubSpot (200 mais rien
// d'enregistré).
const CONSENT_TEXT =
  "J'accepte que ces informations soient utilisées pour le traitement de ma demande."

/**
 * Soumission des formulaires « lead » directement vers la Forms API v3 de
 * HubSpot — endpoint non authentifié (portalId + formGuid suffisent), aucun
 * secret côté client. La validation est assurée par les schémas zod des
 * formulaires ; exposé les états d'envoi et d'erreur partagés.
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
      const { hubspot } = useRuntimeConfig().public
      const formGuid = hubspot.formGuids[form]
      if (!hubspot.portalId || !formGuid) {
        throw new Error('Configuration HubSpot manquante')
      }

      const body: Record<string, unknown> = { fields: buildFields(form, payload) }
      // Contexte seulement si la page le fournit : un pageUri dont le domaine
      // n'est pas tracké par le portail fait jeter la soumission par HubSpot.
      if (payload.pageUri || payload.pageName) {
        body.context = { pageUri: payload.pageUri, pageName: payload.pageName }
      }
      if (form !== 'newsletter') {
        body.legalConsentOptions = {
          consent: { consentToProcess: true, text: CONSENT_TEXT }
        }
      }

      await $fetch(
        `${hubspot.formsBaseUrl}/submissions/v3/integration/submit/${hubspot.portalId}/${formGuid}`,
        {
          method: 'POST',
          body
        }
      )
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
