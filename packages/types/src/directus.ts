// Types de domaine — miroir des collections Directus modélisées en ST-11
// (directus/schema/collections.mjs est la source de vérité du schéma).

export type ContentStatus = 'draft' | 'published' | 'archived'

interface SeoFields {
  seo_title: string | null
  seo_description: string | null
  seo_canonical: string | null
}

export interface Centre extends SeoFields {
  id: number
  status: ContentStatus
  slug: string
  name: string
  address: string | null
  city: string | null
  postal_code: string | null
  phone: string | null
  email: string | null
  contact_name: string | null
  contact_role: string | null
  departments_covered: string[] | null
  digiforma_url: string | null
  qualiopi_certified: boolean | null
  qualiopi_certificate_number: string | null
  image: string | null
}

export interface FamilleFormation extends SeoFields {
  id: number
  status: ContentStatus
  slug: string
  name: string
  intro: string | null
  icon: string | null
}

export interface Article extends SeoFields {
  id: number
  status: ContentStatus
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  category: string | null
  publish_at: string | null
  centre: number | null
  cover_image: string | null
}
