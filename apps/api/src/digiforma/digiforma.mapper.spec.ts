import { mapProgramToCourse } from './digiforma.mapper'
import type { Program } from './digiforma.client'

const program: Program = {
  id: 'prog-001',
  slug: 'course-pilotage',
  title: 'Pilotage de projet',
  description: 'Apprendre à piloter.',
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

describe('mapProgramToCourse', () => {
  it('maps a complete program', () => {
    const course = mapProgramToCourse(program)

    expect(course.digiformaId).toBe('prog-001')
    expect(course.slug).toBe('course-pilotage')
    expect(course.title).toBe('Pilotage de projet')
    expect(course.description).toBe('Apprendre à piloter.')
    expect(course.durationDays).toBe(3)
    expect(course.durationHours).toBe(21)
    expect(course.price).toBe(1800)
    expect(course.cpf).toBe(true)
    expect(course.certification).toBe('Certificat')
    expect(course.familySlug).toBe('management')
    expect(course.status).toBe('published')
    expect(course.raw).toEqual(program)
  })

  it('falls back to a generated slug when missing', () => {
    const course = mapProgramToCourse({ ...program, slug: '' })
    expect(course.slug).toBe('pilotage-de-projet')
  })

  it('falls back to draft when status is not published', () => {
    const course = mapProgramToCourse({ ...program, status: 'archived' })
    expect(course.status).toBe('draft')
  })
})
