// View models des pages légales — alimentés depuis la collection Directus
// `pages_legales` (voir PageLegale dans @learnup/types) par la page [legal].

export interface LegalPageSection {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export interface LegalPageTab {
  slug: string
  label: string
}

export interface LegalPage {
  slug: string
  label: string
  title: string
  lastUpdated: string
  metaDescription: string
  sections: LegalPageSection[]
  cta: { label: string; to: string }
}
