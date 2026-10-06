import { Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { EmbeddingsProvider } from '../retrieval.types'
import { l2Normalize } from './hashing-embeddings.provider'

const BATCH_SIZE = 64
const TIMEOUT_MS = 20_000

interface EmbeddingsResponse {
  data?: Array<{ index?: number; embedding?: number[] }>
}

interface FetchLikeResponse {
  ok: boolean
  status: number
  json(): Promise<unknown>
  text(): Promise<string>
}

/**
 * Provider d'embeddings distant au format OpenAI (`POST /v1/embeddings`,
 * `{ model, input }` → `data[].embedding`) — compatible Voyage, Mistral,
 * OpenAI et les passerelles équivalentes. Le choix du fournisseur reste à
 * confirmer : seule la configuration change (`EMBEDDINGS_API_URL`,
 * `EMBEDDINGS_API_KEY`, `EMBEDDINGS_MODEL`).
 */
export class HttpEmbeddingsProvider implements EmbeddingsProvider {
  readonly name: string
  private readonly logger = new Logger(HttpEmbeddingsProvider.name)
  private readonly url: string
  private readonly apiKey: string
  private readonly model: string

  constructor(config: ConfigService) {
    this.url = config.getOrThrow<string>('EMBEDDINGS_API_URL')
    this.apiKey = config.getOrThrow<string>('EMBEDDINGS_API_KEY')
    this.model = config.getOrThrow<string>('EMBEDDINGS_MODEL')
    this.name = `http:${this.model}`
  }

  async embed(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = []
    for (let start = 0; start < texts.length; start += BATCH_SIZE) {
      const batch = texts.slice(start, start + BATCH_SIZE)
      // Dimension de référence = premier vecteur de l'index : un fournisseur
      // qui changerait de dimension entre deux lots fausserait silencieusement
      // la similarité (cosinus nul sur les documents décalés).
      vectors.push(...(await this.embedBatch(batch, vectors[0])))
    }
    return vectors
  }

  private async embedBatch(batch: string[], reference?: number[]): Promise<number[][]> {
    const response = (await fetch(this.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model: this.model, input: batch }),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    })) as unknown as FetchLikeResponse

    if (!response.ok) {
      const text = await response.text()
      this.logger.warn(`Embeddings HTTP ${response.status}: ${text.slice(0, 200)}`)
      throw new Error(`Embeddings provider failed: HTTP ${response.status}`)
    }

    const body = (await response.json()) as EmbeddingsResponse
    const data = [...(body.data ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    if (data.length !== batch.length) {
      throw new Error(
        `Embeddings provider returned ${data.length} vectors for ${batch.length} texts`
      )
    }
    return data.map((entry) =>
      l2Normalize(validVector(entry.embedding, reference ?? data[0]?.embedding))
    )
  }
}

// Une réponse malformée (vecteur absent, vide, non numérique ou de dimension
// différente) doit faire échouer le provider — sinon la similarité vaudrait
// silencieusement 0 au lieu de déclencher le repli local.
function validVector(vector: unknown, reference: unknown): number[] {
  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error('Embeddings provider returned an empty vector')
  }
  if (!vector.every((value) => typeof value === 'number' && Number.isFinite(value))) {
    throw new Error('Embeddings provider returned a non-numeric vector')
  }
  if (Array.isArray(reference) && reference.length !== vector.length) {
    throw new Error('Embeddings provider returned vectors of different dimensions')
  }
  return vector as number[]
}
