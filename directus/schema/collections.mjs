// Définitions v1 des collections métier LEARN UP ACADEMY (ST-11).
// Champs SEO répétés sur chaque collection porteuse de page (centres,
// familles_formation, articles, pages) : seo_title, seo_description,
// seo_canonical — alignés sur le livrable ST-06 (structure ; les valeurs
// réelles viendront avec ST-06).

const seoFields = () => [
  { field: 'seo_title', type: 'string', meta: { interface: 'input', width: 'half' } },
  { field: 'seo_description', type: 'text', meta: { interface: 'input-multiline', width: 'full' } },
  { field: 'seo_canonical', type: 'string', meta: { interface: 'input', width: 'half' } }
]

const primaryKey = () => ({
  field: 'id',
  type: 'integer',
  meta: { hidden: true, interface: 'input', readonly: true },
  schema: { is_primary_key: true, has_auto_increment: true }
})

const statusField = () => ({
  field: 'status',
  type: 'string',
  meta: {
    interface: 'select-dropdown',
    options: {
      choices: [
        { text: 'Brouillon', value: 'draft' },
        { text: 'Publié', value: 'published' },
        { text: 'Archivé', value: 'archived' }
      ]
    },
    width: 'half'
  },
  schema: { default_value: 'draft' }
})

const sortField = () => ({
  field: 'sort',
  type: 'integer',
  meta: { interface: 'input', hidden: true }
})

const slugField = () => ({
  field: 'slug',
  type: 'string',
  meta: { interface: 'input', width: 'half', required: true },
  schema: { is_unique: true }
})

export const collections = [
  {
    collection: 'centres',
    icon: 'store',
    note: 'Centres LEARN UP ACADEMY — un par implantation.',
    fields: [
      primaryKey(),
      statusField(),
      sortField(),
      slugField(),
      {
        field: 'name',
        type: 'string',
        meta: { interface: 'input', width: 'half', required: true }
      },
      {
        field: 'address',
        type: 'text',
        meta: {
          interface: 'input-multiline',
          width: 'full',
          note: 'Seul champ à saisir : ville, CP, département, région et coordonnées sont calculés automatiquement (géocodage BAN).'
        }
      },
      {
        field: 'city',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          readonly: true,
          note: 'Calculé depuis l’adresse'
        }
      },
      {
        field: 'postal_code',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          readonly: true,
          note: 'Calculé depuis l’adresse'
        }
      },
      {
        field: 'department',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          readonly: true,
          note: 'Calculé depuis l’adresse'
        }
      },
      {
        field: 'region',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          readonly: true,
          note: 'Calculé depuis l’adresse'
        }
      },
      {
        field: 'latitude',
        type: 'float',
        meta: {
          interface: 'input',
          width: 'half',
          readonly: true,
          note: 'Calculée depuis l’adresse (WGS84)'
        }
      },
      {
        field: 'longitude',
        type: 'float',
        meta: {
          interface: 'input',
          width: 'half',
          readonly: true,
          note: 'Calculée depuis l’adresse (WGS84)'
        }
      },
      {
        field: 'geocoded_address',
        type: 'string',
        meta: { hidden: true, readonly: true, note: 'Adresse utilisée pour le dernier géocodage' }
      },
      {
        field: 'description',
        type: 'text',
        meta: { interface: 'input-rich-text-html', width: 'full', note: 'Présentation du centre' }
      },
      {
        field: 'specialties',
        type: 'json',
        meta: { interface: 'tags', width: 'full', note: 'Spécialités du centre (badges)' }
      },
      { field: 'opening_hours', type: 'string', meta: { interface: 'input', width: 'half' } },
      {
        field: 'transport',
        type: 'string',
        meta: { interface: 'input', width: 'half', note: 'Accès transports' }
      },
      { field: 'parking', type: 'string', meta: { interface: 'input', width: 'half' } },
      {
        field: 'pmr_accessible',
        type: 'boolean',
        meta: { interface: 'boolean', width: 'half', note: 'Locaux accessibles PMR' }
      },
      { field: 'phone', type: 'string', meta: { interface: 'input', width: 'half' } },
      { field: 'email', type: 'string', meta: { interface: 'input', width: 'half' } },
      {
        field: 'contact_name',
        type: 'string',
        meta: { interface: 'input', width: 'half', note: 'Interlocuteur' }
      },
      { field: 'contact_role', type: 'string', meta: { interface: 'input', width: 'half' } },
      {
        field: 'departments_covered',
        type: 'json',
        meta: { interface: 'tags', width: 'full', note: 'Départements couverts (codes ou noms)' }
      },
      {
        field: 'digiforma_url',
        type: 'string',
        meta: { interface: 'input', width: 'half', note: 'Lien Digiforma' }
      },
      {
        field: 'qualiopi_certified',
        type: 'boolean',
        meta: { interface: 'boolean', width: 'half' }
      },
      {
        field: 'qualiopi_certificate_number',
        type: 'string',
        meta: { interface: 'input', width: 'half' }
      },
      {
        field: 'qualiopi_certificate',
        type: 'uuid',
        meta: { interface: 'file', width: 'half', note: 'Certificat Qualiopi (PDF)' }
      },
      ...seoFields()
    ]
  },
  {
    collection: 'familles_formation',
    icon: 'category',
    note: 'Les 11 familles de formation.',
    fields: [
      primaryKey(),
      statusField(),
      sortField(),
      slugField(),
      {
        field: 'name',
        type: 'string',
        meta: { interface: 'input', width: 'half', required: true }
      },
      {
        field: 'intro',
        type: 'text',
        meta: { interface: 'input-rich-text-html', width: 'full', note: 'Intro éditoriale' }
      },
      {
        field: 'image',
        type: 'uuid',
        meta: { interface: 'file-image', width: 'half', note: 'Visuel du hero de la page famille' }
      },
      {
        field: 'subnav_title',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: "Titre de la section sous-familles (ex: « Parcourir par type d'engin »)"
        }
      },
      ...seoFields()
    ]
  },
  {
    collection: 'sous_familles_formation',
    icon: 'account_tree',
    note: "Sous-familles éditoriales — regroupent les formations au sein d'une famille.",
    fields: [
      primaryKey(),
      statusField(),
      sortField(),
      slugField(),
      {
        field: 'name',
        type: 'string',
        meta: { interface: 'input', width: 'half', required: true }
      },
      {
        field: 'caption',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Accroche courte sur la carte (ex: « R489 · R485 »)'
        }
      }
      // famille = relation M2O vers familles_formation (voir relations)
    ]
  },
  {
    collection: 'articles',
    icon: 'article',
    note: 'Articles de blog.',
    fields: [
      primaryKey(),
      statusField(),
      sortField(),
      slugField(),
      {
        field: 'title',
        type: 'string',
        meta: { interface: 'input', width: 'full', required: true }
      },
      { field: 'excerpt', type: 'text', meta: { interface: 'input-multiline', width: 'full' } },
      {
        field: 'content',
        type: 'text',
        meta: { interface: 'input-rich-text-html', width: 'full' }
      },
      {
        field: 'category',
        type: 'string',
        meta: { interface: 'input', width: 'half', note: 'Catégorie thématique' }
      },
      {
        field: 'author_name',
        type: 'string',
        meta: { interface: 'input', width: 'half', note: 'Auteur identifié de l’article' }
      },
      {
        field: 'author_image',
        type: 'uuid',
        meta: { interface: 'file-image', width: 'half', note: 'Image auteur / signature' }
      },
      {
        field: 'region',
        type: 'string',
        meta: { interface: 'input', width: 'half', note: 'Région concernée' }
      },
      {
        field: 'related_formation_slug',
        type: 'string',
        meta: { interface: 'input', width: 'half', note: 'Slug de la formation liée' }
      },
      {
        field: 'publish_at',
        type: 'timestamp',
        meta: { interface: 'datetime', width: 'half', note: 'Publication planifiée' }
      },
      ...seoFields()
    ]
  },
  {
    collection: 'pages',
    icon: 'description',
    note: 'Pages statiques (gabarits) — contenu en blocs via page_blocks.',
    fields: [
      primaryKey(),
      statusField(),
      slugField(),
      {
        field: 'title',
        type: 'string',
        meta: { interface: 'input', width: 'full', required: true }
      },
      ...seoFields()
    ]
  },
  {
    collection: 'page_blocks',
    icon: 'view_agenda',
    note: 'Blocs de contenu rattachés à une page (pages.id).',
    fields: [
      primaryKey(),
      sortField(),
      {
        field: 'block_type',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          required: true,
          options: {
            choices: [
              { text: 'Hero', value: 'hero' },
              { text: 'Texte', value: 'text' },
              { text: 'Image', value: 'image' },
              { text: 'Appel à action', value: 'cta' }
            ]
          },
          width: 'half'
        }
      },
      { field: 'title', type: 'string', meta: { interface: 'input', width: 'full' } },
      { field: 'body', type: 'text', meta: { interface: 'input-rich-text-html', width: 'full' } }
    ]
  },
  {
    collection: 'stats',
    icon: 'bar_chart',
    note: 'Entrées de la bannière statistiques (accueil).',
    fields: [
      primaryKey(),
      sortField(),
      {
        field: 'label',
        type: 'string',
        meta: { interface: 'input', width: 'half', required: true }
      },
      {
        field: 'value',
        type: 'string',
        meta: { interface: 'input', width: 'half', required: true, note: 'Ex: "500+"' }
      }
    ]
  },
  {
    collection: 'formations',
    icon: 'school',
    note: 'Miroir Digiforma — contenu éditable : la sync ne remplit que les champs vides. Seuls sessions/raw/digiforma_id sont réécrits à chaque run.',
    fields: [
      primaryKey(),
      statusField(),
      sortField(),
      {
        field: 'digiforma_id',
        type: 'string',
        meta: { interface: 'input', width: 'half', readonly: true, note: 'ID Digiforma' },
        schema: { is_unique: true }
      },
      {
        field: 'slug',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Slug URL — rempli par la sync, éditable (jamais écrasé)'
        }
      },
      {
        field: 'title',
        type: 'string',
        meta: { interface: 'input', width: 'full', note: 'Rempli par la sync, éditable' }
      },
      {
        field: 'description',
        type: 'text',
        meta: {
          interface: 'input-rich-text-html',
          width: 'full',
          note: 'Description — remplie par la sync, éditable'
        }
      },
      {
        field: 'duration_days',
        type: 'integer',
        meta: { interface: 'input', width: 'half' }
      },
      {
        field: 'duration_hours',
        type: 'integer',
        meta: { interface: 'input', width: 'half' }
      },
      {
        field: 'price',
        type: 'float',
        meta: { interface: 'input', width: 'half' }
      },
      {
        field: 'cpf',
        type: 'boolean',
        meta: { interface: 'boolean', width: 'half' }
      },
      {
        field: 'cpf_code',
        type: 'string',
        meta: { interface: 'input', width: 'half' }
      },
      {
        field: 'certification',
        type: 'string',
        meta: { interface: 'input', width: 'half' }
      },
      {
        field: 'certifier_name',
        type: 'string',
        meta: { interface: 'input', width: 'half' }
      },
      {
        field: 'category_name',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Catégorie Digiforma brute'
        }
      },
      {
        field: 'modalities',
        type: 'json',
        meta: { interface: 'tags', width: 'full' }
      },
      {
        field: 'center_slug',
        type: 'string',
        meta: { interface: 'input', width: 'half' }
      },
      {
        field: 'center_slugs',
        type: 'json',
        meta: { interface: 'tags', width: 'full' }
      },
      {
        field: 'sessions',
        type: 'json',
        meta: {
          interface: 'input-code',
          width: 'full',
          readonly: true,
          note: 'Sessions JSON — réécrites par la sync à chaque run'
        }
      },
      {
        field: 'locations_text',
        type: 'text',
        meta: {
          interface: 'input-multiline',
          width: 'full',
          note: 'Texte localisations pour recherche'
        }
      },
      {
        field: 'blocks',
        type: 'json',
        meta: {
          interface: 'input-code',
          width: 'full',
          note: 'Blocs pédagogiques JSON (programme) — remplis par la sync, éditables'
        }
      },
      {
        field: 'generated_program_url',
        type: 'string',
        meta: { interface: 'input', width: 'full' }
      },
      {
        field: 'pedagogy',
        type: 'json',
        meta: {
          interface: 'list',
          width: 'full',
          note: 'Modalités pédagogiques — proposées par la sync depuis Digiforma, éditables',
          options: {
            fields: [
              {
                field: 'title',
                type: 'string',
                meta: { interface: 'input', width: 'full', required: true },
                schema: {}
              },
              {
                field: 'description',
                type: 'text',
                meta: { interface: 'input-multiline', width: 'full' },
                schema: {}
              }
            ]
          }
        }
      },
      {
        field: 'evaluation',
        type: 'json',
        meta: {
          interface: 'tags',
          width: 'full',
          note: "Modalités d'évaluation — proposées par la sync depuis Digiforma, éditables"
        }
      },
      {
        field: 'validity',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Validité de la certification (ex: « 5 ans · recyclage ») — éditorial'
        }
      },
      ...seoFields(),
      {
        field: 'raw',
        type: 'json',
        meta: {
          interface: 'input-code',
          width: 'full',
          readonly: true,
          note: 'Payload Digiforma brut'
        }
      },
      {
        field: 'created_at',
        type: 'timestamp',
        meta: {
          special: ['date-created'],
          interface: 'datetime',
          width: 'half',
          readonly: true,
          hidden: true
        }
      },
      {
        field: 'updated_at',
        type: 'timestamp',
        meta: {
          special: ['date-updated'],
          interface: 'datetime',
          width: 'half',
          readonly: true,
          hidden: true
        }
      }
      // famille + sous_famille (relations M2O, voir relations).
      // Tous les champs contenu sont éditables : la sync ne remplit que
      // les champs vides. Readonly restants : digiforma_id, sessions,
      // raw, created_at, updated_at.
    ]
  }
]

// Relations M2O résolues après création des collections (les deux côtés
// doivent exister avant de créer la relation).
export const relations = [
  {
    collection: 'articles',
    field: 'centre',
    related_collection: 'centres',
    meta: { interface: 'select-dropdown-m2o' }
  },
  {
    collection: 'articles',
    field: 'author_image',
    related_collection: 'directus_files',
    meta: { interface: 'file-image', note: 'Image auteur' }
  },
  {
    collection: 'articles',
    field: 'cover_image',
    related_collection: 'directus_files',
    meta: { interface: 'file-image' }
  },
  {
    collection: 'centres',
    field: 'image',
    related_collection: 'directus_files',
    meta: { interface: 'file-image' }
  },
  {
    collection: 'centres',
    field: 'qualiopi_certificate',
    related_collection: 'directus_files',
    meta: { interface: 'file' }
  },
  {
    collection: 'familles_formation',
    field: 'icon',
    related_collection: 'directus_files',
    meta: { interface: 'file-image', note: 'Picto' }
  },
  {
    collection: 'familles_formation',
    field: 'image',
    related_collection: 'directus_files',
    meta: { interface: 'file-image' }
  },
  {
    collection: 'formations',
    field: 'image',
    related_collection: 'directus_files',
    meta: {
      interface: 'file-image',
      note: 'Visuel de la fiche — pré-rempli par la sync (import Digiforma), remplaçable'
    }
  },
  {
    collection: 'page_blocks',
    field: 'page',
    related_collection: 'pages',
    meta: { interface: 'select-dropdown-m2o', required: true }
  },
  {
    collection: 'page_blocks',
    field: 'image',
    related_collection: 'directus_files',
    meta: { interface: 'file-image' }
  },
  {
    collection: 'stats',
    field: 'icon',
    related_collection: 'directus_files',
    meta: { interface: 'file-image' }
  },
  {
    collection: 'formations',
    field: 'famille',
    related_collection: 'familles_formation',
    meta: {
      interface: 'select-dropdown-m2o',
      note: 'Affectation éditoriale — seul champ modifiable'
    }
  },
  {
    collection: 'formations',
    field: 'sous_famille',
    related_collection: 'sous_familles_formation',
    meta: {
      interface: 'select-dropdown-m2o',
      note: 'Affectation éditoriale — proposée par la sync, jamais réécrite'
    }
  },
  {
    collection: 'sous_familles_formation',
    field: 'famille',
    related_collection: 'familles_formation',
    meta: {
      interface: 'select-dropdown-m2o',
      required: true,
      note: 'Famille parente'
    }
  }
]
