// Données de démonstration — noms et contenus fictifs, pour développer en
// local sans dépendre des accès client. Ne pas utiliser en recette/prod.
// status: 'published' — sinon invisible pour le rôle Public (accès du
// site), qui ne lit que le contenu publié.

// Slugs alignés sur les `centreSlug` des sessions de la fixture Digiforma —
// la fiche formation ("Où suivre cette formation") et la fiche centre
// ("formations de ce centre") se rejoignent par ces slugs.
export const centres = [
  {
    slug: 'creteil',
    name: 'Centre LEARN UP de Créteil',
    status: 'published',
    address: '14 rue des Refuzniks',
    city: 'Créteil',
    postal_code: '94000',
    department: 'Val-de-Marne',
    region: 'Île-de-France',
    latitude: 48.7909,
    longitude: 2.4534,
    description:
      '<p>Le centre de Créteil couvre les formations réglementaires pour le Val-de-Marne et le sud-est francilien. Plateau technique de 2 400 m² : zone de conduite d’engins, structure de travaux en hauteur et salles d’habilitation électrique.</p>',
    specialties: ['CACES', 'Habilitations électriques', 'SST', 'Travaux en hauteur'],
    opening_hours: 'Lundi–vendredi · 8h30–17h30',
    transport: 'Métro 8 — Créteil Préfecture · Bus 117',
    parking: 'Parking visiteurs sur place',
    pmr_accessible: true,
    phone: '01 84 20 45 30',
    email: 'creteil@learnupacademy.fr',
    departments_covered: ['94', '93', '77'],
    qualiopi_certified: true,
    qualiopi_certificate_number: 'QUAL-2026-CRETEIL'
  },
  {
    slug: 'paris',
    name: 'Centre LEARN UP de Paris',
    status: 'published',
    address: '28 rue de Reuilly',
    city: 'Paris',
    postal_code: '75012',
    department: 'Paris',
    region: 'Île-de-France',
    latitude: 48.8481,
    longitude: 2.3859,
    description:
      '<p>Le centre de Paris accueille les formations tertiaires et management au cœur du 12e arrondissement, à deux pas de la gare de Lyon.</p>',
    specialties: ['Management', 'Bureautique', 'RSE'],
    opening_hours: 'Lundi–vendredi · 8h30–18h00',
    transport: 'Métro 1/8 — Reuilly-Diderot',
    parking: 'Parking public à 200 m',
    pmr_accessible: true,
    phone: '01 84 20 45 31',
    email: 'paris@learnupacademy.fr',
    departments_covered: ['75', '92', '93', '94'],
    qualiopi_certified: true,
    qualiopi_certificate_number: 'QUAL-2026-PARIS'
  },
  {
    slug: 'lyon',
    name: 'Centre LEARN UP de Lyon',
    status: 'published',
    address: '12 cours Lafayette',
    city: 'Lyon',
    postal_code: '69003',
    department: 'Rhône',
    region: 'Auvergne-Rhône-Alpes',
    latitude: 45.7599,
    longitude: 4.8492,
    description:
      '<p>Le centre de Lyon dessert la métropole et la région Auvergne-Rhône-Alpes, avec des salles modulables et un espace de pratique.</p>',
    specialties: ['Informatique', 'Management', 'Finance'],
    opening_hours: 'Lundi–vendredi · 8h30–17h30',
    transport: 'Métro B — Place Guichard',
    parking: 'Parking Lafayette souterrain',
    pmr_accessible: true,
    phone: '04 78 20 45 32',
    email: 'lyon@learnupacademy.fr',
    departments_covered: ['69', '01', '42', '38'],
    qualiopi_certified: true,
    qualiopi_certificate_number: 'QUAL-2026-LYON'
  },
  {
    slug: 'marseille',
    name: 'Centre LEARN UP de Marseille',
    status: 'published',
    address: '5 quai de la Joliette',
    city: 'Marseille',
    postal_code: '13002',
    department: 'Bouches-du-Rhône',
    region: 'Provence-Alpes-Côte d’Azur',
    latitude: 43.3002,
    longitude: 5.368,
    description:
      '<p>Le centre de Marseille couvre les formations réglementaires et tertiaires pour la région Sud.</p>',
    specialties: ['Santé', 'Sécurité', 'Marketing'],
    opening_hours: 'Lundi–vendredi · 9h00–17h00',
    transport: 'Métro 2 — Joliette · Tram T2/T3',
    parking: 'Parking Euroméditerranée',
    pmr_accessible: false,
    phone: '04 91 20 45 33',
    email: 'marseille@learnupacademy.fr',
    departments_covered: ['13', '84', '83'],
    qualiopi_certified: true,
    qualiopi_certificate_number: 'QUAL-2026-MARSEILLE'
  },
  {
    slug: 'lille',
    name: 'Centre LEARN UP de Lille',
    status: 'published',
    address: '40 rue des Canonniers',
    city: 'Lille',
    postal_code: '59000',
    department: 'Nord',
    region: 'Hauts-de-France',
    latitude: 50.6372,
    longitude: 3.0633,
    description:
      '<p>Le centre de Lille dessert le Nord-Pas-de-Calais, proche de la gare Lille-Flandres.</p>',
    specialties: ['Ressources humaines', 'Management'],
    opening_hours: 'Lundi–vendredi · 8h30–17h30',
    transport: 'Métro 1 — Rihour',
    parking: 'Parking Nouveau Siècle',
    pmr_accessible: true,
    phone: '03 20 20 45 34',
    email: 'lille@learnupacademy.fr',
    departments_covered: ['59', '62', '02'],
    qualiopi_certified: true,
    qualiopi_certificate_number: 'QUAL-2026-LILLE'
  },
  {
    slug: 'bordeaux',
    name: 'Centre LEARN UP de Bordeaux',
    status: 'published',
    address: '8 cours du Chapeau-Rouge',
    city: 'Bordeaux',
    postal_code: '33000',
    department: 'Gironde',
    region: 'Nouvelle-Aquitaine',
    latitude: 44.8412,
    longitude: -0.577,
    description:
      '<p>Le centre de Bordeaux couvre la Nouvelle-Aquitaine avec des sessions inter et des parcours intra sur site.</p>',
    specialties: ['RSE', 'Finance', 'Marketing'],
    opening_hours: 'Lundi–vendredi · 9h00–17h30',
    transport: 'Tram B — Grand Théâtre',
    parking: 'Parking Bourse-Jean Jaurès',
    pmr_accessible: true,
    phone: '05 56 20 45 35',
    email: 'bordeaux@learnupacademy.fr',
    departments_covered: ['33', '24', '47'],
    qualiopi_certified: true,
    qualiopi_certificate_number: 'QUAL-2026-BORDEAUX'
  },
  {
    slug: 'nantes',
    name: 'Centre LEARN UP de Nantes',
    status: 'published',
    address: '3 rue de la Barillerie',
    city: 'Nantes',
    postal_code: '44000',
    department: 'Loire-Atlantique',
    region: 'Pays de la Loire',
    latitude: 47.2131,
    longitude: -1.558,
    description:
      '<p>Le centre de Nantes dessert l’Ouest : formations réglementaires, tertiaires et ateliers pratiques.</p>',
    specialties: ['Santé', 'Informatique'],
    opening_hours: 'Lundi–vendredi · 8h30–17h30',
    transport: 'Tram 1 — Commerce',
    parking: 'Parking Commerce',
    pmr_accessible: true,
    phone: '02 40 20 45 36',
    email: 'nantes@learnupacademy.fr',
    departments_covered: ['44', '49', '85'],
    qualiopi_certified: true,
    qualiopi_certificate_number: 'QUAL-2026-NANTES'
  },
  {
    slug: 'toulouse',
    name: 'Centre LEARN UP de Toulouse',
    status: 'published',
    address: '17 rue d’Alsace-Lorraine',
    city: 'Toulouse',
    postal_code: '31000',
    department: 'Haute-Garonne',
    region: 'Occitanie',
    latitude: 43.6043,
    longitude: 1.4437,
    description: '<p>Le centre de Toulouse couvre l’Occitanie, entre Capitole et Jean-Jaurès.</p>',
    specialties: ['Management', 'RSE'],
    opening_hours: 'Lundi–vendredi · 9h00–17h30',
    transport: 'Métro A/B — Jean-Jaurès',
    parking: 'Parking Capitole',
    pmr_accessible: false,
    phone: '05 61 20 45 37',
    email: 'toulouse@learnupacademy.fr',
    departments_covered: ['31', '81', '82'],
    qualiopi_certified: true,
    qualiopi_certificate_number: 'QUAL-2026-TOULOUSE'
  }
]

// Slugs alignés sur les catégories du catalogue Digiforma (fixture dev) —
// la page famille /formations/[famille] lit ces enregistrements.
export const famillesFormation = [
  {
    slug: 'finance',
    name: 'Finance & Comptabilité',
    intro: "<p>Piloter la gestion, la comptabilité et la finance d'entreprise.</p>",
    imageUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&q=80',
    status: 'published'
  },
  {
    slug: 'informatique',
    name: 'Informatique & Digital',
    intro: '<p>Développement, data et cybersécurité pour les équipes IT.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop&q=80',
    status: 'published'
  },
  {
    slug: 'management',
    name: 'Management & Leadership',
    intro: "<p>Développer les compétences managériales et le pilotage d'équipe.</p>",
    imageUrl:
      'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=800&h=600&fit=crop&q=80',
    status: 'published'
  },
  {
    slug: 'marketing',
    name: 'Marketing & Communication',
    intro: "<p>Stratégie marketing, digital et communication d'entreprise.</p>",
    imageUrl:
      'https://images.unsplash.com/photo-1569227997603-33b9f12af927?w=800&h=600&fit=crop&q=80',
    status: 'published'
  },
  {
    slug: 'ressources-humaines',
    name: 'Ressources Humaines',
    intro: '<p>Recrutement, paie, droit social et développement RH.</p>',
    imageUrl:
      'https://images.unsplash.com/photo-1603206004639-22635b71ac08?w=800&h=600&fit=crop&q=80',
    status: 'published'
  },
  {
    slug: 'rse',
    name: 'RSE & Développement durable',
    intro: '<p>Stratégie RSE, reporting extra-financier et transition écologique.</p>',
    imageUrl:
      'https://images.unsplash.com/photo-1695668548342-c0c1ad479aee?w=800&h=600&fit=crop&q=80',
    status: 'published'
  },
  {
    slug: 'sante',
    name: 'Santé & Secours',
    intro: '<p>Santé au travail, secourisme et prévention des risques professionnels.</p>',
    imageUrl:
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&h=600&fit=crop&q=80',
    status: 'published'
  }
]

export const articles = [
  {
    slug: 'formation-sst-sensibilisation-risque',
    title: 'La sensibilisation aux risques au cœur de la formation SST',
    status: 'published',
    excerpt:
      'Découvrez comment la sensibilisation aux risques transforme la culture sécurité dans les équipes opérationnelles.',
    content:
      '<p>La formation SST permet aux équipes de mieux comprendre les risques professionnels, repérer les situations à vigilance et agir avant qu’un incident ne survienne.</p><p>Au-delà de la conformité, l’objectif est de faire grandir une culture de prévention partagée par tous.</p>',
    category: 'SST & sécurité',
    author_name: 'Claire Martin',
    author_imageUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    region: 'Île-de-France',
    related_formation_slug: 'sst-securite-travail',
    publish_at: '2026-09-01T09:00:00+00:00',
    centre: 1,
    cover_imageUrl:
      'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=80',
    seo_title: 'Sensibilisation SST et prévention des risques',
    seo_description:
      'Apprenez comment la sensibilisation aux risques renforce la culture sécurité dans les organisations.',
    seo_canonical: 'https://learnup.fr/actualites/formation-sst-sensibilisation-risque'
  },
  {
    slug: 'management-formation-pilotage-equipe',
    title: 'Manager une équipe à plusieurs niveaux d’exigence',
    status: 'published',
    excerpt:
      'Le management de proximité s’appuie sur des repères clairs, une cadence de suivi et une culture de confiance.',
    content:
      '<p>Les managers modernes doivent articuler objectifs, qualité de service et bien-être au travail.</p><p>Une équipe performante part d’un cadre partagé, de feedbacks réguliers et d’une pédagogie adaptée aux situations rencontrées.</p>',
    category: 'Management',
    author_name: 'Lucie Bernard',
    author_imageUrl:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80',
    region: 'Paris',
    related_formation_slug: 'management',
    publish_at: '2026-09-05T09:00:00+00:00',
    centre: 2,
    cover_imageUrl:
      'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?auto=format&fit=crop&w=1400&q=80',
    seo_title: 'Management et pilotage d’équipe',
    seo_description:
      'Des leviers concrets pour accompagner une équipe, clarifier les priorités et sécuriser la performance.',
    seo_canonical: 'https://learnup.fr/actualites/management-formation-pilotage-equipe'
  },
  {
    slug: 'digitalisation-competences-ia',
    title: 'La donnée et l’IA au service de la transformation digitale',
    status: 'published',
    excerpt:
      'La transformation digitale s’appuie sur la qualité des usages, la capacité d’analyse et la confiance des équipes.',
    content:
      '<p>Les organisations qui réussissent leur transition numérique donnent du sens aux usages de la donnée et de l’intelligence artificielle.</p><p>Pour aller plus loin, il faut résoudre les compétences, organiser les processus et sécuriser les usages.</p>',
    category: 'Informatique & Digital',
    author_name: 'Nicolas Fabre',
    author_imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    region: 'Lyon',
    related_formation_slug: 'informatique-digital',
    publish_at: '2026-09-10T09:00:00+00:00',
    centre: 3,
    cover_imageUrl:
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80',
    seo_title: 'Digitalisation, données et IA pour les équipes',
    seo_description:
      'Comment faire de la transformation digitale un levier pédagogique, opérationnel et durable.',
    seo_canonical: 'https://learnup.fr/actualites/digitalisation-competences-ia'
  }
]
