import { describe, expect, it } from 'vitest'
import { SourceSecrets, type SourceConfig } from '../sources/source.types'
import { DigiformaClientFactory } from './digiforma-client.factory'

function source(overrides: Partial<SourceConfig> & { key?: string } = {}): SourceConfig {
  const { key = 'key-a', ...rest } = overrides
  return {
    id: 'uuid-a',
    code: 'a',
    name: 'A',
    isHq: false,
    status: 'active',
    fromEnv: false,
    digiforma: { apiUrl: 'https://a.example/graphql' },
    hubspot: {
      portalId: null,
      forms: { newsletter: null, demande: null, candidature: null, conseiller: null, rappel: null }
    },
    secrets: new SourceSecrets(key, null),
    ...rest
  }
}

describe('DigiformaClientFactory', () => {
  it('returns distinct clients for distinct sources', () => {
    const factory = new DigiformaClientFactory()
    const a = factory.for(source())
    const b = factory.for(source({ id: 'uuid-b', code: 'b' }))
    expect(a).not.toBe(b)
  })

  it('reuses the client while URL and key are unchanged', () => {
    const factory = new DigiformaClientFactory()
    expect(factory.for(source())).toBe(factory.for(source()))
  })

  it('rebuilds the client when the key changes', () => {
    const factory = new DigiformaClientFactory()
    const first = factory.for(source())
    const second = factory.for(source({ key: 'key-rotated' }))
    expect(second).not.toBe(first)
    expect(factory.for(source({ key: 'key-rotated' }))).toBe(second)
  })

  it('rebuilds the client when the URL changes', () => {
    const factory = new DigiformaClientFactory()
    const first = factory.for(source())
    const second = factory.for(source({ digiforma: { apiUrl: 'https://other.example/graphql' } }))
    expect(second).not.toBe(first)
  })

  it('throws without leaking config when credentials are missing', () => {
    const factory = new DigiformaClientFactory()
    expect(() => factory.for(source({ key: '' }))).toThrow(
      'Source "a": Digiforma API URL or key missing'
    )
    expect(() => factory.for(source({ digiforma: { apiUrl: null } }))).toThrow(/missing/)
  })
})
