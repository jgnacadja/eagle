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
  department: string | null
  region: string | null
  description: string | null
  /** Accroche courte (texte brut) affichée sur les cartes du réseau. */
  short_description: string | null
  specialties: string[] | null
  opening_hours: string | null
  transport: string | null
  parking: string | null
  pmr_accessible: boolean | null
  phone: string | null
  mobile: string | null
  email: string | null
  contact_name: string | null
  contact_role: string | null
  /** Date d'entrée dans le réseau — affichée « Franchisé depuis … » sur la fiche. */
  franchise_since: string | null
  departments_covered: string[] | null
  digiforma_url: string | null
  qualiopi_certified: boolean | null
  qualiopi_certificate_number: string | null
  qualiopi_certifier: string | null
  qualiopi_valid_until: string | null
  qualiopi_certificate: string | null
  image: string | null
  latitude: number | null
  longitude: number | null
}

/**
 * Sous-ensemble de `Centre` exposé par `GET /centres` (apps/api) — les
 * champs de contact, SEO et horaires ne sont renvoyés que par la fiche.
 */
export type CentreListItem = Pick<
  Centre,
  | 'id'
  | 'status'
  | 'slug'
  | 'name'
  | 'address'
  | 'city'
  | 'postal_code'
  | 'short_description'
  | 'department'
  | 'departments_covered'
  | 'region'
  | 'specialties'
  | 'latitude'
  | 'longitude'
>

export interface FamilleFormation extends SeoFields {
  id: number
  status: ContentStatus
  slug: string
  name: string
  intro: string | null
  icon: string | null
  /** UUID du fichier Directus — rendre via `${directusUrl}/assets/{id}`. */
  image: string | null
  /** Titre éditorial de la section sous-familles (repli : « Parcourir par sous-famille »). */
  subnav_title: string | null
  /** Contenu de la carte « Qui est concerné ? ». */
  audience_text: string | null
  /** Contenu de la carte « Validité et renouvellement ». */
  validity_text: string | null
}

export interface SousFamilleFormation {
  id: number
  status: ContentStatus
  slug: string
  name: string
  caption: string | null
  /** Relation M2O — id brut ou objet { slug } selon les fields demandés. */
  famille: number | { slug: string } | null
}

/** Sous-section de page légale — `anchor` sert d'ancre pour le sommaire. */
export interface PageLegaleSubsection {
  id: number
  sort: number | null
  /** Sans le numéro — le rendu ajoute « x.y » d'après `sort`. */
  title: string
  anchor: string
  /** HTML WYSIWYG — passer par sanitizeHtml avant v-html. */
  body: string | null
}

/** Section de page légale — `anchor` sert d'ancre pour le sommaire. */
export interface PageLegaleSection extends PageLegaleSubsection {
  /** Alias O2M — objets si les fields `sections.subsections.*` sont demandés. */
  subsections?: PageLegaleSubsection[] | null
}

export interface PageLegale extends SeoFields {
  id: number
  status: ContentStatus
  sort: number | null
  slug: string
  /** Libellé court utilisé par les onglets et les menus. */
  label: string
  title: string
  /** false = page hors onglets (ex. cookies), toujours accessible par son slug. */
  show_in_tabs: boolean | null
  sections: PageLegaleSection[] | null
  cta_label: string | null
  cta_to: string | null
  created_at: string | null
  updated_at: string | null
}

export interface ArticleCategory {
  id: number
  status: ContentStatus
  sort: number | null
  slug: string
  name: string
  description: string | null
}

export interface Article extends SeoFields {
  id: number
  status: ContentStatus
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  /** Relation M2O vers `categories` — toujours lue expansée (`category.name`, `category.slug`). */
  category: { slug: string; name: string } | null
  author_name: string | null
  author_image: string | null
  region: string | null
  /** Relation M2O vers `formations` — id brut ou objet partiel selon les fields demandés. */
  related_formation:
    | number
    | {
        slug: string
        status: ContentStatus
        famille: number | { slug: string; name: string | null } | null
      }
    | null
  publish_at: string | null
  centre: number | null
  cover_image: string | null
}

export interface Avis {
  id: number
  status: ContentStatus
  sort: number | null
  slug: string
  /** Libellé affiché en gras (ex. « Responsable logistique »). */
  author: string
  /** Affichée « mois année » après l'auteur. */
  published_at: string | null
  /** Note sur 5. */
  stars: number
  quote: string
  /** Relation M2O vers `centres` — null = avis marque (toutes implantations). */
  centre: number | null
}
