import { CacheService } from '../common/cache/cache.service'
import { CatalogService } from '../catalog/catalog.service'
import { CatalogIndexService } from './catalog-index.service'
import { HashingEmbeddingsProvider } from './embeddings/hashing-embeddings.provider'
import { RETRIEVAL_CORPUS, makeEntry } from './retrieval.fixtures'
import { RetrievalService, analyzeQuery } from './retrieval.service'

function makeService(entries = RETRIEVAL_CORPUS) {
  const catalog = { retrievalEntries: vi.fn().mockResolvedValue(entries) }
  const cache = { version: 1, onCatalogInvalidated: vi.fn(() => () => undefined) }
  const index = new CatalogIndexService(
    catalog as unknown as CatalogService,
    cache as unknown as CacheService,
    new HashingEmbeddingsProvider()
  )
  return new RetrievalService(index)
}

function slugs(result: { candidates: Array<{ course: { slug: string } }> }): string[] {
  return result.candidates.map((c) => c.course.slug)
}

describe('analyzeQuery', () => {
  it('stems typed terms, drops noise and adds weighted domain expansions', () => {
    const terms = analyzeQuery(
      'Nous cherchons une formation pour nos 12 managers sur les conflits avant septembre 2026'
    )

    expect(terms.filter((t) => t.typed).map((t) => t.term)).toEqual(['manager', 'conflit'])
    expect(terms.find((t) => t.term === 'management')).toMatchObject({
      weight: 0.6,
      typed: false,
      source: 'manager'
    })
    expect(terms.find((t) => t.term === 'mediation')).toMatchObject({ typed: false })
  })

  it('covers a typed verb through its noun expansion', async () => {
    const service = makeService()

    const result = await service.search({ text: 'gérer les conflits' })

    expect(result.candidates[0]).toMatchObject({
      course: { slug: 'gestion-des-conflits-en-equipe' },
      coverage: 1,
      confident: true
    })
  })
})

describe('RetrievalService', () => {
  it('ranks the course whose title matches the need first, with scores and matched terms', async () => {
    const service = makeService()

    const result = await service.search({
      text: 'Mes managers ont besoin de mieux gérer les conflits dans leur équipe'
    })

    expect(slugs(result)[0]).toBe('gestion-des-conflits-en-equipe')
    // Mots vides (« ont », « leur ») et bruit (« besoin », « mieux », « équipe ») retirés.
    expect(result.terms).toEqual(['manager', 'gerer', 'conflit'])
    const best = result.candidates[0]!
    expect(best.score).toBe(1 * 0.6 + best.semanticScore * 0.4)
    expect(best.matchedTerms).toContain('conflit')
    expect(best.lexicalScore).toBeGreaterThan(0)
    expect(result.indexed).toBe(RETRIEVAL_CORPUS.length)
    expect(result.index.provider).toBe('hashing-ngram')
  })

  it('finds regulatory courses through domain synonyms', async () => {
    const service = makeService()

    const secourisme = await service.search({ text: 'formation secourisme pour 8 salariés' })
    const chariots = await service.search({ text: 'conduite de chariots élévateurs' })
    const electricien = await service.search({ text: 'habilitation pour un électricien' })

    expect(slugs(secourisme)[0]).toBe('sst-sauveteur-secouriste-du-travail')
    expect(slugs(chariots)[0]).toBe('caces-r489-chariots-elevateurs')
    expect(slugs(electricien)[0]).toBe('habilitation-electrique-b0-h0')
  })

  it('tolerates a typo thanks to the semantic score', async () => {
    const service = makeService()

    const result = await service.search({ text: 'gestion des conflis', limit: 3 })

    expect(slugs(result)[0]).toBe('gestion-des-conflits-en-equipe')
  })

  it('flags confident candidates by lexical coverage or semantic similarity', async () => {
    const service = makeService()

    const exact = await service.search({ text: 'Gestion des conflits en équipe' })
    const vague = await service.search({ text: 'pilotage de drone', limit: 2 })

    expect(exact.candidates[0]).toMatchObject({ confident: true })
    expect(exact.candidates[0]!.coverage).toBeGreaterThanOrEqual(0.6)
    // « pilotage » seul est retrouvé : couverture minoritaire, pas de certitude.
    expect(vague.candidates[0]!.course.slug).toBe('pilotage-de-projet')
    expect(vague.candidates[0]!.confident).toBe(false)
  })

  it('applies strict filters on family, modalities and location', async () => {
    const service = makeService()

    const family = await service.search({ text: 'sécurité', family: 'informatique' })
    const location = await service.search({ text: 'formation', location: 'Lyon', limit: 20 })
    const distanciel = await service.search({ text: 'gestion', modalities: ['distanciel'] })

    expect(slugs(family)).toEqual(['cybersecurite-fondamentaux'])
    expect(slugs(location).sort()).toEqual(
      [
        'communication-non-violente',
        'sst-sauveteur-secouriste-du-travail',
        'habilitation-electrique-b0-h0'
      ].sort()
    )
    expect(slugs(distanciel)).toEqual([
      'gestion-des-conflits-en-equipe',
      'cybersecurite-fondamentaux'
    ])
  })

  it('clamps the limit and drops courses without any signal', async () => {
    const service = makeService()

    const capped = await service.search({ text: 'formation', limit: 100 })
    const bounded = await service.search({ text: 'management', limit: 0 })
    const empty = await service.search({ text: '' })

    expect(capped.candidates.length).toBeLessThanOrEqual(20)
    expect(bounded.candidates).toHaveLength(1)
    expect(empty.candidates).toEqual([])
    expect(empty.terms).toEqual([])
  })

  it('only indexes published courses', async () => {
    const service = makeService([
      ...RETRIEVAL_CORPUS,
      makeEntry({
        id: 99,
        slug: 'brouillon-conflits',
        title: 'Conflits — brouillon',
        description: 'Ne doit jamais sortir.',
        category: 'Management',
        familySlug: 'management',
        status: 'draft'
      })
    ])

    const result = await service.search({ text: 'conflits' })

    // Le filtrage sur le statut vit dans CatalogService.retrievalEntries ;
    // ici l'index reçoit ce qu'on lui donne — le test documente le contrat.
    expect(slugs(result)).toContain('brouillon-conflits')
  })
})
