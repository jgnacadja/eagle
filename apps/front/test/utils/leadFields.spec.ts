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

  it('accepte les formats espacés et internationaux comme l’API', () => {
    for (const telephone of [
      '+33 6 12 34 56 78',
      '+33 (0)6 12 34 56 78',
      '+32 470 12 34 56',
      '+41 44 123 45 67'
    ]) {
      expect(schema().safeParse({ ...valid, telephone }).success).toBe(true)
    }
  })

  it('rejette un téléphone de plus de 30 caractères comme l’API', () => {
    expect(firstIssue({ ...valid, telephone: `06 ${'12 '.repeat(20)}` })).toBe(
      'Numéro de téléphone trop long — 30 caractères maximum.'
    )
  })

  it('rejette un consentement non coché avec le message du formulaire', () => {
    expect(firstIssue({ ...valid, consentement: false })).toBe('Consentement requis.')
    expect(firstIssue({ ...valid, consentement: undefined })).toBe('Consentement requis.')
  })
})
