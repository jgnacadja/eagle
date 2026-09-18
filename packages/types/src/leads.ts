/**
 * Payloads des formulaires « lead » du site — postés directement par le
 * navigateur à la Forms API v3 de HubSpot (endpoint non authentifié,
 * `useLeadSubmit`), sans passer par l'API du site.
 */

/** Contexte de la page d'origine, transmis à HubSpot pour l'attribution. */
export interface LeadPageContext {
  pageUri?: string
  pageName?: string
}

/** Voie de candidature réseau (sélecteur du dialog Candidature). */
export type LeadVoie = 'centre' | 'organisme' | 'formateur'

export interface NewsletterLeadPayload extends LeadPageContext {
  email: string
}

export interface DemandeLeadPayload extends LeadPageContext {
  nom: string
  email: string
  telephone: string
  raisonSociale: string
  siret: string
  fonction: string
  salaries: number
  echeance: string
  precisions?: string
  consentement: boolean
  /** Libellés lisibles transmis à HubSpot (résolus côté front, pas les slugs). */
  centre?: string
  formation?: string
  session?: string
  /** Sujet transmis par les CTA réseau (?sujet=) : franchise/organisme/formateur/conseiller. */
  sujet?: string
}

export interface CandidatureLeadPayload extends LeadPageContext {
  voie: LeadVoie
  nom: string
  email: string
  telephone: string
  ville: string
  parcours: string
  consentement: boolean
}
