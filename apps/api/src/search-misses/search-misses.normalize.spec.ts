import { coarseLocation, normalizeQuery, sanitizeContext } from './search-misses.normalize'

describe('normalizeQuery', () => {
  it('lowercases, strips accents and punctuation', () => {
    expect(normalizeQuery('  Éléctricien : habilitation B2V, à Lyon !')).toBe(
      'electricien habilitation b2v a lyon'
    )
  })
})

describe('coarseLocation', () => {
  it('rounds geographic points to one decimal and leaves text alone', () => {
    expect(coarseLocation('45.76421, 4.83559')).toBe('45.8,4.8')
    expect(coarseLocation('-12.3456,178.9')).toBe('-12.3,178.9')
    expect(coarseLocation('Lyon (69)')).toBe('Lyon (69)')
  })
})

describe('sanitizeContext', () => {
  it('returns null for an empty or missing context', () => {
    expect(sanitizeContext(undefined)).toBeNull()
    expect(sanitizeContext(null)).toBeNull()
    expect(sanitizeContext({ empty: '', nested: { a: 1 }, list: [1] })).toBeNull()
  })

  it('keeps primitive values and degrades the location', () => {
    expect(
      sanitizeContext({
        family: 'securite',
        cpf: true,
        page: 2,
        none: null,
        location: '48.85,2.35'
      })
    ).toEqual({ family: 'securite', cpf: true, page: 2, none: null, location: '48.9,2.4' })
  })
})
