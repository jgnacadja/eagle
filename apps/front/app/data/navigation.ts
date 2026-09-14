// data/navigation.ts
// Contenu de référence restant pour les menus hors scope dynamique
// (à-propos, légal) et les libellés des régions connues. Les familles de
// formation, les centres et les actualités sont chargés dynamiquement via
// useMenuData() (Directus + API catalogue).

export interface Region {
  slug: string
  label: string
}

export const regions: Region[] = [
  { slug: 'ile-de-france', label: 'Île-de-France' },
  { slug: 'auvergne-rhone-alpes', label: 'Auvergne-Rhône-Alpes' },
  { slug: 'hauts-de-france', label: 'Hauts-de-France' },
  { slug: 'occitanie', label: 'Occitanie' },
  { slug: 'paca', label: 'Provence-Alpes-Côte d’Azur' },
  { slug: 'grand-est', label: 'Grand Est' }
]

export const aproposLiens = [
  {
    slug: 'qui-sommes-nous',
    label: 'Qui sommes-nous',
    description: 'La marque, la mission, notre franchise'
  },
  {
    slug: 'qualite-certifications',
    label: 'Qualité & certifications',
    description: 'Engagements & référentiels de niveau'
  },
  { slug: 'contact', label: 'Contact', description: 'Formulaire et coordonnées' }
]

export const legalLiens = [
  { slug: 'mentions-legales', label: 'Mentions légales' },
  { slug: 'confidentialite', label: 'Politique de confidentialité' },
  { slug: 'conditions-generales', label: 'Conditions générales' },
  { slug: 'accessibilite', label: 'Accessibilité — RGAA' },
  { slug: 'cookies', label: 'Gestion des cookies' }
]
