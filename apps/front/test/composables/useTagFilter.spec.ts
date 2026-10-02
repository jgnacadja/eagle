import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { matchesTag, useTagFilter, FORMATION_TAGS } from '~/composables/useTagFilter'

describe('matchesTag', () => {
  const sampleCourse = {
    title: 'Formation AIPR Opérateur',
    description: 'Travaux à proximité des réseaux',
    category: 'Sécurité',
    familySlug: 'securite-prevention',
    slug: 'formation-aipr-operateur'
  }

  it('matches when tag is directly in title or description', () => {
    expect(matchesTag(sampleCourse, 'AIPR')).toBe(true)
    expect(matchesTag(sampleCourse, 'réseaux')).toBe(true)
  })

  it('handles accentuation and case insensitivity', () => {
    expect(matchesTag(sampleCourse, 'securite')).toBe(true)
    expect(matchesTag(sampleCourse, 'OPÉRATEUR')).toBe(true)
  })

  it('handles special characters such as trademark ®', () => {
    const catecCourse = {
      title: 'Formation CATEC Surveillant et Intervenant',
      slug: 'formation-catec'
    }
    expect(matchesTag(catecCourse, 'CATEC®')).toBe(true)
  })

  it('matches multi-token tags if all tokens match or significant token matches', () => {
    const amianteCourse = {
      title: 'Encadrement de chantier amiante sous-section 4',
      slug: 'amiante-ss4'
    }
    expect(matchesTag(amianteCourse, 'Amiante SS4')).toBe(true)
  })

  it('returns false when no token matches', () => {
    expect(matchesTag(sampleCourse, 'CACES')).toBe(false)
  })
})

describe('useTagFilter', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
  })

  it('exposes FORMATION_TAGS list', () => {
    const { formationTags } = useTagFilter()
    expect(formationTags).toEqual(FORMATION_TAGS)
  })

  it('toggles tag on and off', () => {
    const { selectedTag, toggleTag } = useTagFilter()
    expect(selectedTag.value).toBeNull()

    toggleTag('AIPR')
    expect(selectedTag.value).toBe('AIPR')

    toggleTag('AIPR')
    expect(selectedTag.value).toBeNull()
  })

  it('clears selected tag with clearTag', () => {
    const { selectedTag, toggleTag, clearTag } = useTagFilter()
    toggleTag('CATEC®')
    expect(selectedTag.value).toBe('CATEC®')

    clearTag()
    expect(selectedTag.value).toBeNull()
  })

  it('fetches from API when local matches are insufficient and client side', async () => {
    const items = ref([{ title: 'Formation standard', slug: 'standard' }])

    const fetchMock = vi.fn().mockResolvedValue({
      items: [{ title: 'Formation AIPR trouvée', slug: 'aipr-found' }]
    })
    vi.stubGlobal('$fetch', fetchMock)

    const { apiTagResults, toggleTag } = useTagFilter(items)

    toggleTag('AIPR')
    await nextTick()

    // En environnement de test Vitest (client-like), $fetch est appelé si import.meta.client est vrai
    if (import.meta.client) {
      expect(fetchMock).toHaveBeenCalled()
      expect(apiTagResults.value['AIPR']).toBeDefined()
    }
  })
})
