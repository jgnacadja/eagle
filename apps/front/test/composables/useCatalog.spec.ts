import type { CourseListItem } from '@learnup/types'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import {
  buildCertifications,
  buildDuration,
  buildMeta,
  buildSessionBadge,
  buildStatus,
  mapCourse,
  useCatalog
} from '~/composables/useCatalog'

const course: CourseListItem = {
  id: 1,
  slug: 'caces-r489-chariots-elevateurs',
  title: 'CACES R489 — chariots élévateurs',
  description: 'Formation de conduite.',
  durationDays: 3,
  durationHours: null,
  price: null,
  cpf: null,
  cpfCode: null,
  certification: 'Certification CACES',
  certifierName: 'Opérateur réglementaire',
  category: null,
  familySlug: 'caces-conduite-engins',
  centerSlug: null,
  centerSlugs: [],
  modalities: [],
  sessions: null,
  imageUrl: null,
  generatedProgramUrl: null,
  status: 'published',
  seoTitle: null,
  seoDescription: null,
  seoCanonical: null
}

describe('useCatalog helpers', () => {
  it('builds duration buckets from days when hours are missing', () => {
    expect(buildDuration({ ...course, durationHours: null, durationDays: 0 })).toBe('courte')
    expect(buildDuration({ ...course, durationHours: null, durationDays: 1 })).toBe('courte')
    expect(buildDuration({ ...course, durationHours: null, durationDays: 2 })).toBe('moyenne')
    expect(buildDuration({ ...course, durationHours: null, durationDays: 5 })).toBe('moyenne')
    expect(buildDuration({ ...course, durationHours: null, durationDays: 6 })).toBe('longue')
  })

  it('builds duration buckets from hours when available', () => {
    expect(buildDuration({ ...course, durationHours: 7 })).toBe('courte')
    expect(buildDuration({ ...course, durationHours: 20 })).toBe('moyenne')
    expect(buildDuration({ ...course, durationHours: 60 })).toBe('longue')
  })

  it('builds meta from duration, certification and certifier', () => {
    expect(buildMeta(course)).toBe('3 jours · Certification CACES · Opérateur réglementaire')
  })

  it('builds certifications from course data', () => {
    expect(buildCertifications(course)).toEqual(['certification', 'reglementaire'])
  })

  it('detects habilitation keyword', () => {
    const habilitation: CourseListItem = {
      ...course,
      certification: 'Habilitation électrique',
      certifierName: null
    }
    expect(buildCertifications(habilitation)).toEqual(['certification', 'habilitation'])
  })

  it('detects recyclage keyword', () => {
    const recyclage: CourseListItem = {
      ...course,
      certification: 'Recyclage SST',
      certifierName: null
    }
    expect(buildCertifications(recyclage)).toEqual(['certification', 'recyclage'])
  })

  it('maps a course to a FormationItem using the provided family name', () => {
    const mapped = mapCourse(course, "CACES & conduite d'engins")

    expect(mapped.slug).toBe(course.slug)
    expect(mapped.title).toBe(course.title)
    expect(mapped.family).toBe("CACES & conduite d'engins")
    expect(mapped.familyKey).toBe(course.familySlug)
    expect(mapped.duration).toBe('moyenne')
    expect(mapped.days).toBe(3)
    expect(mapped.certifications).toEqual(['certification', 'reglementaire'])
    expect(mapped.to).toBe('/formations/caces-conduite-engins/caces-r489-chariots-elevateurs')
  })

  it('falls back to the slug when family name is not provided', () => {
    const mapped = mapCourse(course)

    expect(mapped.family).toBe(course.familySlug)
    expect(mapped.familyKey).toBe(course.familySlug)
  })

  it('renders family-less courses without a link', () => {
    const mapped = mapCourse({ ...course, familySlug: null })

    expect(mapped.family).toBe('Autre')
    expect(mapped.familyKey).toBe('autre')
    expect(mapped.to).toBeNull()
  })

  it('buildStatus ignores past sessions and keeps today', () => {
    const today = new Date()
    const todayIso = today.toISOString().slice(0, 10)
    const past = new Date(today)
    past.setUTCDate(past.getUTCDate() - 10)
    const future = new Date(today)
    future.setUTCDate(future.getUTCDate() + 30)

    const session = (startDate: string) => ({
      id: startDate,
      startDate,
      endDate: null,
      modality: null,
      seatsRemaining: null,
      location: null
    })

    // Seule une session passée : pas de statut.
    expect(
      buildStatus({ ...course, sessions: [session(past.toISOString().slice(0, 10))] })
    ).toBeUndefined()

    // Session passée + session du jour : la session du jour est retenue.
    const status = buildStatus({
      ...course,
      sessions: [session(past.toISOString().slice(0, 10)), session(todayIso)]
    })
    expect(status?.type).toBe('success')
    expect(status?.label).toBe('Sessions ce mois-ci')

    // La prochaine session future est affichée, pas la passée.
    const futureStatus = buildStatus({
      ...course,
      sessions: [
        session(past.toISOString().slice(0, 10)),
        session(future.toISOString().slice(0, 10))
      ]
    })
    expect(futureStatus?.label).toContain('Prochaine session le')
  })

  it('buildSessionBadge returns null when all sessions are past', () => {
    const past = new Date()
    past.setUTCDate(past.getUTCDate() - 5)
    const sessions = [
      {
        id: 's1',
        startDate: past.toISOString().slice(0, 10),
        endDate: null,
        modality: null,
        seatsRemaining: null,
        location: null
      }
    ]
    expect(buildSessionBadge({ ...course, sessions })).toBeNull()
  })
})

describe('useCatalog composable', () => {
  it('fetches the catalog from the API', async () => {
    const listResponse = {
      items: [course],
      total: 1,
      page: 1,
      pageSize: 9
    }

    vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
    vi.stubGlobal('logServerError', vi.fn())

    let requestedUrl = ''
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      requestedUrl = url
      return listResponse
    })
    vi.stubGlobal('$fetch', fetchMock)

    vi.stubGlobal('useAsyncData', async (_key: unknown, handler: () => Promise<unknown>) => ({
      data: ref(await handler()),
      pending: ref(false),
      error: ref(null),
      refresh: vi.fn()
    }))

    const { data } = await useCatalog(ref({}))

    expect(data.value).toEqual(listResponse)
    expect(requestedUrl).toBe('http://api.test/courses')
  })

  it('forwards duration buckets as a comma-separated durations param', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
    vi.stubGlobal('logServerError', vi.fn())

    let requestedQuery: Record<string, unknown> = {}
    vi.stubGlobal(
      '$fetch',
      vi.fn().mockImplementation((_url: string, options: { query: Record<string, unknown> }) => {
        requestedQuery = options.query
        return { items: [], total: 0, page: 1, pageSize: 9 }
      })
    )
    vi.stubGlobal('useAsyncData', async (_key: unknown, handler: () => Promise<unknown>) => ({
      data: ref(await handler()),
      pending: ref(false),
      error: ref(null),
      refresh: vi.fn()
    }))

    await useCatalog(ref({ durations: ['courte', 'longue'] }))

    expect(requestedQuery.durations).toBe('courte,longue')
    expect(requestedQuery.durationMin).toBeUndefined()
    expect(requestedQuery.durationMax).toBeUndefined()
  })

  it('serves the Nuxt payload only on initial cause, not on watch refetches', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
    vi.stubGlobal('logServerError', vi.fn())
    vi.stubGlobal(
      '$fetch',
      vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 9 })
    )

    let options:
      | { getCachedData?: (key: string, nuxtApp: unknown, ctx: { cause: string }) => unknown }
      | undefined
    vi.stubGlobal(
      'useAsyncData',
      async (_key: unknown, handler: () => Promise<unknown>, opts?: typeof options) => {
        options = opts
        return {
          data: ref(await handler()),
          pending: ref(false),
          error: ref(null),
          refresh: vi.fn()
        }
      }
    )

    await useCatalog(ref({}))

    const key = `catalog:${JSON.stringify({ limit: 9, page: 1 })}`
    const cached = { items: [{ slug: 'cached' }], total: 1, page: 1, pageSize: 9 }
    const nuxtApp = { payload: { data: { [key]: cached } }, static: { data: {} } }
    const getCachedData = options?.getCachedData

    expect(getCachedData?.(key, nuxtApp, { cause: 'initial' })).toEqual(cached)
    expect(getCachedData?.(key, nuxtApp, { cause: 'watch' })).toBeUndefined()
    expect(getCachedData?.(key, nuxtApp, { cause: 'refresh:manual' })).toBeUndefined()
  })
})
