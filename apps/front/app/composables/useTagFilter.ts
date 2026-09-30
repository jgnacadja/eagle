import type { CourseListItem } from '@learnup/types'
import { ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { CatalogApiResult } from '~/composables/useCatalog'

export const FORMATION_TAGS = [
  'AIPR',
  'CATEC®',
  'Amiante SS4',
  'PASO',
  'SECUFER',
  'Gestes & postures'
] as const

export type FormationTag = (typeof FORMATION_TAGS)[number]

export interface MatchableCourse {
  title: string
  description?: string | null
  category?: string | null
  certification?: string | null
  certifierName?: string | null
  subFamilyName?: string | null
  familySlug?: string | null
  slug?: string | null
}

export function matchesTag(course: MatchableCourse, tag: string): boolean {
  const normalize = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')

  const cleanTag = normalize(tag).trim()
  const cleanTokens = cleanTag.split(/\s+/).filter(Boolean)

  const rawCorpus = normalize(
    [
      course.title,
      course.description,
      course.category,
      course.certification,
      course.certifierName,
      course.subFamilyName,
      course.familySlug,
      course.slug
    ]
      .filter((v): v is string => typeof v === 'string')
      .join(' ')
  )

  if (rawCorpus.includes(cleanTag)) return true

  // Normalisation des variantes usuelles (ex: sous-section 4 <-> ss4)
  const corpus = rawCorpus.replace(/sous\s+section\s+4/g, 'ss4')

  // Pour les tags composés, tous les mots doivent être présents dans la formation
  if (cleanTokens.length > 0 && cleanTokens.every((token) => corpus.includes(token))) {
    return true
  }

  return false
}

export function useTagFilter(catalogueItems?: MaybeRefOrGetter<CourseListItem[] | undefined>) {
  const selectedTag = ref<string | null>(null)
  const apiTagResults = ref<Record<string, CourseListItem[]>>({})

  // useRuntimeConfig est appelé au niveau synchrone du setup (évite "Nuxt instance is unavailable")
  let apiBase = 'http://localhost:3001'
  try {
    const config = typeof useRuntimeConfig === 'function' ? useRuntimeConfig() : undefined
    if (config?.public?.apiBase) {
      apiBase = config.public.apiBase as string
    }
  } catch {
    // Dégradation gracieuse si appelé hors contexte Nuxt
  }

  function toggleTag(tag: string) {
    selectedTag.value = selectedTag.value === tag ? null : tag
  }

  function clearTag() {
    selectedTag.value = null
  }

  watch(selectedTag, async (tag) => {
    if (!tag || !import.meta.client) return
    const items = toValue(catalogueItems) ?? []
    const localMatches = items.filter((c) => matchesTag(c, tag))
    if (localMatches.length >= 4 || apiTagResults.value[tag]) return

    try {
      const cleanSearch = tag.replace(/®/g, '').trim()
      const res = await $fetch<CatalogApiResult>(`${apiBase}/courses`, {
        query: { search: cleanSearch, limit: 4 }
      })
      if (res?.items && selectedTag.value === tag) {
        apiTagResults.value = { ...apiTagResults.value, [tag]: res.items }
      }
    } catch {
      // Dégradation gracieuse : les résultats locaux restent utilisés
    }
  })

  return {
    selectedTag,
    apiTagResults,
    formationTags: FORMATION_TAGS,
    toggleTag,
    clearTag,
    matchesTag
  }
}
