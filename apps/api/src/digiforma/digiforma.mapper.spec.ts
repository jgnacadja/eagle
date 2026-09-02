import { mapProgramToFormation } from './digiforma.mapper'
import type { Program } from './digiforma.client'

const program: Program = {
  id: 'prog-001',
  slug: ' formation-pilotage ',
  title: '  Pilotage de projet  ',
  description: ' Apprendre à piloter. ',
  durationInDays: 3,
  durationInHours: 21,
  price: 1800,
  cpf: true,
  cpfCode: 'CPF-12345',
  certificationType: 'Certificat',
  certifierName: 'LEARN UP',
  category: 'Management & RH',
  programCategory: 'Management',
  blocks: [{ type: 'objectif', content: 'Comprendre' }],
  image: 'https://example.com/image.jpg',
  generatedProgramUrl: 'https://app.digiforma.com/prog-001',
  status: 'published'
}

describe('mapProgramToFormation', () => {
  it('maps a complete program', () => {
    const formation = mapProgramToFormation(program)

    expect(formation.digiformaId).toBe('prog-001')
    expect(formation.slug).toBe('formation-pilotage')
    expect(formation.title).toBe('Pilotage de projet')
    expect(formation.description).toBe('Apprendre à piloter.')
    expect(formation.durationDays).toBe(3)
    expect(formation.durationHours).toBe(21)
    expect(formation.price).toBe(1800)
    expect(formation.cpf).toBe(true)
    expect(formation.certification).toBe('Certificat')
    expect(formation.familySlug).toBe('management')
    expect(formation.status).toBe('published')
    expect(formation.raw).toEqual(program)
  })

  it('falls back to a generated slug when missing', () => {
    const formation = mapProgramToFormation({ ...program, slug: '' })
    expect(formation.slug).toBe('pilotage-de-projet')
  })

  it('falls back to draft when status is not published', () => {
    const formation = mapProgramToFormation({ ...program, status: 'archived' })
    expect(formation.status).toBe('draft')
  })
})
