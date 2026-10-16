import type { Article, Centre, Course } from '@learnup/types'
import { articleCategory } from './article'
import { htmlToText } from './sanitizeHtml'
import { MODALITY_LABELS } from './catalog-filters'

/**
 * Sérialise un graphe JSON-LD en entrées `script` pour `useHead`.
 * `</script>` dans une chaîne casserait le document (ou pire) —
 * échappement standard `<` → `<`, invisible pour les parsers.
 */
export function jsonLdScriptTags(
  input: Record<string, unknown> | Record<string, unknown>[] | null | undefined
): { type: 'application/ld+json'; innerHTML: string }[] {
  const items = Array.isArray(input) ? input : [input]
  const entries = items.filter(
    (entry): entry is Record<string, unknown> =>
      Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry)
  )
  return entries.map((entry) => ({
    type: 'application/ld+json',
    innerHTML: JSON.stringify(entry).replaceAll('<', String.raw`\u003c`)
  }))
}

/** Item de fil d'Ariane (route.meta.breadcrumb) — `to` absent sur l'élément courant. */
export interface BreadcrumbJsonLdItem {
  label: string
  to?: string
}

/**
 * Données structurées BreadcrumbList — miroir exact du fil affiché.
 * `origin` rend les URLs absolues (exigé par Google) ; le dernier élément,
 * sans `to` par convention, pointe l'URL courante.
 */
export function buildBreadcrumbJsonLd(
  items: BreadcrumbJsonLdItem[],
  origin: string,
  currentPath: string
): Record<string, unknown> | null {
  if (!items.length) return null
  const absolute = (to: string | undefined, fallbackPath: string) => {
    if (!to) return `${origin}${fallbackPath}`
    return to.startsWith('http') ? to : `${origin}${to}`
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const isLast = index === items.length - 1
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: item.to || isLast ? absolute(item.to, currentPath) : undefined
      }
    })
  }
}

/**
 * Article schema.org (rich result). `headline` ≤ 110 caractères per Google.
 * Auteur : `Person` si un nom éditorial existe, sinon la marque.
 */
export function buildArticleJsonLd(input: {
  article: Pick<
    Article,
    'title' | 'excerpt' | 'seo_description' | 'publish_at' | 'author_name' | 'category' | 'region'
  > | null
  /** URL canonique absolue de l'article. */
  url: string
  siteUrl: string
  /** Visuel de couverture déjà résolu en absolu. */
  imageUrl?: string | null
}): Record<string, unknown> | null {
  const { article, url, siteUrl, imageUrl } = input
  if (!article?.title) return null

  const description = article.seo_description ?? article.excerpt
  const section = articleCategory(article.category)?.name
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title.slice(0, 110),
    ...(description ? { description } : {}),
    inLanguage: 'fr',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(article.publish_at ? { datePublished: article.publish_at } : {}),
    author: article.author_name
      ? { '@type': 'Person', name: article.author_name }
      : { '@type': 'Organization', name: 'LEARN UP ACADEMY', url: siteUrl },
    publisher: {
      '@type': 'Organization',
      name: 'LEARN UP ACADEMY',
      url: siteUrl,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/images/learn-up-academy.svg` }
    },
    ...(section ? { articleSection: section } : {}),
    ...(article.region ? { contentLocation: article.region } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {})
  }
}

/**
 * LocalBusiness schema.org pour une fiche centre du réseau. Adresse,
 * géolocalisation et contact omis proprement quand la donnée manque —
 * un LocalBusiness sans adresse reste valide.
 */
type LocalBusinessCentre = Pick<
  Centre,
  | 'name'
  | 'slug'
  | 'description'
  | 'short_description'
  | 'seo_description'
  | 'address'
  | 'city'
  | 'postal_code'
  | 'department'
  | 'region'
  | 'phone'
  | 'email'
  | 'latitude'
  | 'longitude'
  | 'opening_hours'
>

function buildPostalAddress(centre: LocalBusinessCentre): Record<string, unknown> | null {
  if (!centre.address && !centre.city && !centre.postal_code) return null
  const region = centre.department ?? centre.region
  return {
    '@type': 'PostalAddress',
    ...(centre.address ? { streetAddress: centre.address } : {}),
    ...(centre.city ? { addressLocality: centre.city } : {}),
    ...(centre.postal_code ? { postalCode: centre.postal_code } : {}),
    ...(region ? { addressRegion: region } : {}),
    addressCountry: 'FR'
  }
}

function buildGeoCoordinates(centre: LocalBusinessCentre): Record<string, unknown> | null {
  if (centre.latitude == null || centre.longitude == null) return null
  return {
    '@type': 'GeoCoordinates',
    latitude: centre.latitude,
    longitude: centre.longitude
  }
}

export function buildLocalBusinessJsonLd(input: {
  centre: LocalBusinessCentre | null
  /** URL canonique absolue de la fiche. */
  url: string
  siteUrl: string
  imageUrl?: string | null
}): Record<string, unknown> | null {
  const { centre, url, siteUrl, imageUrl } = input
  if (!centre?.name) return null

  const description =
    centre.seo_description ?? centre.short_description ?? htmlToText(centre.description)
  const address = buildPostalAddress(centre)
  const geo = buildGeoCoordinates(centre)

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: centre.name,
    ...(description ? { description } : {}),
    url,
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(address ? { address } : {}),
    ...(geo ? { geo } : {}),
    ...(centre.phone ? { telephone: centre.phone } : {}),
    ...(centre.email ? { email: centre.email } : {}),
    ...(centre.opening_hours ? { openingHours: centre.opening_hours } : {}),
    parentOrganization: {
      '@type': 'Organization',
      name: 'LEARN UP ACADEMY',
      url: siteUrl
    }
  }
}

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
  /** URL du site — provider `url`. */
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
      url: siteUrl
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
          offers: { '@type': 'Offer', price: course.price, priceCurrency: 'EUR' }
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
