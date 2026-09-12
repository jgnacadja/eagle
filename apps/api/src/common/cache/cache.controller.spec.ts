import { describe, expect, it, vi } from 'vitest'
import { CacheController } from './cache.controller'
import type { CacheService } from './cache.service'

describe('CacheController', () => {
  const cache = {
    invalidateCatalog: vi.fn().mockResolvedValue(undefined),
    invalidatePatterns: vi.fn().mockResolvedValue(undefined)
  } as unknown as CacheService
  const controller = new CacheController(cache)

  beforeEach(() => {
    vi.mocked(cache.invalidateCatalog).mockClear()
    vi.mocked(cache.invalidatePatterns).mockClear()
  })

  it('invalide tout le catalogue sans collection précisée', async () => {
    await expect(controller.invalidate()).resolves.toEqual({ success: true, purged: true })
    expect(cache.invalidateCatalog).toHaveBeenCalledOnce()
    expect(cache.invalidatePatterns).not.toHaveBeenCalled()
  })

  it('ne purge que les clés formations', async () => {
    await expect(controller.invalidate({ collection: 'formations' })).resolves.toEqual({
      success: true,
      purged: true
    })
    expect(cache.invalidatePatterns).toHaveBeenCalledWith(['formations:all', 'courses:*'])
    expect(cache.invalidateCatalog).not.toHaveBeenCalled()
  })

  it('purge aussi les centres quand un centre change', async () => {
    await expect(controller.invalidate({ collection: 'centres' })).resolves.toEqual({
      success: true,
      purged: true
    })
    expect(cache.invalidatePatterns).toHaveBeenCalledWith([
      'centres:*',
      'formations:all',
      'courses:*'
    ])
  })

  it('ignore les collections hors catalogue', async () => {
    await expect(controller.invalidate({ collection: 'articles' })).resolves.toEqual({
      success: true,
      purged: false
    })
    expect(cache.invalidateCatalog).not.toHaveBeenCalled()
    expect(cache.invalidatePatterns).not.toHaveBeenCalled()
  })
})
