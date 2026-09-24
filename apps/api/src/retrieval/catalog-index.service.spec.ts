import { CacheService } from '../common/cache/cache.service'
import { CatalogService } from '../catalog/catalog.service'
import { CatalogIndexService, documentText } from './catalog-index.service'
import { HashingEmbeddingsProvider } from './embeddings/hashing-embeddings.provider'
import { RETRIEVAL_CORPUS, makeEntry } from './retrieval.fixtures'
import type { EmbeddingsProvider } from './retrieval.types'

type Listener = () => void

function fakeCache(version = 3) {
  const listeners = new Set<Listener>()
  return {
    version,
    listeners,
    onCatalogInvalidated: vi.fn((listener: Listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }),
    fire: () => listeners.forEach((listener) => listener())
  }
}

function fakeCatalog(entries = RETRIEVAL_CORPUS) {
  return { retrievalEntries: vi.fn().mockResolvedValue(entries) }
}

function makeService(
  catalog = fakeCatalog(),
  cache = fakeCache(),
  provider: EmbeddingsProvider = new HashingEmbeddingsProvider()
) {
  const service = new CatalogIndexService(
    catalog as unknown as CatalogService,
    cache as unknown as CacheService,
    provider
  )
  return { service, catalog, cache }
}

describe('CatalogIndexService', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('builds weighted terms, document frequencies and vectors from the published catalogue', async () => {
    const { service, cache } = makeService()

    const index = await service.getIndex()

    expect(index.documents).toHaveLength(RETRIEVAL_CORPUS.length)
    expect(index.info).toMatchObject({
      version: cache.version,
      provider: 'hashing-ngram',
      degraded: false,
      documents: RETRIEVAL_CORPUS.length
    })
    const conflits = index.documents.find(
      (d) => d.course.slug === 'gestion-des-conflits-en-equipe'
    )!
    // Titre pondéré 3 + catégorie « Management » 2 + description 1.
    expect(conflits.terms.get('conflit')).toBe(4)
    expect(conflits.terms.get('management')).toBe(2)
    expect(conflits.terms.get('marseille')).toBe(1)
    expect(conflits.vector).toHaveLength(384)
    expect(index.documentFrequency.get('management')).toBe(3)
    expect(index.averageLength).toBeGreaterThan(0)
  })

  it('reuses the index while fresh and rebuilds on catalogue invalidation or version change', async () => {
    const { service, catalog, cache } = makeService()

    await service.getIndex()
    await service.getIndex()
    expect(catalog.retrievalEntries).toHaveBeenCalledTimes(1)

    cache.fire()
    await service.getIndex()
    expect(catalog.retrievalEntries).toHaveBeenCalledTimes(2)

    cache.version = 4
    await service.getIndex()
    expect(catalog.retrievalEntries).toHaveBeenCalledTimes(3)
  })

  it('rebuilds after the maximum age', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-25T10:00:00.000Z'))
    const { service, catalog } = makeService()

    await service.getIndex()
    vi.setSystemTime(new Date('2026-09-25T10:16:00.000Z'))
    await service.getIndex()

    expect(catalog.retrievalEntries).toHaveBeenCalledTimes(2)
  })

  it('never freezes an empty catalogue', async () => {
    const catalog = fakeCatalog([])
    const { service } = makeService(catalog)

    await service.getIndex()
    await service.getIndex()

    expect(catalog.retrievalEntries).toHaveBeenCalledTimes(2)
    expect(service.info.documents).toBe(0)
  })

  it('deduplicates concurrent rebuilds', async () => {
    const { service, catalog } = makeService()

    await Promise.all([service.rebuild(), service.rebuild(), service.getIndex()])

    expect(catalog.retrievalEntries).toHaveBeenCalledTimes(1)
  })

  it('falls back to the local provider when the configured one fails, for documents and queries', async () => {
    const failing: EmbeddingsProvider = {
      name: 'http:test',
      embed: vi.fn().mockRejectedValue(new Error('down'))
    }
    const { service } = makeService(fakeCatalog(), fakeCache(), failing)

    const index = await service.getIndex()
    const vector = await service.embedQuery('sst')

    expect(index.info).toMatchObject({ provider: 'hashing-ngram', degraded: true })
    expect(vector).toHaveLength(384)
    expect(failing.embed).toHaveBeenCalledTimes(1)
  })

  it('uses the configured provider for queries when healthy', async () => {
    const remote: EmbeddingsProvider = {
      name: 'http:test',
      embed: vi.fn(async (texts: string[]) => texts.map(() => [1, 0, 0]))
    }
    const { service } = makeService(fakeCatalog(), fakeCache(), remote)

    await service.getIndex()
    await expect(service.embedQuery('sst')).resolves.toEqual([1, 0, 0])
  })

  it('propagates a failure of the local provider itself', async () => {
    const local = new HashingEmbeddingsProvider()
    vi.spyOn(local, 'embed').mockRejectedValue(new Error('boom'))
    const service = new CatalogIndexService(
      fakeCatalog() as unknown as CatalogService,
      fakeCache() as unknown as CacheService,
      local
    )
    Reflect.set(service, 'fallback', local)

    await expect(service.getIndex()).rejects.toThrow('boom')
  })

  it('unsubscribes from cache invalidations on destroy', async () => {
    const { service, cache, catalog } = makeService()
    await service.getIndex()

    service.onModuleDestroy()
    cache.fire()
    await service.getIndex()

    expect(catalog.retrievalEntries).toHaveBeenCalledTimes(1)
  })

  it('describes a course with its classification, modalities and locations', () => {
    const entry = makeEntry({
      id: 9,
      slug: 'x',
      title: 'Titre',
      description: 'Desc <b>html</b>',
      category: 'Cat',
      familySlug: 'cat',
      modalities: ['presentiel', 'inconnue'],
      cities: ['Lyon']
    })

    expect(documentText(entry.course, entry.locationText)).toBe(
      'Titre. Cat. Desc html. présentiel en centre inconnue. lyon'
    )
  })
})
