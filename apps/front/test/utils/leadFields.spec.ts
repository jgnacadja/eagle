import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { leadFields } from '~/utils/leadFields'

const schema = () =>
  z.object(
    leadFields({
      email: 'E-mail requis.',
      consentement: 'Consentement requis.'
    })
  )

const valid = {
  nom: 'Camille Moreau',
  email: 'camille@acme.fr',
  telephone: '06 12 34 56 78',
  consentement: true
}

const firstIssue = (input: unknown) => schema().safeParse(input).error?.issues[0]?.message

describe('leadFields', () => {
  it('valide un contact complet', () => {
    const parsed = schema().safeParse(valid)
    expect(parsed.success).toBe(true)
    expect(parsed.data).toEqual(valid)
  })

  it('trim le nom et rejette un nom vide', () => {
    expect(schema().safeParse({ ...valid, nom: '  Jean  ' }).data?.nom).toBe('Jean')
    expect(firstIssue({ ...valid, nom: '   ' })).toBe('Indiquez votre nom et prénom.')
  })

  it('rejette un e-mail vide avec le message du formulaire', () => {
    expect(firstIssue({ ...valid, email: '' })).toBe('E-mail requis.')
  })

  it('rejette un e-mail mal formé', () => {
    expect(firstIssue({ ...valid, email: 'pas-un-email' })).toBe('Format d’e-mail invalide.')
  })

  it('rejette un téléphone de moins de 10 chiffres', () => {
    expect(firstIssue({ ...valid, telephone: '0612' })).toBe(
      'Numéro incomplet — 10 chiffres attendus.'
    )
    expect(firstIssue({ ...valid, telephone: 'abc' })).toBe(
      'Numéro incomplet — 10 chiffres attendus.'
    )
  })

  it('rejette un consentement non coché avec le message du formulaire', () => {
    expect(firstIssue({ ...valid, consentement: false })).toBe('Consentement requis.')
    expect(firstIssue({ ...valid, consentement: undefined })).toBe('Consentement requis.')
  })
})
