import type { Avis, AvisSource } from '@learnup/types'
import { formatMonthYearFr } from '~/utils/date'

/** Forme plate d'un avis prête à être passée aux composants UI. */
export interface MappedAvis {
  slug: string
  /** Origine de l'avis — `google` affiche le badge « Avis certifiés Google ». */
  source: AvisSource | null
  /** Étoiles Unicode clampées 0–5 (ex. « ★★★★☆ »). */
  stars: string
  /** Citation de `avis.quote` encadrée automatiquement par «\u202f…\u202f». */
  quote: string
  /** Auteur suivi de « · mois année » quand la date est disponible. */
  author: string
}

/**
 * Transforme un item brut `Avis` (Directus) en `MappedAvis`.
 *
 * - Clamp de `stars` entre 0 et 5.
 * - Représentation Unicode ★/☆.
 * - Guillemets typographiques français ajoutés autour de `quote` — une paire
 *   « … » déjà saisie est d'abord retirée pour éviter le double encadrement.
 * - Concaténation auteur · date (omis si `published_at` est absent ou invalide).
 */
export function mapAvis(avis: Avis): MappedAvis {
  const stars = Math.min(5, Math.max(0, avis.stars ?? 0))
  const date = formatMonthYearFr(avis.published_at)
  const quote = avis.quote.trim().replace(/^«[\s\u00a0\u202f]*|[\s\u00a0\u202f]*»$/g, '')
  return {
    slug: avis.slug,
    source: avis.source ?? null,
    stars: '★'.repeat(stars) + '☆'.repeat(5 - stars),
    quote: `«\u202f${quote}\u202f»`,
    author: date ? `${avis.author} · ${date}` : avis.author
  }
}
