import { Logger } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DirectusItemsClient } from '../directus/directus.items.client'
import {
  LEAD_FORM_NAMES,
  SourceSecrets,
  type LeadFormName,
  type SourceConfig
} from '../sources/source.types'
import type { SourcesService } from '../sources/sources.service'
import { HubspotTargetResolver } from './hubspot-target.resolver'

type Forms = Record<LeadFormName, string | null>

const allForms = (prefix: string): Forms =>
  Object.fromEntries(LEAD_FORM_NAMES.map((form) => [form, `${prefix}-${form}`])) as Forms

function source(overrides: Partial<SourceConfig> & { forms?: Partial<Forms>; token?: string }) {
  const { forms, token, ...rest } = overrides
  const code = rest.code ?? 'lyon'
  return {
    id: `uuid-${code}`,
    code,
    name: code,
    isHq: false,
    status: 'active',
    fromEnv: false,
    digiforma: { apiUrl: 'https://x/graphql' },
    hubspot: { portalId: `portal-${code}`, forms: { ...allForms(code), ...forms } },
    secrets: new SourceSecrets('key', token ?? null),
    ...rest
  } as SourceConfig
}

describe('HubspotTargetResolver', () => {
  let hq: SourceConfig
  let lyon: SourceConfig
  let nice: SourceConfig
  let formationSource: Record<number, string | null>
  let centreSource: Record<number, string | null>
  let readMany: ReturnType<typeof vi.fn>
  let all: SourceConfig[]
  let resolver: HubspotTargetResolver
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
    hq = source({ code: 'hq', isHq: true })
    lyon = source({ code: 'lyon' })
    nice = source({ code: 'nice' })
    all = [hq, lyon, nice]
    formationSource = {}
    centreSource = {}
    readMany = vi.fn(async (collection: string, query: { filter: { id: { _eq: number } } }) => {
      const id = query.filter.id._eq
      const table = collection === 'formations' ? formationSource : centreSource
      return { data: id in table ? [{ source: table[id] }] : [] }
    })
    const sources = {
      getHq: vi.fn(async () => hq),
      getById: vi.fn(async (id: string) => all.find((s) => s.id === id) ?? null)
    } as unknown as SourcesService
    resolver = new HubspotTargetResolver(sources, { readMany } as unknown as DirectusItemsClient)
  })

  afterEach(() => vi.restoreAllMocks())

  describe('routed forms: demande, conseiller, rappel', () => {
    it.each(['demande', 'conseiller', 'rappel'] as const)(
      '%s on a franchise formation → the franchise portal (CA3)',
      async (type) => {
        formationSource[12] = lyon.id

        await expect(resolver.resolve(type, { formationId: 12 })).resolves.toEqual({
          portalId: 'portal-lyon',
          formGuid: `lyon-${type}`,
          token: null,
          isHq: false,
          sourceCode: 'lyon'
        })
      }
    )

    it('centre source applies when there is no formation', async () => {
      centreSource[3] = nice.id
      const target = await resolver.resolve('conseiller', { centreId: 3 })
      expect(target).toMatchObject({ portalId: 'portal-nice', sourceCode: 'nice' })
    })

    it('formation source wins over centre source', async () => {
      formationSource[12] = lyon.id
      centreSource[3] = nice.id
      const target = await resolver.resolve('demande', { formationId: 12, centreId: 3 })
      expect(target.sourceCode).toBe('lyon')
    })

    it('a formation of the HQ wins over a franchise centre', async () => {
      formationSource[12] = hq.id
      centreSource[3] = lyon.id
      const target = await resolver.resolve('demande', { formationId: 12, centreId: 3 })
      expect(target).toMatchObject({ sourceCode: 'hq', isHq: true })
      expect(warn).not.toHaveBeenCalled()
    })

    it('a centre without source (null = HQ) stays on the HQ', async () => {
      centreSource[3] = null
      const target = await resolver.resolve('demande', { centreId: 3 })
      expect(target).toMatchObject({ sourceCode: 'hq', isHq: true })
    })

    it('a formation without source falls through to the centre', async () => {
      formationSource[12] = null
      centreSource[3] = lyon.id
      const target = await resolver.resolve('demande', { formationId: 12, centreId: 3 })
      expect(target.sourceCode).toBe('lyon')
    })

    it('no context → HQ, without any Directus read', async () => {
      const target = await resolver.resolve('rappel')
      expect(target).toMatchObject({ sourceCode: 'hq', isHq: true })
      expect(readMany).not.toHaveBeenCalled()
    })

    it('unknown formation / centre are ignored → HQ, no error', async () => {
      const target = await resolver.resolve('demande', { formationId: 999, centreId: 888 })
      expect(target).toMatchObject({ sourceCode: 'hq', isHq: true })
    })

    it('carries the source token', async () => {
      lyon = source({ code: 'lyon', token: 'pat-lyon' })
      all = [hq, lyon, nice]
      formationSource[12] = lyon.id
      const target = await resolver.resolve('demande', { formationId: 12 })
      expect(target.token).toBe('pat-lyon')
    })
  })

  describe('HQ fallback (with a warning, never a lost lead)', () => {
    it('inactive source', async () => {
      lyon.status = 'inactive'
      formationSource[12] = lyon.id
      const target = await resolver.resolve('demande', { formationId: 12 })
      expect(target.sourceCode).toBe('hq')
      expect(warn).toHaveBeenCalledWith(
        { leadType: 'demande', sourceCode: 'lyon', reason: 'source-inactive' },
        expect.any(String)
      )
    })

    it('missing portal id', async () => {
      lyon.hubspot.portalId = null
      formationSource[12] = lyon.id
      expect((await resolver.resolve('demande', { formationId: 12 })).sourceCode).toBe('hq')
      expect(warn).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'portal-missing' }),
        expect.any(String)
      )
    })

    it('missing form GUID for that form type only', async () => {
      lyon.hubspot.forms.rappel = null
      formationSource[12] = lyon.id

      const rappel = await resolver.resolve('rappel', { formationId: 12 })
      expect(rappel).toMatchObject({ sourceCode: 'hq', formGuid: 'hq-rappel' })
      expect(warn).toHaveBeenCalledWith(
        expect.objectContaining({ leadType: 'rappel', reason: 'form-guid-missing' }),
        expect.any(String)
      )

      const demande = await resolver.resolve('demande', { formationId: 12 })
      expect(demande.sourceCode).toBe('lyon')
    })

    it('source referenced but not found', async () => {
      formationSource[12] = 'uuid-ghost'
      expect((await resolver.resolve('demande', { formationId: 12 })).sourceCode).toBe('hq')
      expect(warn).toHaveBeenCalledWith(
        expect.objectContaining({ sourceCode: 'uuid-ghost', reason: 'source-missing' }),
        expect.any(String)
      )
    })

    it('Directus lookup failure falls back to the next lookup, then the HQ', async () => {
      centreSource[3] = lyon.id
      readMany.mockRejectedValueOnce(new Error('directus down'))
      const viaCentre = await resolver.resolve('demande', { formationId: 12, centreId: 3 })
      expect(viaCentre.sourceCode).toBe('lyon')

      readMany.mockRejectedValue(new Error('directus down'))
      const viaHq = await resolver.resolve('demande', { formationId: 12, centreId: 3 })
      expect(viaHq.sourceCode).toBe('hq')
    })

    it('never logs personal data or secrets', async () => {
      lyon = source({ code: 'lyon', token: 'pat-lyon' })
      lyon.status = 'inactive'
      all = [hq, lyon, nice]
      formationSource[12] = lyon.id
      await resolver.resolve('demande', { formationId: 12 })
      expect(JSON.stringify(warn.mock.calls)).not.toContain('pat-lyon')
    })
  })

  describe('HQ-only forms: newsletter, candidature', () => {
    it.each(['newsletter', 'candidature'] as const)(
      '%s always goes to the HQ, ignoring any franchise context',
      async (type) => {
        formationSource[12] = lyon.id
        const target = await resolver.resolve(type, { formationId: 12, centreId: 3 })
        expect(target).toMatchObject({ sourceCode: 'hq', isHq: true, formGuid: `hq-${type}` })
        expect(readMany).not.toHaveBeenCalled()
      }
    )
  })

  describe('env fallback (CA4)', () => {
    it('relays the env HQ target when no source exists in Directus', async () => {
      const envHq = source({ code: 'hq', isHq: true, fromEnv: true, id: 'env' })
      const sources = {
        getHq: vi.fn(async () => envHq),
        getById: vi.fn(async () => null)
      } as unknown as SourcesService
      const envResolver = new HubspotTargetResolver(sources, {
        readMany
      } as unknown as DirectusItemsClient)

      const target = await envResolver.resolve('demande', { formationId: 1 })
      expect(target).toMatchObject({ portalId: 'portal-hq', isHq: true })
    })

    it('exposes null portal / GUID when even the HQ is unconfigured (→ 503 upstream)', async () => {
      hq.hubspot.portalId = null
      hq.hubspot.forms.newsletter = null
      const target = await resolver.resolve('newsletter')
      expect(target).toMatchObject({ portalId: null, formGuid: null })
    })
  })
})
