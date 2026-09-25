import type { Course } from '@learnup/types'
import { htmlToText } from './sanitizeHtml'
import { MODALITY_LABELS } from './catalog-filters'

/**
 * Données structurées schema.org/Course pour les rich results Google.
 * Requis par Google : `name`, `description`, `provider` — sans `name`
 * (formation sans titre) le document serait invalide : on renvoie null
 * plutôt qu'un JSON-LD tronqué. Tous les autres champs sont optionnels et
 * simplement omis quand la donnée manque.
 */
export function buildCourseJsonLd(input: {
  course: Course | null
  familyName?: string | null
  /** URL canonique de la fiche (absolue). */
  url: string
  /** URL du site — provider `sameAs`/`url`. */
  siteUrl: string
  /** Visuel déjà résolu en absolu (asset Directus ou URL Digiforma). */
  imageUrl?: string | null
}): Record<string, unknown> | null {
  const { course, familyName, url, siteUrl, imageUrl } = input
  if (!course?.title) return null

  const description = course.seoDescription ?? htmlToText(course.description)
  const courseModes = buildCourseModes(course.modalities)
  const workload = buildWorkload(course)

  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    ...(description ? { description } : {}),
    inLanguage: 'fr',
    url,
    provider: {
      '@type': 'Organization',
      name: 'LEARN UP ACADEMY',
      url: siteUrl,
      sameAs: siteUrl
    },
    ...(familyName ? { about: { '@type': 'Thing', name: familyName } } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(courseModes.length || workload
      ? {
          hasCourseInstance: {
            '@type': 'CourseInstance',
            ...(courseModes.length ? { courseMode: courseModes } : {}),
            ...(workload ? { courseWorkload: workload } : {})
          }
        }
      : {}),
    ...(course.price
      ? {
          offers: { '@type': 'Offer', price: course.price, priceCurrency: 'EUR', category: 'Paid' }
        }
      : {}),
    ...(course.certification
      ? {
          educationalCredentialAwarded: {
            '@type': 'EducationalOccupationalCredential',
            name: course.certification,
            ...(course.certifierName
              ? { recognizedBy: { '@type': 'Organization', name: course.certifierName } }
              : {})
          }
        }
      : {})
  }
}

// Google attend les tokens `onsite`/`online`/`blended` ; `intra`/`inter`
// sont des déclinaisons de présentiel. Clé inconnue → libellé français
// (courseMode accepte du Text libre — jamais d'erreur validateur).
const COURSE_MODE_TOKENS: Record<string, string> = {
  presentiel: 'onsite',
  distanciel: 'online',
  hybride: 'blended',
  intra: 'onsite',
  inter: 'onsite'
}

function buildCourseModes(modalities: string[] | null): string[] {
  const modes = new Set<string>()
  for (const modality of modalities ?? []) {
    modes.add(COURSE_MODE_TOKENS[modality] ?? MODALITY_LABELS[modality] ?? modality)
  }
  return [...modes]
}

// ISO 8601 : la charge de travail = heures de contenu quand elles sont
// connues, sinon les journées calendaires (cohérent avec durationLabel).
function buildWorkload(course: Course): string | null {
  if (course.durationHours && course.durationHours > 0) return `PT${course.durationHours}H`
  if (course.durationDays && course.durationDays > 0) return `P${course.durationDays}D`
  return null
}
