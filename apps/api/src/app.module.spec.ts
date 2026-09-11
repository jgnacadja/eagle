import { FailSafeThrottlerStorage } from './app.module'

const PASS_THROUGH = {
  totalHits: 1,
  timeToExpire: 60,
  isBlocked: false,
  timeToBlockExpire: 0
}

const FALLBACK = {
  totalHits: 0,
  timeToExpire: 0,
  isBlocked: false,
  timeToBlockExpire: 0
}

describe('FailSafeThrottlerStorage', () => {
  it('passes through when the inner storage works', async () => {
    const inner = { increment: vi.fn().mockResolvedValue(PASS_THROUGH) }
    const storage = new FailSafeThrottlerStorage(inner)

    await expect(storage.increment('key', 60_000, 100, 60_000, 'default')).resolves.toEqual(
      PASS_THROUGH
    )
    expect(inner.increment).toHaveBeenCalledOnce()
  })

  it('degrades gracefully when the inner storage fails', async () => {
    const inner = { increment: vi.fn().mockRejectedValue(new Error('redis down')) }
    const storage = new FailSafeThrottlerStorage(inner)

    await expect(storage.increment('key', 60_000, 100, 60_000, 'default')).resolves.toEqual(
      FALLBACK
    )
    await expect(storage.increment('key', 60_000, 100, 60_000, 'default')).resolves.toEqual(
      FALLBACK
    )
    expect(inner.increment).toHaveBeenCalledOnce()
  })
})
