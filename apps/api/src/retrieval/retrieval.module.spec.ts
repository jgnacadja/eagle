import type { ConfigService } from '@nestjs/config'
import { HashingEmbeddingsProvider } from './embeddings/hashing-embeddings.provider'
import { HttpEmbeddingsProvider } from './embeddings/http-embeddings.provider'
import { createEmbeddingsProvider } from './retrieval.module'

function config(env: Record<string, string>): ConfigService {
  return {
    get: (key: string) => env[key],
    getOrThrow: (key: string) => {
      if (!(key in env)) throw new Error(`${key} missing`)
      return env[key]
    }
  } as unknown as ConfigService
}

describe('createEmbeddingsProvider', () => {
  it('defaults to the local hashing provider', () => {
    expect(createEmbeddingsProvider(config({}))).toBeInstanceOf(HashingEmbeddingsProvider)
    expect(createEmbeddingsProvider(config({ EMBEDDINGS_PROVIDER: 'other' }))).toBeInstanceOf(
      HashingEmbeddingsProvider
    )
  })

  it('builds the HTTP provider when configured', () => {
    const provider = createEmbeddingsProvider(
      config({
        EMBEDDINGS_PROVIDER: 'http',
        EMBEDDINGS_API_URL: 'https://embeddings.test',
        EMBEDDINGS_API_KEY: 'k',
        EMBEDDINGS_MODEL: 'm'
      })
    )

    expect(provider).toBeInstanceOf(HttpEmbeddingsProvider)
    expect(provider.name).toBe('http:m')
  })
})
