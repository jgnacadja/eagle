import { mapProgramToCourse } from './digiforma.mapper'
import type { Program } from './digiforma.client'

const program: Program = {
  id: 'prog-001',
  code: 'R489',
  name: 'Pilotage de projet',
  description: 'Apprendre à piloter.',
  durationInDays: 3,
  durationInHours: 21,
  cpf: true,
  cpfCode: 'CPF-12345',
  certificationType: 'Certificat',
  certifierName: 'LEARN UP',
  category: { id: 'cat-1', name: 'Management & RH' },
  blocks: [{ name: 'Bloc 1', description: 'Comprendre', goals: [{ text: 'Objectif 1' }] }],
  image: { id: 'img-1', url: 'https://example.com/image.jpg' },
  generatedProgramUrl: 'https://app.digiforma.com/prog-001',
  costsInter: [
    { cost: 1800, vat: 20, type: 'inter' },
    { cost: 1500, vat: 20, type: 'inter' }
  ],
  targets: [{ text: 'Managers' }],
  prerequisites: [{ text: 'Aucun' }]
}

describe('mapProgramToCourse', () => {
  it('maps a complete program', () => {
    const course = mapProgramToCourse(program)

    expect(course.digiformaId).toBe('prog-001')
    expect(course.slug).toBe('pilotage-de-projet')
    expect(course.title).toBe('Pilotage de projet')
    expect(course.description).toBe('Apprendre à piloter.')
    expect(course.durationDays).toBe(3)
    expect(course.durationHours).toBe(21)
    expect(course.price).toBe(1500)
    expect(course.cpf).toBe(true)
    expect(course.certification).toBe('Certificat')
    expect(course.category).toBe('Management & RH')
    expect(course.familySlug).toBe('management-rh')
    expect(course.imageUrl).toBe('https://example.com/image.jpg')
    expect(course.status).toBe('published')
    expect(course.raw).toEqual(program)
  })

  it('returns null price when no cost is available', () => {
    const course = mapProgramToCourse({ ...program, costsInter: [] })
    expect(course.price).toBeNull()
  })

  it('rounds fractional durations', () => {
    const course = mapProgramToCourse({ ...program, durationInDays: 2.5, durationInHours: 17.5 })
    expect(course.durationDays).toBe(3)
    expect(course.durationHours).toBe(18)
  })

  it('returns null family slug when category is missing', () => {
    const course = mapProgramToCourse({ ...program, category: null })
    expect(course.familySlug).toBeNull()
    expect(course.category).toBeNull()
  })

  it('maps sessions, modalities, centre slugs and location text', () => {
    const course = mapProgramToCourse({
      ...program,
      modalities: ['presentiel', 'distanciel'],
      sessions: [
        {
          id: 'sess-1',
          startDate: '2026-10-05',
          endDate: '2026-10-07',
          modality: 'presentiel',
          seatsRemaining: 4,
          location: {
            name: 'Centre de Créteil',
            city: 'Créteil',
            postalCode: '94000',
            department: 'Val-de-Marne',
            region: 'Île-de-France',
            centreSlug: 'creteil'
          }
        },
        {
          id: 'sess-2',
          startDate: '2026-11-10',
          endDate: '2026-11-12',
          modality: 'distanciel',
          seatsRemaining: null,
          location: { name: 'Classe virtuelle', city: 'À distance', centreSlug: null }
        }
      ]
    })

    expect(course.modalities).toEqual(expect.arrayContaining(['presentiel', 'distanciel', 'inter']))
    expect(course.centerSlugs).toEqual(['creteil'])
    expect(course.centerSlug).toBe('creteil')
    expect(course.locationsText).toContain('Créteil')
    expect(course.locationsText).toContain('Val-de-Marne')
    expect(course.sessions).toHaveLength(2)
  })

  it('deduplicates centre slugs and filters unknown modalities', () => {
    const course = mapProgramToCourse({
      ...program,
      costsInter: [],
      modalities: ['presentiel', 'webinar-inconnu', 'presentiel'],
      sessions: [
        { location: { centreSlug: 'lyon', city: 'Lyon' } },
        { location: { centreSlug: 'lyon', city: 'Lyon' } },
        { location: { centreSlug: 'paris', city: 'Paris' } }
      ]
    })

    expect(course.modalities).toEqual(['presentiel'])
    expect(course.centerSlugs).toEqual(['lyon', 'paris'])
    expect(course.centerSlug).toBe('lyon')
    expect(course.locationsText).toContain('Lyon')
    expect(course.locationsText).toContain('Paris')
  })

  it('returns null centre/location data when sessions are absent', () => {
    const course = mapProgramToCourse({ ...program, sessions: null })

    expect(course.centerSlugs).toEqual([])
    expect(course.centerSlug).toBeNull()
    expect(course.locationsText).toBeNull()
    // toJsonValue produit le marqueur JsonNull (structuredClone le sérialise en objet vide)
    expect(course.sessions).not.toBeInstanceOf(Array)
    expect(course.sessions).toEqual({})
  })
})
