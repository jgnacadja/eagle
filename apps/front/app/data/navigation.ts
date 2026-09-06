// data/navigation.ts
// Contenu de référence pour les mega-menus, calqué sur la maquette.
// À remplacer à terme par un appel CMS / API (mêmes formes de données).

export interface Famille {
  slug: string
  label: string
  count: number
}

export interface EnginType {
  slug: string
  label: string
  refs: string // ex: "R489 · R485"
  count: number
}

export interface FormationConsultee {
  slug: string
  label: string
}

export interface Region {
  slug: string
  label: string
  count: number
}

export interface Centre {
  slug: string
  name: string
  departement: string
  specialites: string
}

export interface Actualite {
  slug: string
  tag: string
  date: string
  title: string
}

export const familles: Famille[] = [
  { slug: 'securite-prevention', label: 'Sécurité & prévention', count: 32 },
  { slug: 'caces-conduite-engins', label: 'CACES & conduite d’engins', count: 58 },
  { slug: 'habilitations-electriques', label: 'Habilitations électriques', count: 19 },
  { slug: 'sante-secours', label: 'Santé & secours', count: 24 },
  { slug: 'management', label: 'Management', count: 12 },
  { slug: 'qualite-reglementaire', label: 'Qualité & réglementaire', count: 15 }
]

export const enginsCaces: EnginType[] = [
  { slug: 'chariots-gerbeurs', label: 'Chariots & gerbeurs', refs: 'R489 · R485', count: 11 },
  { slug: 'engins-chantier', label: 'Engins de chantier', refs: 'R482 · R372', count: 9 },
  { slug: 'nacelles-pemp', label: 'Nacelles — PEMP', refs: 'R486', count: 6 },
  { slug: 'grues-levage', label: 'Grues & levage', refs: 'R483 · R490', count: 8 }
]

export const formationsPlusConsultees: FormationConsultee[] = [
  { slug: 'caces-r489-chariots-elevateurs', label: 'CACES R489 — chariots élévateurs' },
  { slug: 'recyclage-caces-r489', label: 'Recyclage CACES R489 — toutes catégories' },
  { slug: 'caces-r482-engins-chantier', label: 'CACES R482 — engins de chantier' }
]

export const regions: Region[] = [
  { slug: 'ile-de-france', label: 'Île-de-France', count: 43 },
  { slug: 'auvergne-rhone-alpes', label: 'Auvergne-Rhône-Alpes', count: 26 },
  { slug: 'hauts-de-france', label: 'Hauts-de-France', count: 19 },
  { slug: 'occitanie', label: 'Occitanie', count: 27 },
  { slug: 'paca', label: 'Provence-Alpes-Côte d’Azur', count: 24 },
  { slug: 'grand-est', label: 'Grand Est', count: 22 }
]

export const centresParRegion: Record<string, Centre[]> = {
  'ile-de-france': [
    {
      slug: 'creteil',
      name: 'Centre de Créteil',
      departement: 'Val-de-Marne',
      specialites: 'CACES, sécurité, habilitations'
    },
    {
      slug: 'vitry-sur-seine',
      name: 'Centre de Vitry-sur-Seine',
      departement: 'Val-de-Marne',
      specialites: 'CACES, habilitations'
    },
    {
      slug: 'melun',
      name: 'Centre de Melun',
      departement: 'Seine-et-Marne',
      specialites: 'CACES, engins de chantier'
    },
    {
      slug: 'gennevilliers',
      name: 'Centre de Gennevilliers',
      departement: 'Hauts-de-Seine',
      specialites: 'logistique, secours'
    }
  ],
  'auvergne-rhone-alpes': [
    {
      slug: 'lyon',
      name: 'Centre de Lyon',
      departement: 'Rhône',
      specialites: 'CACES, sécurité'
    },
    {
      slug: 'grenoble',
      name: 'Centre de Grenoble',
      departement: 'Isère',
      specialites: 'habilitations, secours'
    }
  ],
  'hauts-de-france': [
    {
      slug: 'lille',
      name: 'Centre de Lille',
      departement: 'Nord',
      specialites: 'CACES, logistique'
    }
  ],
  occitanie: [
    {
      slug: 'toulouse',
      name: 'Centre de Toulouse',
      departement: 'Haute-Garonne',
      specialites: 'CACES, management'
    }
  ],
  paca: [
    {
      slug: 'marseille',
      name: 'Centre de Marseille',
      departement: 'Bouches-du-Rhône',
      specialites: 'CACES, sécurité'
    }
  ],
  'grand-est': [
    {
      slug: 'strasbourg',
      name: 'Centre de Strasbourg',
      departement: 'Bas-Rhin',
      specialites: 'habilitations, qualité'
    }
  ]
}

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
