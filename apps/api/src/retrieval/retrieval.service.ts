import { Injectable } from '@nestjs/common'
import { normalizeText, stemToken, tokenize } from '../common/utils/text.util'
import {
  CatalogIndexService,
  type IndexedDocument,
  type RetrievalIndex
} from './catalog-index.service'
import { cosine } from './embeddings/hashing-embeddings.provider'
import { QUERY_NOISE, QUERY_SYNONYMS } from './retrieval.synonyms'
import type { RetrievalCandidate, RetrievalQuery, RetrievalResult } from './retrieval.types'

const DEFAULT_LIMIT = 5
const MAX_LIMIT = 20
// BM25 : k1 module la saturation des fréquences, b la normalisation par longueur.
const BM25_K1 = 1.2
const BM25_B = 0.75
// Poids des expansions de synonymes par rapport aux termes saisis.
const SYNONYM_WEIGHT = 0.6
// Fusion : le lexical (intitulés exacts du référentiel) prime sur le sémantique.
const LEXICAL_WEIGHT = 0.6
const SEMANTIC_WEIGHT = 0.4
// Seuils du drapeau `confident` — la décision métier reste au consommateur.
const CONFIDENT_COVERAGE = 0.6
const CONFIDENT_SEMANTIC = 0.6

export interface QueryTerm {
  term: string
  weight: number
  /** Terme saisi (compte dans la couverture) ou expansion de synonyme. */
  typed: boolean
  /** Terme saisi dont ce terme est l'expansion — couvre le terme saisi s'il matche. */
  source: string
}

// Nombres seuls (effectifs, années) : jamais discriminants dans le référentiel.
const NUMERIC = /^\d+$/

export function analyzeQuery(text: string): QueryTerm[] {
  const seen = new Map<string, QueryTerm>()
  for (const token of tokenize(text)) {
    if (QUERY_NOISE.has(token) || NUMERIC.test(token)) continue
    const term = stemToken(token)
    seen.set(term, { term, weight: 1, typed: true, source: term })
    for (const synonym of QUERY_SYNONYMS[token] ?? []) {
      const expanded = stemToken(synonym)
      if (!seen.has(expanded)) {
        seen.set(expanded, { term: expanded, weight: SYNONYM_WEIGHT, typed: false, source: term })
      }
    }
  }
  return [...seen.values()]
}

function idf(index: RetrievalIndex, term: string): number {
  const documents = index.documents.length
  const containing = index.documentFrequency.get(term) ?? 0
  return Math.log(1 + (documents - containing + 0.5) / (containing + 0.5))
}

function bm25(
  index: RetrievalIndex,
  document: IndexedDocument,
  terms: QueryTerm[]
): {
  score: number
  matched: string[]
} {
  let score = 0
  const matched: string[] = []
  const lengthRatio = index.averageLength > 0 ? document.length / index.averageLength : 1
  for (const { term, weight } of terms) {
    const frequency = document.terms.get(term)
    if (!frequency) continue
    matched.push(term)
    const saturation =
      (frequency * (BM25_K1 + 1)) / (frequency + BM25_K1 * (1 - BM25_B + BM25_B * lengthRatio))
    score += weight * idf(index, term) * saturation
  }
  return { score, matched }
}

// Part des termes saisis retrouvés (pondérée idf) — un terme saisi est
// couvert si lui-même ou l'une de ses expansions métier matche.
function coverageOf(index: RetrievalIndex, terms: QueryTerm[], matched: string[]): number {
  const typed = terms.filter((term) => term.typed)
  if (typed.length === 0) return 0
  const matchedSet = new Set(matched)
  const coveredSources = new Set(
    terms.filter((term) => matchedSet.has(term.term)).map((term) => term.source)
  )
  let total = 0
  let covered = 0
  for (const { term } of typed) {
    const weight = idf(index, term)
    total += weight
    if (coveredSources.has(term)) covered += weight
  }
  return total > 0 ? covered / total : 0
}

function wordPrefixMatch(text: string, token: string): boolean {
  return text.split(/[^a-z0-9]+/).some((word) => word.startsWith(token))
}

function matchesFilters(document: IndexedDocument, query: RetrievalQuery): boolean {
  const { course } = document
  if (query.family && course.familySlug !== query.family) return false
  if (query.modalities?.length && !query.modalities.some((m) => course.modalities.includes(m))) {
    return false
  }
  const locationTokens = normalizeText(query.location).match(/[a-z0-9]+/g) ?? []
  return locationTokens.every((token) => wordPrefixMatch(document.locationText, token))
}

/**
 * Recherche hybride sur les formations publiées : BM25 sur les termes du
 * référentiel (avec expansions métier) + similarité d'embeddings, fusion
 * pondérée, filtres stricts (famille, modalités, localisation).
 */
@Injectable()
export class RetrievalService {
  constructor(private readonly catalogIndex: CatalogIndexService) {}

  async search(query: RetrievalQuery): Promise<RetrievalResult> {
    const index = await this.catalogIndex.getIndex()
    const terms = analyzeQuery(query.text)
    const limit = Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT)
    const queryVector = await this.catalogIndex.embedQuery(query.text)

    const scored = index.documents
      .filter((document) => matchesFilters(document, query))
      .map((document) => {
        const lexical = bm25(index, document, terms)
        const semantic = cosine(queryVector, document.vector)
        return { document, lexical, semantic }
      })
      .filter(({ lexical, semantic }) => lexical.score > 0 || semantic > 0)

    const maxLexical = Math.max(0, ...scored.map(({ lexical }) => lexical.score))
    const candidates: RetrievalCandidate[] = scored
      .map(({ document, lexical, semantic }) => {
        const lexicalNormalized = maxLexical > 0 ? lexical.score / maxLexical : 0
        const coverage = coverageOf(index, terms, lexical.matched)
        return {
          course: document.course,
          score: LEXICAL_WEIGHT * lexicalNormalized + SEMANTIC_WEIGHT * semantic,
          lexicalScore: lexical.score,
          semanticScore: semantic,
          matchedTerms: lexical.matched,
          coverage,
          confident: coverage >= CONFIDENT_COVERAGE || semantic >= CONFIDENT_SEMANTIC
        }
      })
      .sort((a, b) => b.score - a.score || a.course.title.localeCompare(b.course.title))
      .slice(0, limit)

    return {
      query: query.text,
      terms: terms.filter((term) => term.typed).map((term) => term.term),
      candidates,
      indexed: index.documents.length,
      index: index.info
    }
  }
}
