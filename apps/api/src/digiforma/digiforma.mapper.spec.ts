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

    expect(course.digiforma_id).toBe('prog-001')
    expect(course.slug).toBe('pilotage-de-projet')
    expect(course.title).toBe('Pilotage de projet')
    expect(course.description).toBe('Apprendre à piloter.')
    expect(course.duration_days).toBe(3)
    expect(course.duration_hours).toBe(21)
    expect(course.price).toBe(1500)
    expect(course.cpf).toBe(true)
    expect(course.certification).toBe('Certificat')
    expect(course.category_name).toBe('Management & RH')
    expect(course.image_url).toBe('https://example.com/image.jpg')
    expect(course.status).toBe('published')
    expect(course.seo_title).toBe('Pilotage de projet')
    expect(course.seo_description).toBe('Apprendre à piloter.')
    expect(course.raw).toEqual(program)
  })

  it('returns null price when no cost is available', () => {
    const course = mapProgramToCourse({ ...program, costsInter: [] })
    expect(course.price).toBeNull()
  })

  it('rounds fractional durations', () => {
    const course = mapProgramToCourse({ ...program, durationInDays: 2.5, durationInHours: 17.5 })
    expect(course.duration_days).toBe(3)
    expect(course.duration_hours).toBe(18)
  })

  it('returns null category and center when category and sessions are missing', () => {
    const course = mapProgramToCourse({ ...program, category: null, sessions: null })
    expect(course.category_name).toBeNull()
    expect(course.center_slug).toBeNull()
    expect(course.center_slugs).toEqual([])
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
    expect(course.center_slugs).toEqual(['creteil'])
    expect(course.center_slug).toBe('creteil')
    expect(course.locations_text).toContain('Créteil')
    expect(course.locations_text).toContain('Val-de-Marne')
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
    expect(course.center_slugs).toEqual(['lyon', 'paris'])
    expect(course.center_slug).toBe('lyon')
    expect(course.locations_text).toContain('Lyon')
    expect(course.locations_text).toContain('Paris')
  })

  it('returns null centre/location data when sessions are absent', () => {
    const course = mapProgramToCourse({ ...program, sessions: null })

    expect(course.center_slugs).toEqual([])
    expect(course.center_slug).toBeNull()
    expect(course.locations_text).toBeNull()
    expect(course.sessions).toBeNull()
  })
})
