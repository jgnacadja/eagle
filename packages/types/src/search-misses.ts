import type { Paginated } from './api.js'

/**
 * Journal des recherches sans correspondance — « aucun résultat » côté
 * catalogue, « hors catalogue » côté moteur IA. Miroir de la collection
 * Directus `recherches_sans_resultat` (directus/schema/collections.mjs) et
 * contrat des endpoints admin `GET /admin/search-misses*` (apps/api).
 *
 * Distinct des events analytics (funnel) : on conserve le CONTENU de la
 * requête pour la revue produit (manques catalogue, boucle corpus/prompt),
 * jamais de donnée personnelle — texte nettoyé avant stockage, rétention
 * bornée côté API (`SEARCH_MISS_RETENTION_DAYS`).
 */
export type SearchMissOutcome = 'no_result' | 'out_of_catalog'

export type SearchMissSource = 'catalog' | 'assistant'

/** Contexte non personnel de la recherche (filtres actifs, zone géographique…). */
export type SearchMissContext = Record<string, string | number | boolean | null>

export interface RechercheSansResultat {
  id: number
  date_created: string | null
  /** Texte saisi, données personnelles masquées, tronqué à 500 caractères. */
  query_text: string
  /** Clé de regroupement : minuscules, sans accents ni ponctuation. */
  query_normalized: string
  outcome: SearchMissOutcome
  source: SearchMissSource
  /** Intention détectée par le moteur IA — null pour le catalogue. */
  intent: string | null
  context: SearchMissContext | null
  /** Coché en back-office une fois la requête traitée en revue produit. */
  reviewed: boolean | null
}

export type SearchMissPage = Paginated<RechercheSansResultat>

/** Vue agrégée par requête normalisée — base de l'export revue produit. */
export interface SearchMissAggregate {
  queryNormalized: string
  /** Dernier texte saisi tel quel (lisible), pour illustrer le regroupement. */
  sampleQuery: string
  occurrences: number
  firstSeen: string | null
  lastSeen: string | null
  outcomes: Record<SearchMissOutcome, number>
  sources: Record<SearchMissSource, number>
  intents: string[]
}
