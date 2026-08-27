import { PROFILES, getProfileById, isProfileId } from './profiles'

describe('profiles', () => {
  it('exposes exactly the 4 profiles required by the ticket', () => {
    expect(PROFILES.map((profile) => profile.id)).toEqual([
      'entreprise',
      'particulier',
      'franchise',
      'formateur'
    ])
  })

  describe('isProfileId', () => {
    it('returns true for a known profile id', () => {
      expect(isProfileId('entreprise')).toBe(true)
    })

    it('returns false for an unknown value', () => {
      expect(isProfileId('not-a-profile')).toBe(false)
    })
  })

  describe('getProfileById', () => {
    it('returns the matching profile', () => {
      expect(getProfileById('franchise')).toEqual({
        id: 'franchise',
        label: 'Franchisé',
        hubspotValue: 'Franchisé'
      })
    })

    it('throws when the id is not found', () => {
      // @ts-expect-error - intentionally invalid id to exercise the guard clause
      expect(() => getProfileById('unknown')).toThrow('Unknown profile id: unknown')
    })
  })
})
