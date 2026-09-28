// View models des pages légales — alimentés depuis les collections
// Directus `pages_legales` + `pages_legales_sections`/`_subsections`
// (voir PageLegale dans @learnup/types) par la page [slug].

export interface LegalPageSubsection {
  /** Ancre HTML — id DOM de la section et cible des liens du sommaire. */
  id: string
  /** Numéro affiché (« 1 » / « 1.1 ») — calculé depuis l'ordre de tri. */
  number: string
  title: string
  /** HTML sanitizé — rendu via v-html. */
  body: string | null
}

export interface LegalPageSection extends LegalPageSubsection {
  subsections: LegalPageSubsection[]
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
  sections: LegalPageSection[]
  cta: { label: string; to: string }
}
