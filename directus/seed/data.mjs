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
    address: '14 rue des Refuzniks, 94000 Créteil',
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
    slug: 'caces-conduite-engins',
    name: "CACES & conduite d'engins",
    intro:
      '<p>Conduite d’engins de chantier et de manutention : CACES R482, R483, R484, R485, R486, R489.</p>',
    imageUrl:
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop&q=80',
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

// Sous-familles éditoriales — `familleSlug` est résolu en id de
// familles_formation par seed.mjs avant l'upsert.
export const sousFamillesFormation = [
  {
    slug: 'developpement',
    name: 'Développement',
    caption: 'Web, mobile & logiciel',
    familleSlug: 'informatique',
    status: 'published'
  },
  {
    slug: 'data-ia',
    name: 'Data & IA',
    caption: 'Analyse, ML & IA générative',
    familleSlug: 'informatique',
    status: 'published'
  },
  {
    slug: 'cybersecurite',
    name: 'Cybersécurité',
    caption: 'Sécurité des SI & bonnes pratiques',
    familleSlug: 'informatique',
    status: 'published'
  },
  {
    slug: 'cloud-infra',
    name: 'Cloud & infrastructure',
    caption: 'AWS, Azure & DevOps',
    familleSlug: 'informatique',
    status: 'published'
  },
  {
    slug: 'pilotage-projet',
    name: 'Pilotage de projet',
    caption: 'Méthodes & outils projet',
    familleSlug: 'management',
    status: 'published'
  },
  {
    slug: 'communication-cohesion',
    name: 'Communication & cohésion',
    caption: 'Équipes & relations',
    familleSlug: 'management',
    status: 'published'
  },
  {
    slug: 'comptabilite-gestion',
    name: 'Comptabilité & gestion',
    caption: 'Comptes, budget & contrôle',
    familleSlug: 'finance',
    status: 'published'
  },
  {
    slug: 'marketing-digital',
    name: 'Marketing digital',
    caption: 'Stratégie, SEO & campagnes',
    familleSlug: 'marketing',
    status: 'published'
  },
  {
    slug: 'droit-social',
    name: 'Droit social',
    caption: 'Paie, contrats & relations sociales',
    familleSlug: 'ressources-humaines',
    status: 'published'
  },
  {
    slug: 'strategie-rse',
    name: 'Stratégie RSE',
    caption: 'Reporting & transition',
    familleSlug: 'rse',
    status: 'published'
  },
  {
    slug: 'secourisme-prevention',
    name: 'Secourisme & prévention',
    caption: 'SST & risques professionnels',
    familleSlug: 'sante',
    status: 'published'
  },
  {
    slug: 'chariots-elevateurs',
    name: 'Chariots élévateurs',
    caption: 'R489 · R485',
    familleSlug: 'caces-conduite-engins',
    status: 'published'
  }
]

// Formation de démonstration — reproduit la fiche « CACES R489 » de la
// maquette catalogue pour développer sans accès Digiforma. `digiforma_id`
// préfixé seed- : la sync ne la touchera jamais (upsert par digiforma_id
// réel uniquement). familleSlug / sousFamilleSlug résolus en ids par
// seed.mjs.
export const formations = [
  {
    digiforma_id: 'seed-caces-r489',
    slug: 'caces-r489-conduite-de-chariots-elevateurs',
    status: 'published',
    title: 'CACES R489 — Conduite de chariots élévateurs',
    description:
      'Conduire en sécurité les chariots de manutention à conducteur porté, catégories 1A à 5, conformément à la recommandation R489 de l’Assurance Maladie.',
    duration_days: 5,
    duration_hours: 35,
    price: 690,
    cpf: false,
    cpf_code: null,
    certification: 'CACES® R489',
    certifier_name: 'Organisme testeur certifié',
    category_name: 'CACES',
    modalities: ['presentiel', 'inter', 'intra'],
    center_slug: 'creteil',
    center_slugs: ['creteil', 'paris', 'lyon'],
    sessions: [
      {
        id: 'seed-sess-1',
        startDate: '2026-10-12',
        endDate: '2026-10-14',
        modality: 'presentiel',
        seatsRemaining: 5,
        location: {
          name: 'Centre de Créteil',
          city: 'Créteil',
          postalCode: '94000',
          department: 'Val-de-Marne',
          region: 'Île-de-France',
          centreSlug: 'creteil'
        }
      },
      {
        id: 'seed-sess-1b',
        startDate: '2026-10-26',
        endDate: '2026-10-30',
        modality: 'presentiel',
        seatsRemaining: 8,
        location: {
          name: 'Centre de Créteil',
          city: 'Créteil',
          postalCode: '94000',
          department: 'Val-de-Marne',
          region: 'Île-de-France',
          centreSlug: 'creteil'
        }
      },
      {
        id: 'seed-sess-2',
        startDate: '2026-10-19',
        endDate: '2026-10-21',
        modality: 'presentiel',
        seatsRemaining: 2,
        location: {
          name: 'Centre de Paris',
          city: 'Paris',
          postalCode: '75012',
          department: 'Paris',
          region: 'Île-de-France',
          centreSlug: 'paris'
        }
      },
      {
        id: 'seed-sess-3',
        startDate: '2026-11-03',
        endDate: '2026-11-07',
        modality: 'presentiel',
        seatsRemaining: 8,
        location: {
          name: 'Centre de Lyon',
          city: 'Lyon',
          postalCode: '69003',
          department: 'Rhône',
          region: 'Auvergne-Rhône-Alpes',
          centreSlug: 'lyon'
        }
      }
    ],
    locations_text: 'Créteil Val-de-Marne Paris Lyon Rhône',
    blocks: [
      {
        name: 'Réglementation et prévention des risques',
        subtitle:
          'Rôles des instances, responsabilités du conducteur, dispositifs de sécurité, EPI.',
        description:
          '<p>Cadre réglementaire applicable à la conduite d’équipements de manutention : responsabilités du conducteur et de l’employeur, rôle des instances (CACES®, inspection du travail), dispositifs de sécurité et EPI obligatoires.</p><p>Le module couvre la lecture de la plaque de charge, les situations à risque et les procédures d’arrêt d’urgence.</p>',
        goals: [
          { text: 'Comprendre la réglementation applicable et les responsabilités du conducteur.' },
          { text: 'Identifier les risques liés à l’utilisation d’un chariot de manutention.' }
        ],
        position: 1,
        type: 'theorie',
        durationInHours: 3.5
      },
      {
        name: 'Technologie et fonctionnement des chariots',
        subtitle: 'Catégories, organes de service, stabilité, plaque de charge, vérifications.',
        description:
          '<p>Classification des chariots (frontaux, rétractables, gerbeurs), organes de service, règles de stabilité et lecture de la plaque de charge.</p><ul><li>Vérifications de prise et de fin de poste.</li><li>Conduite et manœuvres en sécurité.</li></ul>',
        goals: [
          {
            text: 'Mettre en œuvre les vérifications de prise et de fin de poste, la conduite et les manœuvres en sécurité.'
          }
        ],
        position: 2,
        type: 'theorie',
        durationInHours: 3.5
      },
      {
        name: 'Conduite, circulation et manutention',
        subtitle: 'Prise de poste, circulation à vide et en charge, gerbage, stockage, chargement.',
        description:
          '<p>Mises en situation sur plateau technique : prise de poste, circulation à vide et en charge, gerbage, stockage et chargement en conditions réelles.</p>',
        goals: [{ text: 'Évaluer et rendre compte des anomalies et difficultés rencontrées.' }],
        position: 3,
        type: 'pratique',
        durationInHours: 10.5
      },
      {
        name: 'Tests CACES® théorique et pratique',
        subtitle: 'Épreuves conformes au référentiel R489, par catégorie présentée.',
        description:
          '<p>Évaluation théorique (QCM) puis épreuve pratique par catégorie d’engin présentée, conformément au référentiel CACES® R489.</p>',
        goals: [],
        position: 4,
        type: 'evaluation',
        durationInHours: 3.5
      }
    ],
    pedagogy: [
      {
        title: 'Inter, en centre.',
        description: 'Sessions planifiées sur plateau technique, engins fournis.'
      },
      {
        title: 'Intra, sur site.',
        description: 'Dans votre entreprise, sur vos équipements et vos flux réels.'
      }
    ],
    evaluation: [
      'Test théorique — questionnaire conforme au référentiel R489.',
      'Épreuve pratique — manœuvres en situation, par catégorie.',
      'Délivrance du CACES® en cas de réussite aux deux épreuves.'
    ],
    validity: '5 ans · recyclage',
    imageUrl:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=80',
    generated_program_url: null,
    familleSlug: 'caces-conduite-engins',
    sousFamilleSlug: 'chariots-elevateurs',
    raw: {
      targets: [
        { text: 'Caristes débutants ou expérimentés' },
        { text: 'Salariés des fonctions logistique, production, magasinage' },
        { text: 'Nouveaux arrivants amenés à conduire un chariot' },
        { text: 'Personnes soumises à l’obligation de renouvellement (recyclage)' }
      ],
      prerequisites: [
        { text: 'Être âgé de 18 ans minimum' },
        { text: 'Aptitude médicale à la conduite délivrée par la médecine du travail' },
        { text: 'Comprendre le français (consignes écrites et orales)' }
      ]
    },
    seo_title: 'CACES R489 — Conduite de chariots élévateurs',
    seo_description:
      'Formation CACES R489 : conduite de chariots élévateurs catégories 1A à 5, en inter ou en intra.'
  },
  // Variante « sans sessions » : fiche complète côté contenu éditorial mais
  // aucune session planifiée — permet de tester l'état vide « Aucune session
  // programmée » et l'absence de la section « Où suivre cette formation ».
  {
    digiforma_id: 'seed-sst-initial',
    slug: 'sst-sauveteur-secouriste-du-travail',
    status: 'published',
    title: 'SST — Sauveteur secouriste du travail',
    description:
      'Former des sauveteurs secouristes capables d’intervenir face à une situation d’accident du travail et de contribuer à la prévention des risques professionnels, conformément au référentiel INRS.',
    duration_days: 2,
    duration_hours: 14,
    price: 280,
    cpf: false,
    cpf_code: null,
    certification: 'SST — INRS',
    certifier_name: 'Institut national de recherche et de sécurité (INRS)',
    category_name: 'Secourisme',
    modalities: ['presentiel', 'inter', 'intra'],
    center_slug: 'creteil',
    center_slugs: ['creteil'],
    sessions: [],
    locations_text: 'Créteil Val-de-Marne',
    blocks: [
      {
        name: 'Intervenir face à une situation d’accident',
        description:
          'Protéger, examiner, alerter et secourir — conduite à tenir face à une victime.',
        goals: [
          {
            text: 'Appliquer la conduite à tenir face à une situation d’accident du travail.'
          }
        ],
        position: 1,
        type: 'pratique',
        durationInHours: 7
      },
      {
        name: 'Être acteur de prévention dans son équipe',
        description:
          'Repérer les situations dangereuses, alerter la hiérarchie, participer aux actions de prévention.',
        goals: [
          {
            text: 'Repérer et signaler les situations dangereuses dans son périmètre d’activité.'
          }
        ],
        position: 2,
        type: 'theorie',
        durationInHours: 7
      }
    ],
    pedagogy: [
      {
        title: 'Inter, en centre.',
        description: 'Sessions planifiées en salle équipée, mannequins et matériel fournis.'
      },
      {
        title: 'Intra, sur site.',
        description: 'Dans votre entreprise, adaptée à vos situations de travail réelles.'
      }
    ],
    evaluation: [
      'Évaluation continue pendant les mises en situation pratiques.',
      'Mise en situation finale — conduite à tenir face à une victime.',
      'Délivrance du certificat SST en cas de réussite.'
    ],
    validity: '2 ans · recyclage MAC',
    generated_program_url: null,
    familleSlug: 'sante',
    sousFamilleSlug: 'secourisme-prevention',
    raw: {
      targets: [
        { text: 'Salariés désignés sauveteurs secouristes du travail' },
        { text: 'Membres des instances de prévention' }
      ],
      prerequisites: [{ text: 'Aucun prérequis particulier' }]
    },
    seo_title: 'SST — Sauveteur secouriste du travail',
    seo_description:
      'Formation SST initiale : intervenir face à un accident du travail et devenir acteur de prévention, certificat INRS.'
  },
  // Variante « éditorial minimal » : pas de modalités pédagogiques, pas
  // d'évaluation, pas de validité, pas de prérequis — les cartes et lignes
  // correspondantes doivent disparaître sans casser la page. La seule
  // session est passée : le centre s'affiche en état neutre « Sur demande ».
  {
    digiforma_id: 'seed-gestion-stress',
    slug: 'gestion-du-stress-et-prevention-rps',
    status: 'published',
    title: 'Gestion du stress et prévention des RPS',
    description:
      'Identifier les sources de stress au travail, acquérir des techniques de régulation et contribuer à la prévention des risques psychosociaux.',
    duration_days: 1,
    duration_hours: 7,
    price: 390,
    cpf: false,
    cpf_code: null,
    certification: null,
    certifier_name: null,
    category_name: 'Bien-être au travail',
    modalities: ['presentiel', 'distanciel'],
    center_slug: 'paris',
    center_slugs: ['paris'],
    sessions: [
      {
        id: 'seed-sess-5',
        startDate: '2026-08-25',
        endDate: '2026-08-25',
        modality: 'presentiel',
        seatsRemaining: 0,
        location: {
          name: 'Centre de Paris',
          city: 'Paris',
          postalCode: '75012',
          department: 'Paris',
          region: 'Île-de-France',
          centreSlug: 'paris'
        }
      }
    ],
    locations_text: 'Paris',
    blocks: [
      {
        name: 'Comprendre les mécanismes du stress',
        description:
          'Réponses physiologiques, facteurs organisationnels, distinction stress ponctuel et chronique.',
        goals: [{ text: 'Identifier ses propres signaux de stress et leurs déclencheurs.' }],
        position: 1,
        type: 'theorie',
        durationInHours: 3.5
      },
      {
        name: 'Techniques de régulation et plan d’action',
        description:
          'Respiration, recentrage, gestion de la charge — élaboration d’un plan personnel.',
        goals: [{ text: 'Mettre en place un plan d’action individuel de prévention.' }],
        position: 2,
        type: 'pratique',
        durationInHours: 3.5
      }
    ],
    pedagogy: null,
    evaluation: null,
    validity: null,
    generated_program_url: null,
    familleSlug: 'ressources-humaines',
    sousFamilleSlug: 'droit-social',
    raw: {
      targets: [
        { text: 'Tout salarié exposé à des situations de tension' },
        { text: 'Managers et fonctions RH' }
      ],
      prerequisites: []
    },
    seo_title: 'Gestion du stress et prévention des RPS',
    seo_description:
      'Formation gestion du stress : identifier les risques psychosociaux et acquérir des techniques de régulation.'
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
