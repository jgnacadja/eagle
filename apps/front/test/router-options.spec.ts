import { describe, expect, it, vi } from 'vitest'
import routerConfig from '~/router.options'

const hookOnceMock = vi.fn((_event: string, cb: () => void) => cb())
vi.stubGlobal('useNuxtApp', () => ({ hooks: { hookOnce: hookOnceMock } }))

const scroll = (
  to: { hash: string; path: string },
  from: { hash: string; path: string },
  savedPosition: { top: number; left: number } | null = null
) => routerConfig.scrollBehavior!(to as never, from as never, savedPosition)

describe('router.options scrollBehavior', () => {
  it('restaure la position sauvegardée pour une ancre même-page (back)', async () => {
    await expect(
      scroll({ hash: '#s', path: '/a' }, { hash: '', path: '/a' }, { top: 120, left: 0 })
    ).resolves.toEqual({ top: 120, left: 0, behavior: 'instant' })
    expect(hookOnceMock).not.toHaveBeenCalled()
  })

  it('cible l’ancre en smooth pour une ancre même-page sans position', async () => {
    await expect(scroll({ hash: '#s', path: '/a' }, { hash: '', path: '/a' })).resolves.toEqual({
      el: '#s',
      behavior: 'smooth'
    })
    expect(hookOnceMock).not.toHaveBeenCalled()
  })

  it('attend page:finish et cible l’ancre sur une nouvelle page', async () => {
    await expect(scroll({ hash: '#s', path: '/b' }, { hash: '', path: '/a' })).resolves.toEqual({
      el: '#s',
      behavior: 'smooth'
    })
    expect(hookOnceMock).toHaveBeenCalledWith('page:finish', expect.any(Function))
  })

  it('restaure la position sauvegardée après page:finish (back)', async () => {
    await expect(
      scroll({ hash: '', path: '/b' }, { hash: '', path: '/a' }, { top: 50, left: 0 })
    ).resolves.toEqual({ top: 50, left: 0, behavior: 'instant' })
  })

  it('remonte en haut instantanément sur une nouvelle page', async () => {
    await expect(scroll({ hash: '', path: '/b' }, { hash: '', path: '/a' })).resolves.toEqual({
      top: 0,
      left: 0,
      behavior: 'instant'
    })
  })
})
