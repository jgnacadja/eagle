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
      { field: 'address', type: 'text', meta: { interface: 'input-multiline', width: 'full' } },
      { field: 'city', type: 'string', meta: { interface: 'input', width: 'half' } },
      { field: 'postal_code', type: 'string', meta: { interface: 'input', width: 'half' } },
      { field: 'department', type: 'string', meta: { interface: 'input', width: 'half' } },
      { field: 'region', type: 'string', meta: { interface: 'input', width: 'half' } },
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
      ...seoFields()
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
    note: 'Miroir lecture seule du catalogue API — les éditeurs affectent la famille.',
    fields: [
      primaryKey(),
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
        meta: { interface: 'input', width: 'half', readonly: true }
      },
      {
        field: 'title',
        type: 'string',
        meta: { interface: 'input', width: 'full', readonly: true }
      },
      {
        field: 'category_name',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          readonly: true,
          note: 'Catégorie Digiforma brute'
        }
      }
      // famille = SEUL champ éditable (relation M2O, voir relations)
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
  }
]
