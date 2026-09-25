import { ref, type ComputedRef } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useContentSeo } from '~/composables/useContentSeo'

interface HeadPayload {
  title?: string
  meta?: Array<Record<string, string>>
  link?: Array<Record<string, string>>
  script?: Array<{ type: string; innerHTML: string }>
}

let lastHead: ComputedRef<HeadPayload> | undefined

vi.stubGlobal('useHead', (input: ComputedRef<HeadPayload>) => {
  lastHead = input
})

function head(): HeadPayload {
  if (!lastHead) throw new Error('useHead not called')
  return lastHead.value
}

const COURSE_LD = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'CACES R489',
  provider: { '@type': 'Organization', name: 'LEARN UP ACADEMY' }
}

describe('useContentSeo', () => {
  beforeEach(() => {
    lastHead = undefined
  })

  it('alimente title/meta/canonical depuis la source SEO', () => {
    useContentSeo(
      {
        seo_title: 'Titre éditorial',
        seo_description: 'Chapô SEO',
        seo_canonical: 'https://learnup.fr/formations/x',
        seo_noindex: true
      },
      'Fallback'
    )
    expect(head().title).toBe('Titre éditorial')
    expect(head().meta).toEqual(
      expect.arrayContaining([
        { name: 'description', content: 'Chapô SEO' },
        { property: 'og:title', content: 'Titre éditorial' },
        { name: 'robots', content: 'noindex' }
      ])
    )
    expect(head().link).toEqual([{ rel: 'canonical', href: 'https://learnup.fr/formations/x' }])
  })

  it('émet un script application/ld+json quand jsonLd est fourni', () => {
    useContentSeo({}, 'Fallback', { jsonLd: COURSE_LD })
    const scripts = head().script ?? []
    expect(scripts).toHaveLength(1)
    expect(scripts[0]!.type).toBe('application/ld+json')
    expect(JSON.parse(scripts[0]!.innerHTML)).toMatchObject({
      '@type': 'Course',
      name: 'CACES R489'
    })
  })

  it('accepte un getter réactif et un tableau de documents', () => {
    const ld = ref<Record<string, unknown> | Record<string, unknown>[] | null>(null)
    useContentSeo({}, 'Fallback', { jsonLd: ld })
    expect(head().script).toEqual([])

    ld.value = [COURSE_LD, { '@context': 'https://schema.org', '@type': 'BreadcrumbList' }]
    const scripts = head().script ?? []
    expect(scripts).toHaveLength(2)
    expect(JSON.parse(scripts[1]!.innerHTML)['@type']).toBe('BreadcrumbList')
  })

  it('n’émet aucun script sans données structurées', () => {
    useContentSeo({}, 'Fallback')
    expect(head().script).toEqual([])
  })

  it('échappe </script> dans le contenu (sécurité)', () => {
    useContentSeo({}, 'Fallback', {
      jsonLd: { '@context': 'https://schema.org', name: 'Fin </script><script>alert(1)' }
    })
    const scripts = head().script ?? []
    expect(scripts[0]!.innerHTML).not.toContain('</script>')
    expect(scripts[0]!.innerHTML).toContain('\\u003c/script>')
  })
})
