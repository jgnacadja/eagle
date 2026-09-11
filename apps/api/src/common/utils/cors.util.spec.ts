import { makeCorsOrigin, toOriginMatcher } from './cors.util'

describe('toOriginMatcher', () => {
  it('returns the entry as-is when there is no wildcard', () => {
    expect(toOriginMatcher('https://example.com')).toBe('https://example.com')
  })

  it('creates a regex that matches a single wildcard subdomain', () => {
    const matcher = toOriginMatcher('https://*.vercel\u002Eapp')
    expect(matcher).toBeInstanceOf(RegExp)
    expect((matcher as RegExp).test('https://my-project-abc.vercel.app')).toBe(true)
    expect((matcher as RegExp).test('https://evil.vercel.app.other.com')).toBe(false)
  })

  it('escapes regex metacharacters in the origin', () => {
    const matcher = toOriginMatcher('https://*.example.com') as RegExp // lgtm[js/incomplete-hostname-regexp]
    expect(matcher.test('https://a.example.com')).toBe(true)
    expect(matcher.test('https://a.examplexcom')).toBe(false)
  })
})

describe('makeCorsOrigin', () => {
  it('allows requests with no origin', () => {
    const corsOrigin = makeCorsOrigin(['https://example.com'])
    const callback = vi.fn()
    corsOrigin(undefined, callback)
    expect(callback).toHaveBeenCalledWith(null, true)
  })

  it('allows a matching string origin', () => {
    const corsOrigin = makeCorsOrigin(['https://example.com'])
    const callback = vi.fn()
    corsOrigin('https://example.com', callback)
    expect(callback).toHaveBeenCalledWith(null, true)
  })

  it('allows a matching regex origin', () => {
    const corsOrigin = makeCorsOrigin([/^https:\/\/[^.]+\.example\.com$/])
    const callback = vi.fn()
    corsOrigin('https://sub.example.com', callback)
    expect(callback).toHaveBeenCalledWith(null, true)
  })

  it('rejects a non-matching origin', () => {
    const corsOrigin = makeCorsOrigin(['https://example.com'])
    const callback = vi.fn()
    corsOrigin('https://evil.com', callback)
    expect(callback).toHaveBeenCalledWith(null, false)
  })
})
