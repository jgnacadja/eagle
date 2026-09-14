// data/navigation.ts
// Contenu de référence restant pour les menus hors scope dynamique
// (actualités, à-propos, légal). Les familles de formation, les centres et
// les régions sont désormais chargés dynamiquement via useMenuData()
// (Directus + API catalogue).

export interface Region {
  slug: string
  label: string
}

export interface Actualite {
  slug: string
  tag: string
  date: string
  title: string
}

export const regions: Region[] = [
  { slug: 'ile-de-france', label: 'Île-de-France' },
  { slug: 'auvergne-rhone-alpes', label: 'Auvergne-Rhône-Alpes' },
  { slug: 'hauts-de-france', label: 'Hauts-de-France' },
  { slug: 'occitanie', label: 'Occitanie' },
  { slug: 'paca', label: 'Provence-Alpes-Côte d’Azur' },
  { slug: 'grand-est', label: 'Grand Est' }
]

export const actualitesParRegion: Record<string, Actualite[]> = {
  'ile-de-france': [
    {
      slug: 'recyclage-caces-echeances-2027-idf',
      tag: 'Réglementation',
      date: '3 sept. 2026',
      title: 'Recyclage CACES : anticiper les échéances 2027 en Île-de-France'
    },
    {
      slug: 'plateau-nacelles-pemp-creteil',
      tag: 'Vie du réseau',
      date: '28 août 2026',
      title: 'Nouveau plateau technique nacelles PEMP à Créteil'
    },
    {
      slug: 'ouverture-cergy-pontoise',
      tag: 'Vie du réseau',
      date: '21 août 2026',
      title: 'Un nouveau centre ouvre à Cergy-Pontoise'
    }
  ],
  'auvergne-rhone-alpes': [
    {
      slug: 'session-caces-lyon-septembre',
      tag: 'Nouvelles sessions',
      date: '1 sept. 2026',
      title: 'Nouvelles sessions CACES ouvertes à Lyon'
    }
  ],
  'hauts-de-france': [
    {
      slug: 'obligations-habilitations-hdf',
      tag: 'Réglementation',
      date: '25 août 2026',
      title: 'Habilitations électriques : ce qui change dans les Hauts-de-France'
    }
  ],
  occitanie: [
    {
      slug: 'ouverture-toulouse-management',
      tag: 'Vie du réseau',
      date: '19 août 2026',
      title: 'Le centre de Toulouse ouvre une offre management'
    }
  ]
}

export const rubriquesActualites = [
  { slug: 'toute-actualite', label: 'Toute l’actualité du réseau' },
  { slug: 'reglementation-obligations', label: 'Réglementation & obligations' },
  { slug: 'nouvelles-formations-sessions', label: 'Nouvelles formations & sessions' },
  { slug: 'vie-du-reseau-ouvertures', label: 'Vie du réseau & ouvertures' }
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
