import { HashingEmbeddingsProvider, cosine, l2Normalize } from './hashing-embeddings.provider'

describe('HashingEmbeddingsProvider', () => {
  const provider = new HashingEmbeddingsProvider()

  it('is deterministic and produces unit vectors of a fixed dimension', async () => {
    const [first, second] = await provider.embed(['Gestion des conflits', 'Gestion des conflits'])

    expect(first).toHaveLength(384)
    expect(first).toEqual(second)
    const norm = Math.sqrt(first!.reduce((sum, v) => sum + v * v, 0))
    expect(norm).toBeCloseTo(1, 6)
  })

  it('brings lexical variants closer than unrelated texts', async () => {
    const [query, variant, unrelated] = await provider.embed([
      'gérer les conflits en équipe',
      'Gestion des conflits en équipe',
      'Cloud AWS : fondamentaux'
    ])

    expect(cosine(query!, variant!)).toBeGreaterThan(cosine(query!, unrelated!))
    expect(cosine(query!, variant!)).toBeGreaterThan(0.3)
  })

  it('tolerates typos through character n-grams', async () => {
    const [typo, exact, other] = await provider.embed([
      'gestion des conflis',
      'Gestion des conflits en équipe',
      'Comptabilité de gestion'
    ])

    expect(cosine(typo!, exact!)).toBeGreaterThan(cosine(typo!, other!))
  })

  it('returns an all-zero vector for empty text and clamps cosine', () => {
    const empty = provider.vectorize('')
    expect(empty.every((v) => v === 0)).toBe(true)
    expect(cosine(empty, provider.vectorize('sst'))).toBe(0)
    expect(cosine([1, 0], [1])).toBe(0)
    expect(cosine([-1, 0], [1, 0])).toBe(0)
    expect(l2Normalize([0, 0])).toEqual([0, 0])
    expect(l2Normalize([3, 4])).toEqual([0.6, 0.8])
  })
})
