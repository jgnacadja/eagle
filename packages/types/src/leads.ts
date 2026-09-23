/**
 * Payloads des formulaires « lead » du site — postés par le navigateur à
 * l'API du site (`POST /leads/{form}`, `useLeadSubmit`), qui fait pivot
 * vers la Forms API v3 de HubSpot.
 */

/** Contexte de la page d'origine, transmis à HubSpot pour l'attribution. */
export interface LeadPageContext {
  pageUri?: string
  pageName?: string
}

/** Voie de candidature réseau (sélecteur du dialog Candidature). */
export type LeadVoie = 'centre' | 'organisme' | 'formateur'

/**
 * Nature du besoin exprimé sur le formulaire « Parler à votre conseiller ».
 * Alimente le routage back-office (`learnup_type_projet`) — jamais exposé
 * côté client : « conseiller » couvre le besoin de formation générique.
 */
export type ConseillerBesoin = LeadVoie | 'conseiller'

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

export interface ConseillerLeadPayload extends LeadPageContext {
  besoin: ConseillerBesoin
  nom: string
  email: string
  telephone: string
  siret?: string
  message?: string
  consentement: boolean
}
