// 5 rôles RBAC (ST-11). "super-admin" = rôle Administrator natif de
// Directus (bypass total, existe déjà) — les 4 autres sont créés ici.
//
// Directus 11 sépare rôle et permissions via une Policy intermédiaire
// (role -> directus_access -> policy -> permissions), pas un champ `role`
// direct sur les permissions comme dans les versions antérieures. Une
// policy par rôle ici — mapping le plus simple pour ce cas d'usage.

export const roles = [
  {
    name: 'admin',
    icon: 'admin_panel_settings',
    description: 'Accès complet au contenu, hors administration système.'
  },
  { name: 'editeur', icon: 'edit', description: 'Crée et édite le contenu en brouillon.' },
  { name: 'moderateur', icon: 'fact_check', description: 'Relit et publie le contenu.' },
  { name: 'lecteur', icon: 'visibility', description: 'Lecture seule, aucune écriture.' }
]

const CONTENT_COLLECTIONS = [
  'centres',
  'familles_formation',
  'sous_familles_formation',
  'articles',
  'avis',
  'pages',
  'page_blocks',
  'pages_legales',
  'stats',
  'formations'
]

function grants(collection, actions) {
  return actions.map((action) => ({ collection, action }))
}

/** @returns {Array<{collection: string, action: string}>} */
export function permissionsFor(roleName) {
  switch (roleName) {
    case 'admin':
      return [...CONTENT_COLLECTIONS, 'directus_files'].flatMap((c) =>
        grants(c, ['create', 'read', 'update', 'delete'])
      )

    case 'editeur':
      return [
        ...['articles', 'avis', 'page_blocks', 'sous_familles_formation'].flatMap((c) =>
          grants(c, ['create', 'read', 'update'])
        ),
        ...['centres', 'familles_formation', 'pages', 'pages_legales', 'stats'].flatMap((c) =>
          grants(c, ['read'])
        ),
        ...grants('directus_files', ['create', 'read']),
        { collection: 'formations', action: 'read' },
        {
          collection: 'formations',
          action: 'update',
          // Tous les champs contenu + éditoriaux ; hors techniques
          // (digiforma_id, raw, timestamps) et status
          // (publication réservée au modérateur).
          fields: [
            'sort',
            'slug',
            'title',
            'description',
            'duration_days',
            'duration_hours',
            'price',
            'cpf',
            'cpf_code',
            'certification',
            'certifier_name',
            'category_name',
            'modalities',
            'center_slug',
            'center_slugs',
            'sessions',
            'locations_text',
            'blocks',
            'generated_program_url',
            'famille',
            'sous_famille',
            'pedagogy',
            'evaluation',
            'validity',
            'image',
            'seo_title',
            'seo_description',
            'seo_canonical'
          ]
        }
      ]

    case 'moderateur':
      return [
        ...['articles', 'avis', 'page_blocks'].flatMap((c) => grants(c, ['read', 'update'])),
        ...[
          'centres',
          'familles_formation',
          'sous_familles_formation',
          'pages',
          'pages_legales',
          'stats',
          'directus_files'
        ].flatMap((c) => grants(c, ['read'])),
        { collection: 'formations', action: 'read' },
        // Publier / dépublier une formation = mettre à jour son status.
        { collection: 'formations', action: 'update', fields: ['status'] }
      ]

    case 'lecteur':
      return [...CONTENT_COLLECTIONS, 'directus_files'].flatMap((c) => grants(c, ['read']))

    default:
      return []
  }
}

// Accès public (visiteurs du site, non authentifiés) — trouvé en testant
// ST-12 en réel : le front lit Directus sans se connecter, donc sans ceci
// tout GET est 403 (deny-by-default). Statut "published" uniquement sur les
// collections qui ont un champ status ; le reste (page_blocks, stats,
// directus_files) n'en a pas, lecture non filtrée.
const PUBLIC_STATUS_FILTERED = [
  'centres',
  'familles_formation',
  'sous_familles_formation',
  'articles',
  'avis',
  'pages',
  'pages_legales',
  'formations'
]
const PUBLIC_UNRESTRICTED = ['page_blocks', 'stats', 'directus_files']

// Champs exposés publiquement (allowlist) — le proxy `/directus` de l'API
// relaie les requêtes sans token, tout champ interne non listé ici est
// interdit de lecture. Nouveaux champs : ajout explicite requis (deny by
// default), sinon un champ interne ajouté au schéma fuiterait aussitôt.
// Exclus notamment : centres.geocoded_address / digiforma_url (technique),
// formations.digiforma_id / raw / created_at / updated_at (miroir Digiforma).
const PUBLIC_FIELDS = {
  centres: [
    'id',
    'status',
    'sort',
    'slug',
    'name',
    'address',
    'city',
    'postal_code',
    'department',
    'region',
    'latitude',
    'longitude',
    'description',
    'specialties',
    'opening_hours',
    'transport',
    'parking',
    'pmr_accessible',
    'phone',
    'mobile',
    'email',
    'contact_name',
    'contact_role',
    'franchise_since',
    'departments_covered',
    'qualiopi_certified',
    'qualiopi_certificate_number',
    'qualiopi_certifier',
    'qualiopi_valid_until',
    'qualiopi_certificate',
    'image',
    'seo_title',
    'seo_description',
    'seo_canonical'
  ],
  familles_formation: [
    'id',
    'status',
    'sort',
    'slug',
    'name',
    'intro',
    'icon',
    'image',
    'subnav_title',
    'audience_text',
    'validity_text',
    'seo_title',
    'seo_description',
    'seo_canonical'
  ],
  sous_familles_formation: ['id', 'status', 'sort', 'slug', 'name', 'caption', 'famille'],
  articles: [
    'id',
    'status',
    'sort',
    'slug',
    'title',
    'excerpt',
    'content',
    'category',
    'author_name',
    'author_image',
    'region',
    'related_formation',
    'publish_at',
    'centre',
    'cover_image',
    'seo_title',
    'seo_description',
    'seo_canonical'
  ],
  avis: ['id', 'status', 'sort', 'slug', 'author', 'published_at', 'stars', 'quote', 'centre'],
  pages: ['id', 'status', 'slug', 'title', 'seo_title', 'seo_description', 'seo_canonical'],
  pages_legales: [
    'id',
    'status',
    'sort',
    'slug',
    'label',
    'title',
    'show_in_tabs',
    'sections',
    'cta_label',
    'cta_to',
    'created_at',
    'updated_at',
    'seo_title',
    'seo_description',
    'seo_canonical'
  ],
  formations: [
    'id',
    'status',
    'sort',
    'slug',
    'title',
    'description',
    'duration_days',
    'duration_hours',
    'price',
    'cpf',
    'cpf_code',
    'certification',
    'certifier_name',
    'category_name',
    'modalities',
    'center_slug',
    'center_slugs',
    'sessions',
    'locations_text',
    'blocks',
    'generated_program_url',
    'pedagogy',
    'evaluation',
    'validity',
    'image',
    'famille',
    'sous_famille',
    'seo_title',
    'seo_description',
    'seo_canonical'
  ]
}

/** @returns {Array<{collection: string, action: string, permissions?: object, fields?: string[]}>} */
export function publicPermissions() {
  return [
    ...PUBLIC_STATUS_FILTERED.map((collection) => ({
      collection,
      action: 'read',
      fields: PUBLIC_FIELDS[collection] ?? ['*'],
      permissions: { status: { _eq: 'published' } }
    })),
    ...PUBLIC_UNRESTRICTED.map((collection) => ({ collection, action: 'read', permissions: {} }))
  ]
}
