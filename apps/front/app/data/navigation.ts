// data/navigation.ts
// Contenu de référence restant pour les menus hors scope dynamique
// et les libellés des régions connues. Les familles de formation,
// les centres, les actualités et les pages légales sont chargés
// dynamiquement via useMenuData() (Directus + API catalogue).

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
