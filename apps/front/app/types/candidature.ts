import type { LeadVoie } from '@learnup/types'

// Alias local : la voie du dialog Candidature est la `LeadVoie` du payload HubSpot.
export type CandidatureVoie = LeadVoie

export const VOIE_LABELS: Record<CandidatureVoie, string> = {
  centre: 'Ouvrir un centre',
  organisme: 'Référencer mon organisme',
  formateur: 'Formateur indépendant'
}

export interface CandidaturePayload {
  voie: CandidatureVoie
  nom: string
  email: string
  telephone: string
  ville: string
  parcours: string
}
