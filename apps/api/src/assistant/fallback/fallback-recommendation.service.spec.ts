import { CacheService } from '../../common/cache/cache.service'
import { CatalogService } from '../../catalog/catalog.service'
import { CatalogIndexService } from '../../retrieval/catalog-index.service'
import { HashingEmbeddingsProvider } from '../../retrieval/embeddings/hashing-embeddings.provider'
import { RETRIEVAL_CORPUS } from '../../retrieval/retrieval.fixtures'
import { RetrievalService } from '../../retrieval/retrieval.service'
import { SearchMissesService } from '../../search-misses/search-misses.service'
import { ASSISTANT_NOTICE, SOURCE_MENTION } from '../guardrails/wording.guardrails'
import { FallbackRecommendationService } from './fallback-recommendation.service'

const NOW = new Date('2026-09-25T12:00:00.000Z')

function makeService(entries = RETRIEVAL_CORPUS) {
  const catalog = { retrievalEntries: vi.fn().mockResolvedValue(entries) }
  const cache = { version: 1, onCatalogInvalidated: vi.fn(() => () => undefined) }
  const index = new CatalogIndexService(
    catalog as unknown as CatalogService,
    cache as unknown as CacheService,
    new HashingEmbeddingsProvider()
  )
  const searchMisses = { record: vi.fn().mockResolvedValue(true) }
  const service = new FallbackRecommendationService(
    new RetrievalService(index),
    searchMisses as unknown as SearchMissesService
  )
  return { service, searchMisses }
}

describe('FallbackRecommendationService', () => {
  it('recommends 1 principal + up to 2 alternatives with conditional wording and the source', async () => {
    const { service, searchMisses } = makeService()

    const answer = await service.recommend(
      { text: 'Mes managers doivent mieux gérer les conflits dans leurs équipes' },
      NOW
    )

    expect(answer.mode).toBe('fallback')
    expect(answer.notice).toBe(ASSISTANT_NOTICE)
    // Mots vides et bruit (« doivent », « mieux », « équipes ») retirés.
    expect(answer.intent).toBe('manager gerer conflit')
    expect(answer.outcome.kind).toBe('recommendations')
    if (answer.outcome.kind !== 'recommendations') return
    const { principal, alternatives, source } = answer.outcome.recommendations
    expect(principal.course).toEqual({
      title: 'Gestion des conflits en équipe',
      slug: 'gestion-des-conflits-en-equipe',
      familySlug: 'management'
    })
    expect(principal.justification).toMatch(
      /^Cette formation semble correspondre à votre besoin : elle reprend « /
    )
    expect(principal.attributes).toEqual(['2 jours', 'Inter / Présentiel / Distanciel'])
    expect(principal.availability).toBeNull()
    expect(alternatives.length).toBeLessThanOrEqual(2)
    for (const alternative of alternatives) {
      expect(alternative.justification).toMatch(/^Semble pertinente/)
      expect(alternative.course.slug).not.toBe(principal.course.slug)
    }
    expect(source).toBe(SOURCE_MENTION)
    expect(searchMisses.record).not.toHaveBeenCalled()
  })

  it('answers « aucun résultat » on a weak match and logs the miss', async () => {
    const { service, searchMisses } = makeService()

    const answer = await service.recommend({ text: 'pilotage de drone', location: 'Créteil' }, NOW)

    expect(answer.outcome).toEqual({ kind: 'no-result' })
    expect(searchMisses.record).toHaveBeenCalledWith({
      query: 'pilotage de drone',
      outcome: 'no_result',
      source: 'assistant',
      intent: 'pilotage drone',
      context: { mode: 'fallback', location: 'Créteil' }
    })
  })

  it('answers « hors catalogue » without any candidate and logs the miss', async () => {
    const { service, searchMisses } = makeService()

    const answer = await service.recommend({ text: 'xylophone' }, NOW)

    expect(answer.outcome).toEqual({ kind: 'out-of-catalog' })
    expect(answer.intent).toBe('xylophone')
    expect(searchMisses.record).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'out_of_catalog',
        context: { mode: 'fallback', location: null }
      })
    )
  })

  it('keeps an empty intent when the query only carries noise', async () => {
    const { service } = makeService()

    const answer = await service.recommend({ text: 'une formation pour nos salariés' }, NOW)

    expect(answer.intent).toBeNull()
  })

  it('exposes the real availability of the principal recommendation', async () => {
    const withSession = RETRIEVAL_CORPUS.map((entry) =>
      entry.course.slug === 'sst-sauveteur-secouriste-du-travail'
        ? {
            ...entry,
            course: {
              ...entry.course,
              sessions: [
                {
                  id: 's1',
                  startDate: '2026-10-05',
                  endDate: null,
                  modality: 'presentiel',
                  seatsRemaining: 2,
                  location: {
                    name: 'Centre LEARN UP de Créteil',
                    city: 'Créteil',
                    postalCode: '94000',
                    department: null,
                    region: null,
                    centreSlug: 'creteil'
                  }
                }
              ]
            }
          }
        : entry
    )
    const { service } = makeService(withSession)

    const answer = await service.recommend({ text: 'formation SST à Créteil pour 8 salariés' }, NOW)

    expect(answer.outcome.kind).toBe('recommendations')
    if (answer.outcome.kind !== 'recommendations') return
    expect(answer.outcome.recommendations.principal.availability).toEqual({
      centre: 'Centre LEARN UP de Créteil',
      nextSession: '2026-10-05',
      seats: 'limited',
      modality: 'presentiel'
    })
  })
})
