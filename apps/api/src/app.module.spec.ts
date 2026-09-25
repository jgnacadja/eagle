import { createHmac } from 'node:crypto'
import { adminThrottlerTracker, FailSafeThrottlerStorage } from './app.module'

const PASS_THROUGH = {
  totalHits: 1,
  timeToExpire: 60,
  isBlocked: false,
  timeToBlockExpire: 0
}

const ARGS = ['key', 60_000, 100, 60_000, 'default'] as const

describe('FailSafeThrottlerStorage', () => {
  it('passes through when the inner storage works', async () => {
    const inner = { increment: vi.fn().mockResolvedValue(PASS_THROUGH) }
    const storage = new FailSafeThrottlerStorage(inner)

    await expect(storage.increment(...ARGS)).resolves.toEqual(PASS_THROUGH)
    expect(inner.increment).toHaveBeenCalledOnce()
  })

  it('falls back to in-memory storage while Redis is down', async () => {
    const inner = { increment: vi.fn().mockRejectedValue(new Error('redis down')) }
    const storage = new FailSafeThrottlerStorage(inner)

    const record = await storage.increment(...ARGS)
    await storage.increment(...ARGS)

    expect(record.isBlocked).toBe(false)
    // Cooldown actif : on ne retente pas Redis à chaque requête.
    expect(inner.increment).toHaveBeenCalledOnce()
  })

  it('keeps enforcing limits via the in-memory fallback', async () => {
    const inner = { increment: vi.fn().mockRejectedValue(new Error('redis down')) }
    const storage = new FailSafeThrottlerStorage(inner)

    await storage.increment('key', 60_000, 1, 60_000, 'default')
    const second = await storage.increment('key', 60_000, 1, 60_000, 'default')

    expect(second.isBlocked).toBe(true)
  })

  it('switches back to Redis after the cooldown', async () => {
    vi.useFakeTimers()
    try {
      const inner = {
        increment: vi
          .fn()
          .mockRejectedValueOnce(new Error('redis down'))
          .mockResolvedValue(PASS_THROUGH)
      }
      const storage = new FailSafeThrottlerStorage(inner)

      await storage.increment(...ARGS)
      vi.advanceTimersByTime(31_000)
      const record = await storage.increment(...ARGS)

      expect(record).toEqual(PASS_THROUGH)
      expect(inner.increment).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('adminThrottlerTracker', () => {
  const adminApiKey = 'test-admin-key'
  const tracker = adminThrottlerTracker(adminApiKey)
  const request = (headers: Record<string, string | string[] | undefined>) => ({
    ip: '203.0.113.10',
    headers
  })

  it('tracks a valid API key on its own bucket via a fast hash', () => {
    const trackerKey = tracker(request({ 'x-api-key': adminApiKey }))

    expect(trackerKey).toBe(createHmac('sha256', adminApiKey).update(adminApiKey).digest('hex'))
    expect(trackerKey).not.toBe(adminApiKey)
  })

  it('tracks invalid keys on the shared IP bucket (key enumeration stays limited)', () => {
    expect(tracker(request({ 'x-api-key': 'wrong-key' }))).toBe('203.0.113.10')
    expect(tracker(request({ 'x-api-key': 'another-guess' }))).toBe('203.0.113.10')
  })

  it('tracks a missing key on the IP bucket', () => {
    expect(tracker(request({}))).toBe('203.0.113.10')
  })

  it('uses the first value of a repeated x-api-key header', () => {
    expect(tracker(request({ 'x-api-key': [adminApiKey, 'other'] }))).toBe(
      createHmac('sha256', adminApiKey).update(adminApiKey).digest('hex')
    )
  })
})
