// data/navigation.ts
// Contenu de référence restant pour les menus hors scope dynamique
// (à-propos) et les libellés des régions connues. Les familles de
// formation, les centres, les actualités et les pages légales sont
// chargés dynamiquement via useMenuData() (Directus + API catalogue).

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
    description: 'La marque, le réseau, notre fonctionnement'
  },
  {
    slug: 'qualite-certifications',
    label: 'Qualité & certifications',
    description: 'Engagements et référentiels du réseau'
  },
  {
    slug: 'contact',
    label: 'Contact',
    description: 'Formulaire et coordonnées'
  },
  {
    slug: 'entreprise-reseau',
    label: 'Le réseau et ses partenaires',
    description: 'Devenir partenaire de LEARN UP ACADEMY'
  }
]
