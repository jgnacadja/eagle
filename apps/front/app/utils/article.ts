import type { Article } from '@learnup/types'
import { formatDateFr } from './date'

/** Catégorie d'article expansée (`category.name`/`.slug` demandés) ou null (id brut). */
export function articleCategory(category: Article['category']) {
  return category && typeof category === 'object' ? category : null
}

export function formatArticleDate(value: string | null | undefined): string {
  return formatDateFr(value)
}

export function articleAssetUrl(id: string | null | undefined, apiBase: string): string | null {
  if (!id) return null
  return `${apiBase}/directus/assets/${id}`
}

export function articleReadingTime(content: string | null | undefined): number {
  const plainText = stripHtmlTags(content ?? '')
  return Math.max(1, Math.ceil(plainText.length / 1300))
}

export function stripHtmlTags(content: string): string {
  return content
    .replace(/<[^<>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function slugifyHeading(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
