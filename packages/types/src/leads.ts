/**
 * Payloads des formulaires « lead » du site — postés par le navigateur à
 * l'API du site (`POST /leads/{form}`, `useLeadSubmit`), qui fait pivot
 * vers la Forms API v3 de HubSpot.
 */

/** Contexte de la page d'origine, transmis à HubSpot pour l'attribution. */
export interface LeadPageContext {
  pageUri?: string
  pageName?: string
  /** Cookie de tracking HubSpot — transmis à la seule tête de réseau (HQ). */
  hutk?: string
}

/**
 * Rattachement d'un lead à une source (portail HubSpot) : ids Directus de la
 * formation / du centre visé. Absents ou inconnus → portail HQ.
 */
export interface LeadRouting {
  formationId?: number
  centreId?: number
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

export interface DemandeLeadPayload extends LeadPageContext, LeadRouting {
  nom: string
  email: string
  telephone: string
  telephonePro?: string
  raisonSociale: string
  siret: string
  fonction: string
  salaries: number
  echeance: string
  /** Site client renseigné en intra (?intra=1) — versé dans `precisions` côté HubSpot. */
  lieu?: string
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

export interface ConseillerLeadPayload extends LeadPageContext, LeadRouting {
  besoin: ConseillerBesoin
  nom: string
  email: string
  telephone: string
  siret?: string
  message?: string
  consentement: boolean
}

export interface RappelLeadPayload extends LeadPageContext, LeadRouting {
  telephone: string
  creneau?: string
  consentement: boolean
  /**
   * Libellé de consentement affiché par la case à cocher — enregistré tel
   * quel par HubSpot (`legalConsentOptions`) : le CRM trace exactement ce
   * que l'utilisateur a lu.
   */
  consentementTexte?: string
}
