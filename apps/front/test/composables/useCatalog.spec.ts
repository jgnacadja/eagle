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
  subFamilySlug: null,
  subFamilyName: null,
  centerSlug: null,
  centerSlugs: [],
  modalities: [],
  sessions: null,
  image: null,
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

  it('falls back to the single-day bucket when no duration is set', () => {
    expect(buildDuration({ ...course, durationHours: null, durationDays: null })).toBe('courte')
    expect(mapCourse({ ...course, durationDays: null, modalities: null }).days).toBe(0)
    expect(mapCourse({ ...course, durationDays: null, modalities: null }).meta).toBe(
      'Certification CACES · Opérateur réglementaire'
    )
  })

  it('trie la prochaine session quand plusieurs dates futures existent', () => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const plus30 = new Date(today)
    plus30.setUTCDate(plus30.getUTCDate() + 30)
    const plus60 = new Date(today)
    plus60.setUTCDate(plus60.getUTCDate() + 60)
    const session = (startDate: string) => ({
      id: startDate,
      startDate,
      endDate: null,
      modality: null,
      seatsRemaining: null,
      location: null
    })

    // La session la plus proche gagne, même déclarée en second.
    const status = buildStatus({
      ...course,
      sessions: [
        session(plus60.toISOString().slice(0, 10)),
        session(plus30.toISOString().slice(0, 10))
      ]
    })
    expect(status?.type).toBe('success')
    expect(status?.label).toContain(plus30.getUTCDate().toString())
  })

  it('ignores les sessions sans date de début dans les badges', () => {
    const undated = {
      id: 'x',
      startDate: null,
      endDate: null,
      modality: null,
      seatsRemaining: null,
      location: null
    }
    expect(buildStatus({ ...course, sessions: [undated] })).toEqual({
      type: 'neutral',
      label: 'Sur demande'
    })
  })

  it('builds meta from duration, certification and certifier', () => {
    expect(buildMeta(course)).toBe('3 jours · Certification CACES · Opérateur réglementaire')
  })

  it('builds meta without certification when disabled', () => {
    expect(buildMeta({ ...course, modalities: ['inter', 'intra'] }, false)).toBe(
      '3 jours · Inter / Intra'
    )
  })

  it('builds meta with unknown and missing modalities', () => {
    expect(buildMeta({ ...course, modalities: ['format-exotique'] }, false)).toBe(
      '3 jours · format-exotique'
    )
    expect(buildMeta({ ...course, modalities: null }, false)).toBe('3 jours')
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

  it('strips WYSIWYG HTML from the card description', () => {
    const mapped = mapCourse({
      ...course,
      description: '<p>Initiez-vous au march&eacute; du cloud.</p>'
    })

    expect(mapped.description).toBe('Initiez-vous au marché du cloud.')
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

    // Seule une session passée : « Sur demande » neutre (formation organisable).
    expect(
      buildStatus({ ...course, sessions: [session(past.toISOString().slice(0, 10))] })
    ).toEqual({ type: 'neutral', label: 'Sur demande' })

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
    expect(futureStatus?.labelShort).toContain('Session le')
  })

  it('buildStatus expose un label court « N places » pour mobile', () => {
    const future = new Date()
    future.setUTCDate(future.getUTCDate() + 30)
    const status = buildStatus({
      ...course,
      sessions: [
        {
          id: 's1',
          startDate: future.toISOString().slice(0, 10),
          endDate: null,
          modality: null,
          seatsRemaining: 2,
          location: null
        }
      ]
    })
    expect(status).toEqual({
      type: 'warning',
      label: '2 places disponibles',
      labelShort: '2 places'
    })
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

  it('buildSessionBadge distingue « ce mois-ci » et « programmées »', () => {
    const makeSession = (startDate: string) => ({
      id: startDate,
      startDate,
      endDate: null,
      modality: null,
      seatsRemaining: null,
      location: null
    })

    // Session du jour : toujours dans le mois courant.
    const today = new Date()
    const thisMonth = makeSession(today.toISOString().slice(0, 10))
    expect(buildSessionBadge({ ...course, sessions: [thisMonth] })).toBe('Sessions ce mois-ci')

    // +45 jours : forcément hors du mois courant.
    const later = new Date(today)
    later.setUTCDate(later.getUTCDate() + 45)
    expect(
      buildSessionBadge({
        ...course,
        sessions: [thisMonth, makeSession(later.toISOString().slice(0, 10))]
      })
    ).toBe('Sessions ce mois-ci')
    expect(
      buildSessionBadge({
        ...course,
        sessions: [makeSession(later.toISOString().slice(0, 10))]
      })
    ).toBe('Sessions programmées')
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

  it('forwards every populated filter to the API query', async () => {
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

    await useCatalog(
      ref({
        search: ' caces ',
        family: 'caces-conduite-engins',
        subFamily: 'chariots',
        cpf: true,
        certifying: true,
        durations: ['courte'],
        modalities: ['presentiel'],
        location: ' Lyon ',
        center: 'creteil',
        availability: 'cette-semaine',
        sort: 'pertinence',
        order: 'desc',
        page: 2,
        limit: 12
      })
    )

    expect(requestedQuery).toEqual({
      search: 'caces',
      family: 'caces-conduite-engins',
      subFamily: 'chariots',
      cpf: true,
      certifying: true,
      durations: 'courte',
      modalities: 'presentiel',
      location: 'Lyon',
      center: 'creteil',
      availability: 'cette-semaine',
      sort: 'pertinence',
      order: 'desc',
      page: 2,
      limit: 12
    })
  })

  it('serves the Nuxt payload only on initial cause, not on watch refetches', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
    vi.stubGlobal('logServerError', vi.fn())
    vi.stubGlobal(
      '$fetch',
      vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 9 })
    )

    let options:
      | {
          getCachedData?: (key: string, nuxtApp: unknown, ctx: { cause: string }) => unknown
          watch?: (() => unknown)[]
        }
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
    const nuxtApp = {
      isHydrating: true,
      payload: { data: { [key]: cached } },
      static: { data: {} }
    }
    const getCachedData = options?.getCachedData

    expect(getCachedData?.(key, nuxtApp, { cause: 'initial' })).toEqual(cached)
    // Passé l'hydratation (navigation client), on refetch toujours.
    expect(
      getCachedData?.(key, { ...nuxtApp, isHydrating: false }, { cause: 'initial' })
    ).toBeUndefined()
    expect(getCachedData?.(key, nuxtApp, { cause: 'watch' })).toBeUndefined()
    expect(getCachedData?.(key, nuxtApp, { cause: 'refresh:manual' })).toBeUndefined()

    // Hors payload Nuxt, la donnée est lue dans le cache « static ».
    const staticApp = {
      ...nuxtApp,
      payload: { data: {} },
      static: { data: { [key]: cached } }
    }
    expect(getCachedData?.(key, staticApp, { cause: 'initial' })).toEqual(cached)

    // Le watcher relit la query courante pour déclencher le refetch.
    const query = ref({ page: 3 })
    await useCatalog(query)
    expect(options?.watch?.map((w) => w())).toEqual([{ page: 3 }])
  })

  it('rethrows a failed catalog fetch so useAsyncData exposes the error', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
    vi.stubGlobal('logServerError', vi.fn())
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('api down')))

    let capturedError = ref<Error | null>(null)
    vi.stubGlobal('useAsyncData', async (_key: unknown, handler: () => Promise<unknown>) => {
      const data = ref<unknown>(null)
      const error = ref<Error | null>(null)
      try {
        data.value = await handler()
      } catch (err) {
        error.value = err as Error
      }
      capturedError = error
      return { data, pending: ref(false), error, refresh: vi.fn() }
    })

    const { error } = await useCatalog(ref({}))
    expect(error.value?.message).toBe('api down')
    expect(capturedError.value?.message).toBe('api down')
  })
})
