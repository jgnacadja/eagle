import { normalizeText } from '../../common/utils/text.util'
import type { EmbeddingsProvider } from '../retrieval.types'

const DIMENSIONS = 384
const NGRAM = 3
const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193

// FNV-1a 32 bits : rapide, déterministe, sans dépendance.
function fnv1a(text: string): number {
  let hash = FNV_OFFSET
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, FNV_PRIME) >>> 0
  }
  return hash
}

function features(text: string): Map<string, number> {
  const counts = new Map<string, number>()
  const words = normalizeText(text).match(/[a-z0-9]+/g) ?? []
  for (const word of words) {
    counts.set(`w:${word}`, (counts.get(`w:${word}`) ?? 0) + 1)
    const padded = ` ${word} `
    for (let i = 0; i + NGRAM <= padded.length; i += 1) {
      const gram = `g:${padded.slice(i, i + NGRAM)}`
      counts.set(gram, (counts.get(gram) ?? 0) + 1)
    }
  }
  return counts
}

/**
 * Repli local sans clé ni service externe : projection aléatoire (hashing)
 * de n-grammes de caractères et de mots dans un espace de 384 dimensions.
 * Ce n'est pas une sémantique apprise — la similarité reflète le
 * vocabulaire partagé et ses variantes (fautes, pluriels, dérivés). Le
 * provider HTTP apporte la sémantique réelle une fois confirmé.
 */
export class HashingEmbeddingsProvider implements EmbeddingsProvider {
  readonly name = 'hashing-ngram'

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.vectorize(text))
  }

  vectorize(text: string): number[] {
    const vector = new Array<number>(DIMENSIONS).fill(0)
    for (const [feature, count] of features(text)) {
      const hash = fnv1a(feature)
      const index = hash % DIMENSIONS
      const sign = hash >>> 31 === 1 ? -1 : 1
      vector[index]! += sign * (1 + Math.log(count))
    }
    return l2Normalize(vector)
  }
}

export function l2Normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
  if (norm === 0) return vector
  return vector.map((value) => value / norm)
}

export function cosine(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  for (let i = 0; i < a.length; i += 1) dot += a[i]! * b[i]!
  return Math.max(0, Math.min(1, dot))
}
