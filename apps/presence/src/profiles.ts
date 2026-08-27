export type ProfileId = 'entreprise' | 'particulier' | 'franchise' | 'formateur'

export interface Profile {
  id: ProfileId
  label: string
  hubspotValue: string
}

export const PROFILES: Profile[] = [
  { id: 'entreprise', label: 'Entreprise', hubspotValue: 'Entreprise' },
  { id: 'particulier', label: 'Particulier', hubspotValue: 'Particulier' },
  { id: 'franchise', label: 'Franchisé', hubspotValue: 'Franchisé' },
  { id: 'formateur', label: 'Formateur', hubspotValue: 'Formateur' }
]

export function isProfileId(value: string): value is ProfileId {
  return PROFILES.some((profile) => profile.id === value)
}

export function getProfileById(id: ProfileId): Profile {
  const profile = PROFILES.find((candidate) => candidate.id === id)
  if (!profile) {
    throw new Error(`Unknown profile id: ${id}`)
  }
  return profile
}
