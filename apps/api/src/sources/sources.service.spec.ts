import { inspect } from 'node:util'
import { Logger, ServiceUnavailableException } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CacheService } from '../common/cache/cache.service'
import type { DirectusItemsClient } from '../directus/directus.items.client'
import { encryptSecret } from './sources.crypto'
import { SourcesService } from './sources.service'

const KEY = Buffer.alloc(32, 7)
const ENV: Record<string, string> = {
  SOURCES_ENC_KEY: KEY.toString('base64'),
  DIGIFORMA_API_URL: 'https://env.digiforma/graphql',
  DIGIFORMA_API_KEY: 'env-digi-key',
  HUBSPOT_PORTAL_ID: 'env-portal',
  HUBSPOT_FORM_NEWSLETTER: 'env-news',
  HUBSPOT_FORM_DEMANDE: 'env-demande',
  HUBSPOT_FORM_CANDIDATURE: 'env-cand',
  HUBSPOT_FORM_CONSEILLER: 'env-conseiller',
  HUBSPOT_FORM_RAPPEL: 'env-rappel'
}

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'uuid-lyon',
  code: 'lyon',
  name: 'Lyon',
  is_hq: false,
  status: 'active',
  digiforma_api_url: 'https://lyon.digiforma/graphql',
  digiforma_api_key: encryptSecret('lyon-key', KEY),
  hubspot_portal_id: 'portal-lyon',
  hubspot_token: null,
  hubspot_form_newsletter: null,
  hubspot_form_demande: 'lyon-demande',
  hubspot_form_candidature: null,
  hubspot_form_conseiller: 'lyon-conseiller',
  hubspot_form_rappel: 'lyon-rappel',
  ...overrides
})

const loggedText = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.flat().join(' ')

describe('SourcesService', () => {
  let rows: ReturnType<typeof row>[]
  let readMany: ReturnType<typeof vi.fn>
  let cache: { setScopeProvider: ReturnType<typeof vi.fn> }
  let env: Record<string, string>
  let service: SourcesService
  let warn: ReturnType<typeof vi.spyOn>
  let error: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
    error = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
    rows = []
    env = { ...ENV }
    readMany = vi.fn(async () => ({ data: rows }))
    cache = { setScopeProvider: vi.fn() }
    const config = { get: (name: string) => env[name] } as unknown as ConfigService
    service = new SourcesService(
      config,
      { readMany } as unknown as DirectusItemsClient,
      cache as unknown as CacheService
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('env fallback (CA4)', () => {
    it('builds an HQ source from env when no source exists', async () => {
      const [hq] = await service.listActive()
      expect(hq).toMatchObject({
        id: 'env',
        code: 'hq',
        isHq: true,
        fromEnv: true,
        status: 'active',
        digiforma: { apiUrl: 'https://env.digiforma/graphql' },
        hubspot: { portalId: 'env-portal' }
      })
      expect(hq.hubspot.forms.rappel).toBe('env-rappel')
      expect(hq.secrets.digiformaApiKey).toBe('env-digi-key')
      expect(await service.getHq()).toMatchObject({ fromEnv: true })
    })

    it('falls back to env when every source is inactive', async () => {
      rows = [row({ status: 'inactive' })]
      const active = await service.listActive()
      expect(active).toHaveLength(1)
      expect(active[0].fromEnv).toBe(true)
    })

    it('fills the HQ gaps from env (HQ without key)', async () => {
      rows = [
        row({
          id: 'uuid-hq',
          code: 'hq',
          is_hq: true,
          digiforma_api_url: null,
          digiforma_api_key: null,
          hubspot_portal_id: null,
          hubspot_form_demande: null
        })
      ]
      const hq = await service.getHq()
      expect(hq).toMatchObject({ id: 'uuid-hq', fromEnv: false })
      expect(hq.secrets.digiformaApiKey).toBe('env-digi-key')
      expect(hq.digiforma.apiUrl).toBe('https://env.digiforma/graphql')
      expect(hq.hubspot.portalId).toBe('env-portal')
      expect(hq.hubspot.forms.demande).toBe('env-demande')
    })

    it('does not fill a franchise from env', async () => {
      rows = [row({ digiforma_api_key: null, hubspot_form_newsletter: null })]
      const [lyon] = await service.listActive()
      expect(lyon.secrets.digiformaApiKey).toBe('')
      expect(lyon.hubspot.forms.newsletter).toBeNull()
    })

    it('serves the stale cache when Directus fails after a first read', async () => {
      rows = [row()]
      await service.listActive()
      vi.advanceTimersByTime(61_000)
      readMany.mockRejectedValueOnce(new Error('boom'))
      const [lyon] = await service.listActive()
      expect(lyon.code).toBe('lyon')
    })
  })

  describe('unreadable configuration (fail closed)', () => {
    it('does not mistake a failed read for « no source » (no env fallback)', async () => {
      readMany.mockRejectedValue(new Error('Directus GET failed: 503'))

      await expect(service.listActive()).rejects.toBeInstanceOf(ServiceUnavailableException)
      await expect(service.activeCodes()).rejects.toBeInstanceOf(ServiceUnavailableException)
      await expect(service.listAll()).rejects.toBeInstanceOf(ServiceUnavailableException)
      await expect(service.listUnreadable()).rejects.toBeInstanceOf(ServiceUnavailableException)
      await expect(service.getByCode('hq')).rejects.toBeInstanceOf(ServiceUnavailableException)
    })

    it('does not cache a failed read: the next call reads again', async () => {
      readMany.mockRejectedValueOnce(new Error('boom'))
      await expect(service.listActive()).rejects.toBeInstanceOf(ServiceUnavailableException)

      rows = [row()]
      expect((await service.listActive()).map((s) => s.code)).toEqual(['lyon'])
      expect(readMany).toHaveBeenCalledTimes(2)
    })

    it('shares the failure between concurrent callers, then retries', async () => {
      readMany.mockRejectedValueOnce(new Error('boom'))

      const settled = await Promise.allSettled([service.listActive(), service.listAll()])

      expect(settled.map((entry) => entry.status)).toEqual(['rejected', 'rejected'])
      expect(readMany).toHaveBeenCalledTimes(1)
      rows = [row()]
      await expect(service.listActive()).resolves.toHaveLength(1)
    })

    it('keeps routing leads on the env HQ while the configuration is unreadable', async () => {
      readMany.mockRejectedValue(new Error('boom'))

      expect(await service.getHq()).toMatchObject({ fromEnv: true, code: 'hq' })
      expect(await service.getById('uuid-lyon')).toBeNull()
      expect((await service.getById('env'))?.fromEnv).toBe(true)
    })

    it('refuses the env fallback when every active source is unreadable', async () => {
      rows = [row({ digiforma_api_key: 'plain-secret' })]

      await expect(service.listActive()).rejects.toThrow(/lyon/)
      expect(loggedText(error)).not.toContain('plain-secret')
    })

    it('refuses the env fallback when encrypted sources cannot be read (key missing)', async () => {
      delete env.SOURCES_ENC_KEY
      rows = [row()]

      await expect(service.listActive()).rejects.toBeInstanceOf(ServiceUnavailableException)
    })

    it('still falls back to the env when only inactive sources are unreadable', async () => {
      rows = [row({ status: 'inactive', digiforma_api_key: 'plain-secret' })]

      const [hq] = await service.listActive()

      expect(hq.fromEnv).toBe(true)
    })

    it('keeps serving the usable sources and reports the unreadable ones', async () => {
      rows = [
        row({ digiforma_api_key: encryptSecret('wrong-key-secret', Buffer.alloc(32, 9)) }),
        row({ id: 'uuid-nice', code: 'nice', digiforma_api_key: encryptSecret('nice-key', KEY) })
      ]

      expect((await service.listActive()).map((s) => s.code)).toEqual(['nice'])
      const unreadable = await service.listUnreadable()
      expect(unreadable).toEqual([
        {
          id: 'uuid-lyon',
          code: 'lyon',
          status: 'active',
          fromEnv: false,
          reason: expect.stringContaining('could not be decrypted')
        }
      ])
      expect(JSON.stringify(unreadable)).not.toContain('wrong-key-secret')
    })

    it('does not resolve an unreadable source, nor mistake it for an empty configuration', async () => {
      rows = [row({ id: 'uuid-hq', code: 'hq', is_hq: true, digiforma_api_key: 'plain-secret' })]

      expect(await service.getByCode('hq')).toBeNull()
      expect(await service.getByCode('lyon')).toBeNull()
      expect((await service.getHq()).fromEnv).toBe(true)
    })
  })

  describe('cache scope provider', () => {
    it('registers itself with the cache at startup', () => {
      service.onModuleInit()

      expect(cache.setScopeProvider).toHaveBeenCalledWith(service)
    })

    it('exposes the codes of the active sources', async () => {
      rows = [
        row({ id: 'uuid-hq', code: 'hq', is_hq: true }),
        row(),
        row({ id: 'uuid-nice', code: 'nice', status: 'inactive' })
      ]

      expect(await service.activeCodes()).toEqual(['hq', 'lyon'])
    })

    it('exposes the env HQ when no source is configured', async () => {
      expect(await service.activeCodes()).toEqual(['hq'])
    })
  })

  describe('sources from Directus', () => {
    beforeEach(() => {
      rows = [
        row({ id: 'uuid-hq', code: 'hq', name: 'HQ', is_hq: true }),
        row(),
        row({ id: 'uuid-nice', code: 'nice', status: 'inactive' })
      ]
    })

    it('lists only active sources, decrypted', async () => {
      const active = await service.listActive()
      expect(active.map((s) => s.code)).toEqual(['hq', 'lyon'])
      expect(active[1].secrets.digiformaApiKey).toBe('lyon-key')
      expect(active[1].hubspot.forms).toEqual({
        newsletter: null,
        demande: 'lyon-demande',
        candidature: null,
        conseiller: 'lyon-conseiller',
        rappel: 'lyon-rappel'
      })
    })

    it('listAll() returns every source from Directus, inactive included', async () => {
      expect((await service.listAll()).map((s) => s.code)).toEqual(['hq', 'lyon', 'nice'])
    })

    it('resolves by id and code, inactive included', async () => {
      expect((await service.getById('uuid-nice'))?.status).toBe('inactive')
      expect((await service.getByCode('lyon'))?.id).toBe('uuid-lyon')
      expect(await service.getById('missing')).toBeNull()
      expect(await service.getByCode('missing')).toBeNull()
      expect((await service.getById('env'))?.fromEnv).toBe(true)
      expect((await service.getHq()).id).toBe('uuid-hq')
    })

    it('resolves the env HQ by code when no source exists', async () => {
      rows = []
      expect((await service.getByCode('hq'))?.fromEnv).toBe(true)
      expect(await service.getByCode('lyon')).toBeNull()
    })

    it('caches for 60 s, then re-reads; invalidate() forces a re-read', async () => {
      await service.listActive()
      await service.listActive()
      expect(readMany).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(59_000)
      await service.listActive()
      expect(readMany).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(2_000)
      await service.listActive()
      expect(readMany).toHaveBeenCalledTimes(2)
      service.invalidate()
      await service.listActive()
      expect(readMany).toHaveBeenCalledTimes(3)
    })

    it('shares a single read between concurrent callers', async () => {
      await Promise.all([service.listActive(), service.getHq(), service.getByCode('lyon')])
      expect(readMany).toHaveBeenCalledTimes(1)
    })

    it('decrypts the optional HubSpot token', async () => {
      rows = [row({ hubspot_token: encryptSecret('pat-123', KEY) })]
      const [lyon] = await service.listActive()
      expect(lyon.secrets.hubspotToken).toBe('pat-123')
    })

    it('treats an unknown status as active', async () => {
      rows = [row({ status: null })]
      expect((await service.listActive())[0].status).toBe('active')
    })
  })

  describe('secrets handling', () => {
    it('skips a source whose secret cannot be decrypted, keeps the others', async () => {
      rows = [
        row({ digiforma_api_key: encryptSecret('wrong-key-secret', Buffer.alloc(32, 9)) }),
        row({ id: 'uuid-nice', code: 'nice', digiforma_api_key: encryptSecret('nice-key', KEY) })
      ]
      const active = await service.listActive()
      expect(active.map((s) => s.code)).toEqual(['nice'])
      const logged = loggedText(error)
      expect(logged).toContain('lyon')
      expect(logged).not.toContain('wrong-key-secret')
    })

    it('refuses a plaintext secret (hook bypassed)', async () => {
      rows = [row({ digiforma_api_key: 'plain-secret' })]
      await expect(service.listActive()).rejects.toBeInstanceOf(ServiceUnavailableException)
      expect(loggedText(error)).toContain('lyon')
      expect(loggedText(error)).not.toContain('plain-secret')
    })

    it('never exposes decrypted secrets through JSON or inspect', async () => {
      rows = [row({ hubspot_token: encryptSecret('pat-123', KEY) })]
      const [lyon] = await service.listActive()
      const dumps = [
        JSON.stringify(lyon),
        inspect(lyon, { depth: 5 }),
        JSON.stringify(lyon.secrets),
        inspect(lyon.secrets)
      ]
      for (const dump of dumps) {
        expect(dump).not.toContain('lyon-key')
        expect(dump).not.toContain('pat-123')
      }
      expect(lyon.secrets.digiformaApiKey).toBe('lyon-key')
    })

    it('does not log secrets when Directus fails', async () => {
      readMany.mockRejectedValueOnce(new Error('Directus GET failed: 503'))
      await expect(service.listActive()).rejects.toBeInstanceOf(ServiceUnavailableException)
      expect(loggedText(error)).toContain('503')
      expect(loggedText(error)).not.toContain('env-digi-key')
    })

    it('does not log secrets when serving the stale cache', async () => {
      rows = [row()]
      await service.listActive()
      vi.advanceTimersByTime(61_000)
      readMany.mockRejectedValueOnce(new Error('Directus GET failed: 503'))

      await service.listActive()

      expect(loggedText(warn)).toContain('stale cache')
      expect(loggedText(warn)).not.toContain('lyon-key')
    })
  })
})
