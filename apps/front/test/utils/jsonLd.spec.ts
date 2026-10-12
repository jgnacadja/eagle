import type { Course } from '@learnup/types'
import { describe, expect, it } from 'vitest'
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildCourseJsonLd,
  buildLocalBusinessJsonLd
} from '~/utils/jsonLd'

const BASE: Course = {
  id: 1,
  slug: 'caces-r489',
  title: 'CACES R489 — chariots élévateurs',
  description: '<p>Conduite de <strong>chariots élévateurs</strong> en sécurité.</p>',
  durationDays: 3,
  durationHours: 21,
  price: 1500,
  cpf: true,
  cpfCode: null,
  certification: 'Certification CACES',
  certifierName: 'Opérateur réglementaire',
  category: null,
  familySlug: 'caces-conduite-engins',
  subFamilySlug: null,
  subFamilyName: null,
  centerSlug: null,
  centerSlugs: [],
  modalities: ['presentiel', 'distanciel'],
  sessions: null,
  image: null,
  imageUrl: null,
  generatedProgramUrl: null,
  status: 'published',
  seoTitle: null,
  seoDescription: null,
  seoCanonical: null,
  blocks: null,
  targets: null,
  prerequisites: null,
  pedagogy: null,
  evaluation: null,
  validity: null,
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-20T10:00:00.000Z'
}

const ctx = {
  url: 'https://learnup.fr/formations/caces-conduite-engins/caces-r489',
  siteUrl: 'https://learnup.fr'
}

describe('buildCourseJsonLd', () => {
  it('émet un Course complet quand tous les champs sont présents', () => {
    const ld = buildCourseJsonLd({
      course: BASE,
      familyName: "CACES & conduite d'engins",
      imageUrl: 'https://api.test/assets/img.png',
      ...ctx
    }) as Record<string, unknown>

    expect(ld).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'CACES R489 — chariots élévateurs',
      description: 'Conduite de chariots élévateurs en sécurité.',
      inLanguage: 'fr',
      url: ctx.url,
      provider: {
        '@type': 'Organization',
        name: 'LEARN UP ACADEMY',
        url: ctx.siteUrl
      },
      about: { '@type': 'Thing', name: "CACES & conduite d'engins" },
      image: ['https://api.test/assets/img.png'],
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: ['onsite', 'online'],
        courseWorkload: 'PT21H'
      },
      offers: { '@type': 'Offer', price: 1500, priceCurrency: 'EUR' },
      educationalCredentialAwarded: {
        '@type': 'EducationalOccupationalCredential',
        name: 'Certification CACES',
        recognizedBy: { '@type': 'Organization', name: 'Opérateur réglementaire' }
      }
    })
  })

  it('renvoie un document valide minimal avec le titre seul', () => {
    const minimal = {
      ...BASE,
      description: null,
      durationDays: null,
      durationHours: null,
      price: null,
      certification: null,
      certifierName: null,
      modalities: []
    }
    const ld = buildCourseJsonLd({ course: minimal, ...ctx }) as Record<string, unknown>

    expect(ld['@type']).toBe('Course')
    expect(ld.name).toBe('CACES R489 — chariots élévateurs')
    expect(ld).not.toHaveProperty('description')
    expect(ld).not.toHaveProperty('about')
    expect(ld).not.toHaveProperty('image')
    expect(ld).not.toHaveProperty('hasCourseInstance')
    expect(ld).not.toHaveProperty('offers')
    expect(ld).not.toHaveProperty('educationalCredentialAwarded')
    expect(JSON.stringify(ld)).toBeTruthy()
  })

  it('renvoie null sans titre (Google exige name)', () => {
    expect(buildCourseJsonLd({ course: { ...BASE, title: '' }, ...ctx })).toBeNull()
    expect(buildCourseJsonLd({ course: null, ...ctx })).toBeNull()
  })

  it('préfère seoDescription à la description WYSIWYG', () => {
    const ld = buildCourseJsonLd({
      course: { ...BASE, seoDescription: 'Résumé SEO éditorial.' },
      ...ctx
    }) as Record<string, unknown>
    expect(ld.description).toBe('Résumé SEO éditorial.')
  })

  it('déduplique les courseMode canoniques (intra/inter = onsite)', () => {
    const ld = buildCourseJsonLd({
      course: { ...BASE, modalities: ['intra', 'inter', 'presentiel'] },
      ...ctx
    }) as { hasCourseInstance: { courseMode: string[] } }
    expect(ld.hasCourseInstance.courseMode).toEqual(['onsite'])
  })

  it('mappe hybride sur blended et conserve le libellé des clés inconnues', () => {
    const ld = buildCourseJsonLd({
      course: { ...BASE, modalities: ['hybride', 'coaching-individuel'] },
      ...ctx
    }) as { hasCourseInstance: { courseMode: string[] } }
    expect(ld.hasCourseInstance.courseMode).toEqual(['blended', 'coaching-individuel'])
  })

  it('omet courseMode avec modalities null et omet workload sans durée', () => {
    const nullModalities = buildCourseJsonLd({
      course: { ...BASE, durationHours: null, modalities: null },
      ...ctx
    }) as { hasCourseInstance: Record<string, unknown> }
    expect(nullModalities.hasCourseInstance).not.toHaveProperty('courseMode')
    expect(nullModalities.hasCourseInstance.courseWorkload).toBeDefined()

    const noWorkload = buildCourseJsonLd({
      course: { ...BASE, durationDays: null, durationHours: null },
      ...ctx
    }) as { hasCourseInstance: Record<string, unknown> }
    expect(noWorkload.hasCourseInstance).not.toHaveProperty('courseWorkload')
  })

  it('courseWorkload retombe sur les jours sans heures', () => {
    const ld = buildCourseJsonLd({
      course: { ...BASE, durationHours: null, durationDays: 5, modalities: [] },
      ...ctx
    }) as { hasCourseInstance: { courseWorkload: string } }
    expect(ld.hasCourseInstance.courseWorkload).toBe('P5D')
  })

  it('omet offers quand le prix est nul ou absent (0 = sur devis)', () => {
    for (const price of [0, null] as const) {
      const ld = buildCourseJsonLd({ course: { ...BASE, price }, ...ctx }) as Record<
        string,
        unknown
      >
      expect(ld).not.toHaveProperty('offers')
    }
  })

  it('omet recognizedBy sans certifierName', () => {
    const ld = buildCourseJsonLd({
      course: { ...BASE, certifierName: null },
      ...ctx
    }) as { educationalCredentialAwarded: Record<string, unknown> }
    expect(ld.educationalCredentialAwarded).not.toHaveProperty('recognizedBy')
  })
})

const ARTICLE = {
  title: 'Recyclage CACES : échéance en 2027',
  excerpt: 'Les échéances de recyclage se rapprochent.',
  seo_description: 'Les échéances de recyclage CACES à anticiper.',
  publish_at: '2026-09-02T00:00:00.000Z',
  author_name: 'Équipe réglementation LEARN UP',
  category: { name: 'Réglementation & obligations' },
  region: 'Île-de-France'
}

const CENTRE = {
  name: 'Centre LEARN UP de Créteil',
  slug: 'creteil',
  description: '<p>Centre de formation en bord de Marne.</p>',
  short_description: 'Centre en bord de Marne.',
  seo_description: null,
  address: '12 rue de la Marne',
  city: 'Créteil',
  postal_code: '94000',
  department: 'Val-de-Marne',
  region: 'Île-de-France',
  phone: '01 23 45 67 89',
  email: 'creteil@learnup.fr',
  latitude: 48.79,
  longitude: 2.45,
  opening_hours: 'Lun–Ven 8h30–17h30'
}

describe('buildBreadcrumbJsonLd', () => {
  it('émet les positions ordonnées avec URLs absolues', () => {
    const ld = buildBreadcrumbJsonLd(
      [
        { label: 'Accueil', to: '/' },
        { label: 'Actualités', to: '/actualites/' },
        { label: 'Mon article' }
      ],
      'https://learnup.fr',
      '/actualites/mon-article/'
    ) as { itemListElement: Record<string, unknown>[] }

    expect(ld['@type']).toBe('BreadcrumbList')
    expect(ld.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://learnup.fr/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Actualités',
        item: 'https://learnup.fr/actualites/'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Mon article',
        item: 'https://learnup.fr/actualites/mon-article/'
      }
    ])
  })

  it('renvoie null sans élément et tolère les URLs déjà absolues', () => {
    expect(buildBreadcrumbJsonLd([], 'https://learnup.fr', '/x/')).toBeNull()
    const ld = buildBreadcrumbJsonLd(
      [{ label: 'Ext', to: 'https://ext.test/page' }],
      'https://learnup.fr',
      '/x/'
    ) as { itemListElement: { item?: string }[] }
    expect(ld.itemListElement[0]!.item).toBe('https://ext.test/page')
  })
})

describe('buildArticleJsonLd', () => {
  it('émet un Article complet avec auteur Person', () => {
    const ld = buildArticleJsonLd({
      article: ARTICLE,
      url: 'https://learnup.fr/actualites/recyclage-caces/',
      siteUrl: 'https://learnup.fr',
      imageUrl: 'https://api.test/assets/cover.png'
    }) as Record<string, unknown>

    expect(ld).toMatchObject({
      '@type': 'Article',
      headline: 'Recyclage CACES : échéance en 2027',
      description: 'Les échéances de recyclage CACES à anticiper.',
      inLanguage: 'fr',
      datePublished: '2026-09-02T00:00:00.000Z',
      articleSection: 'Réglementation & obligations',
      contentLocation: 'Île-de-France',
      author: { '@type': 'Person', name: 'Équipe réglementation LEARN UP' },
      publisher: { '@type': 'Organization', name: 'LEARN UP ACADEMY' },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://learnup.fr/actualites/recyclage-caces/'
      }
    })
  })

  it('retombe sur Organization sans nom d’auteur et null sans titre', () => {
    const ld = buildArticleJsonLd({
      article: { ...ARTICLE, author_name: null, seo_description: null, region: null },
      url: 'https://learnup.fr/a/',
      siteUrl: 'https://learnup.fr'
    }) as Record<string, unknown>
    expect(ld.author).toMatchObject({ '@type': 'Organization' })
    expect(ld).not.toHaveProperty('contentLocation')
    expect(ld.description).toBe('Les échéances de recyclage se rapprochent.')

    expect(buildArticleJsonLd({ article: null, url: 'https://x', siteUrl: 'https://x' })).toBeNull()
  })
})

describe('buildLocalBusinessJsonLd', () => {
  it('émet un LocalBusiness complet : adresse, géo, contact', () => {
    const ld = buildLocalBusinessJsonLd({
      centre: CENTRE,
      url: 'https://learnup.fr/centres/creteil/',
      siteUrl: 'https://learnup.fr'
    }) as Record<string, unknown>

    expect(ld).toMatchObject({
      '@type': 'LocalBusiness',
      name: 'Centre LEARN UP de Créteil',
      description: 'Centre en bord de Marne.',
      url: 'https://learnup.fr/centres/creteil/',
      telephone: '01 23 45 67 89',
      email: 'creteil@learnup.fr',
      openingHours: 'Lun–Ven 8h30–17h30',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '12 rue de la Marne',
        addressLocality: 'Créteil',
        postalCode: '94000',
        addressRegion: 'Val-de-Marne',
        addressCountry: 'FR'
      },
      geo: { '@type': 'GeoCoordinates', latitude: 48.79, longitude: 2.45 },
      parentOrganization: { '@type': 'Organization', name: 'LEARN UP ACADEMY' }
    })
  })

  it('omet adresse/géo/contact quand la donnée manque', () => {
    const ld = buildLocalBusinessJsonLd({
      centre: {
        ...CENTRE,
        address: null,
        city: null,
        postal_code: null,
        department: null,
        region: null,
        latitude: null,
        longitude: null,
        phone: null,
        email: null,
        opening_hours: null
      },
      url: 'https://learnup.fr/centres/x/',
      siteUrl: 'https://learnup.fr'
    }) as Record<string, unknown>

    for (const key of ['address', 'geo', 'telephone', 'email', 'openingHours']) {
      expect(ld).not.toHaveProperty(key)
    }
    expect(
      buildLocalBusinessJsonLd({ centre: null, url: 'https://x', siteUrl: 'https://x' })
    ).toBeNull()
  })
})

describe('jsonLdScriptTags', () => {
  it('échappe `<` en \\u003c et ignore les entrées nulles', async () => {
    const { jsonLdScriptTags } = await import('~/utils/jsonLd')
    const tags = jsonLdScriptTags([
      { '@type': 'Article', headline: '</script><script>alert(1)</script>' },
      null as unknown as Record<string, unknown>
    ])
    expect(tags).toHaveLength(1)
    expect(tags[0]!.type).toBe('application/ld+json')
    expect(tags[0]!.innerHTML).not.toContain('<')
    expect(tags[0]!.innerHTML).toContain('\\u003cscript>')
  })
})
