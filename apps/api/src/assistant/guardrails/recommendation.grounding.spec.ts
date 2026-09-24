import type { AssistantRecommendationSet, CourseListItem } from '@learnup/types'
import { makeCourse } from '../../retrieval/retrieval.fixtures'
import {
  attributesOf,
  availabilityOf,
  groundRecommendationSet,
  nextSession
} from './recommendation.grounding'

const NOW = new Date('2026-09-25T12:00:00.000Z')

function courseWithSessions(sessions: CourseListItem['sessions']): CourseListItem {
  return {
    ...makeCourse({
      id: 5,
      slug: 'sst',
      title: 'SST — Sauveteur Secouriste du Travail',
      description: 'Premiers secours.',
      category: 'Sécurité',
      familySlug: 'securite-prevention',
      certification: 'Certificat SST',
      modalities: ['inter', 'presentiel']
    }),
    sessions
  }
}

describe('recommendation grounding', () => {
  it('picks the next real session and derives the availability block', () => {
    const course = courseWithSessions([
      {
        id: 'past',
        startDate: '2026-09-01',
        endDate: null,
        modality: 'presentiel',
        seatsRemaining: 4,
        location: null
      },
      {
        id: 'later',
        startDate: '2026-11-02',
        endDate: null,
        modality: 'presentiel',
        seatsRemaining: 2,
        location: {
          name: 'Centre LEARN UP de Paris',
          city: 'Paris',
          postalCode: null,
          department: null,
          region: null,
          centreSlug: 'paris'
        }
      },
      {
        id: 'next',
        startDate: '2026-09-25',
        endDate: null,
        modality: 'presentiel',
        seatsRemaining: 8,
        location: {
          name: null,
          city: 'Créteil',
          postalCode: null,
          department: null,
          region: null,
          centreSlug: null
        }
      }
    ])

    expect(nextSession(course, NOW)?.id).toBe('next')
    expect(availabilityOf(course, NOW)).toEqual({
      centre: 'Créteil',
      nextSession: '2026-09-25',
      seats: 'available',
      modality: 'presentiel'
    })
  })

  it('flags the last seats and returns null without any upcoming session', () => {
    const limited = courseWithSessions([
      {
        id: 's',
        startDate: '2026-10-01',
        endDate: null,
        modality: null,
        seatsRemaining: 3,
        location: null
      }
    ])
    const unknownSeats = courseWithSessions([
      {
        id: 's',
        startDate: '2026-10-01',
        endDate: null,
        modality: null,
        seatsRemaining: null,
        location: null
      }
    ])

    expect(availabilityOf(limited, NOW)).toMatchObject({
      centre: null,
      seats: 'limited',
      modality: null
    })
    expect(availabilityOf(unknownSeats, NOW)?.seats).toBeNull()
    expect(availabilityOf(courseWithSessions(null), NOW)).toBeNull()
    expect(
      availabilityOf(
        courseWithSessions([
          {
            id: 'x',
            startDate: '2026-01-01',
            endDate: null,
            modality: null,
            seatsRemaining: 1,
            location: null
          }
        ]),
        NOW
      )
    ).toBeNull()
  })

  it('builds factual attributes only from the referential', () => {
    expect(attributesOf(courseWithSessions(null))).toEqual([
      '2 jours',
      'Inter / Présentiel',
      'Certificat SST'
    ])
    expect(
      attributesOf({
        ...courseWithSessions(null),
        durationDays: 1,
        modalities: [],
        certification: null
      })
    ).toEqual(['1 jour'])
    expect(
      attributesOf({
        ...courseWithSessions(null),
        durationDays: null,
        modalities: ['inconnue'],
        certification: null
      })
    ).toEqual(['inconnue'])
  })

  it('drops unknown courses, promotes the first valid alternative and restores exact titles', () => {
    const published = new Map<string, CourseListItem>([['sst', courseWithSessions(null)]])
    const set: AssistantRecommendationSet = {
      principal: {
        course: { title: 'Formation inventée', slug: 'inventee', familySlug: null },
        justification: 'Semble adaptée.',
        attributes: ['fake'],
        availability: {
          centre: 'Nulle part',
          nextSession: '2099-01-01',
          seats: 'available',
          modality: null
        }
      },
      alternatives: [
        {
          course: { title: 'SST reformulé par l’IA', slug: 'sst', familySlug: null },
          justification: 'Semble utile.',
          attributes: [],
          availability: null
        }
      ],
      source: 'x'
    }

    const { set: grounded, rejected } = groundRecommendationSet(set, published, NOW)

    expect(rejected).toEqual(['inventee'])
    expect(grounded?.principal.course).toEqual({
      title: 'SST — Sauveteur Secouriste du Travail',
      slug: 'sst',
      familySlug: 'securite-prevention'
    })
    expect(grounded?.principal.attributes).toEqual([
      '2 jours',
      'Inter / Présentiel',
      'Certificat SST'
    ])
    expect(grounded?.principal.availability).toBeNull()
    expect(grounded?.alternatives).toEqual([])
  })

  it('returns an empty result when nothing belongs to the catalogue', () => {
    const set: AssistantRecommendationSet = {
      principal: {
        course: { title: 'x', slug: 'x', familySlug: null },
        justification: '',
        attributes: [],
        availability: null
      },
      alternatives: [],
      source: ''
    }

    expect(groundRecommendationSet(set, new Map(), NOW)).toEqual({ set: null, rejected: ['x'] })
  })
})
