import type { Course } from '@learnup/types'
import { describe, expect, it } from 'vitest'
import { buildCourseJsonLd } from '~/utils/jsonLd'

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
        url: ctx.siteUrl,
        sameAs: ctx.siteUrl
      },
      about: { '@type': 'Thing', name: "CACES & conduite d'engins" },
      image: ['https://api.test/assets/img.png'],
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: ['onsite', 'online'],
        courseWorkload: 'PT21H'
      },
      offers: { '@type': 'Offer', price: 1500, priceCurrency: 'EUR', category: 'Paid' },
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
