// Définitions v1 des collections métier LEARN UP ACADEMY (ST-11).
// Champs SEO répétés sur chaque collection porteuse de page (centres,
// familles_formation, articles, pages) : seo_title, seo_description,
// seo_canonical — alignés sur le livrable ST-06 (structure ; les valeurs
// réelles viendront avec ST-06).

// Libellés d'affichage admin : le client est francophone — Directus montre
// la traduction quand la langue du profil utilisateur est fr-FR. Pour les
// sous-champs des interfaces `list`, c'est la clé `name` qui porte le
// libellé (affichée quelle que soit la langue).
const fr = (translation) => ({ translations: [{ language: 'fr-FR', translation }] })

const seoFields = () => [
  {
    field: 'seo_title',
    type: 'string',
    meta: { interface: 'input', width: 'half', ...fr('Titre SEO') }
  },
  {
    field: 'seo_description',
    type: 'text',
    meta: { interface: 'input-multiline', width: 'full', ...fr('Description SEO') }
  },
  {
    field: 'seo_canonical',
    type: 'string',
    meta: { interface: 'input', width: 'half', ...fr('URL canonique') }
  }
]

const primaryKey = () => ({
  field: 'id',
  type: 'integer',
  meta: { hidden: true, interface: 'input', readonly: true, ...fr('ID') },
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
    width: 'half',
    ...fr('Statut')
  },
  schema: { default_value: 'draft' }
})

const sortField = () => ({
  field: 'sort',
  type: 'integer',
  meta: { interface: 'input', hidden: true, ...fr('Ordre') }
})

const slugField = () => ({
  field: 'slug',
  type: 'string',
  meta: { interface: 'input', width: 'half', required: true, ...fr('Slug') },
  schema: { is_unique: true }
})

export const collections = [
  {
    collection: 'centres',
    icon: 'store',
    note: 'Centres LEARN UP ACADEMY — un par implantation.',
    ...fr('Centres'),
    fields: [
      primaryKey(),
      statusField(),
      sortField(),
      slugField(),
      {
        field: 'name',
        type: 'string',
        meta: { interface: 'input', width: 'half', required: true, ...fr('Nom') }
      },
      {
        field: 'address',
        type: 'text',
        meta: {
          interface: 'input-multiline',
          width: 'full',
          note: 'Seul champ à saisir : ville, CP, département, région et coordonnées sont calculés automatiquement (géocodage BAN).',
          ...fr('Adresse')
        }
      },
      {
        field: 'city',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          readonly: true,
          note: 'Calculé depuis l’adresse',
          ...fr('Ville')
        }
      },
      {
        field: 'postal_code',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          readonly: true,
          note: 'Calculé depuis l’adresse',
          ...fr('Code postal')
        }
      },
      {
        field: 'department',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          readonly: true,
          note: 'Calculé depuis l’adresse',
          ...fr('Département')
        }
      },
      {
        field: 'region',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          readonly: true,
          note: 'Calculé depuis l’adresse',
          ...fr('Région')
        }
      },
      {
        field: 'latitude',
        type: 'float',
        meta: {
          interface: 'input',
          width: 'half',
          readonly: true,
          note: 'Calculée depuis l’adresse (WGS84)',
          ...fr('Latitude')
        }
      },
      {
        field: 'longitude',
        type: 'float',
        meta: {
          interface: 'input',
          width: 'half',
          readonly: true,
          note: 'Calculée depuis l’adresse (WGS84)',
          ...fr('Longitude')
        }
      },
      {
        field: 'geocoded_address',
        type: 'string',
        meta: {
          hidden: true,
          readonly: true,
          note: 'Adresse utilisée pour le dernier géocodage',
          ...fr('Adresse géocodée')
        }
      },
      {
        field: 'description',
        type: 'text',
        meta: {
          interface: 'input-rich-text-html',
          width: 'full',
          note: 'Présentation du centre',
          ...fr('Description')
        }
      },
      {
        field: 'specialties',
        type: 'json',
        meta: {
          interface: 'tags',
          width: 'full',
          note: 'Spécialités du centre (badges)',
          ...fr('Spécialités')
        }
      },
      {
        field: 'opening_hours',
        type: 'string',
        meta: { interface: 'input', width: 'half', ...fr("Horaires d'ouverture") }
      },
      {
        field: 'transport',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Accès transports',
          ...fr('Transports')
        }
      },
      {
        field: 'parking',
        type: 'string',
        meta: { interface: 'input', width: 'half', ...fr('Parking') }
      },
      {
        field: 'pmr_accessible',
        type: 'boolean',
        meta: {
          interface: 'boolean',
          width: 'half',
          note: 'Locaux accessibles PMR',
          ...fr('Accessible PMR')
        }
      },
      {
        field: 'phone',
        type: 'string',
        meta: { interface: 'input', width: 'half', ...fr('Téléphone') }
      },
      {
        field: 'email',
        type: 'string',
        meta: { interface: 'input', width: 'half', ...fr('E-mail') }
      },
      {
        field: 'contact_name',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Interlocuteur',
          ...fr('Nom du contact')
        }
      },
      {
        field: 'contact_role',
        type: 'string',
        meta: { interface: 'input', width: 'half', ...fr('Rôle du contact') }
      },
      {
        field: 'departments_covered',
        type: 'json',
        meta: {
          interface: 'tags',
          width: 'full',
          note: 'Départements couverts (codes ou noms)',
          ...fr('Départements couverts')
        }
      },
      {
        field: 'digiforma_url',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Lien Digiforma',
          ...fr('URL Digiforma')
        }
      },
      {
        field: 'qualiopi_certified',
        type: 'boolean',
        meta: { interface: 'boolean', width: 'half', ...fr('Certifié Qualiopi') }
      },
      {
        field: 'qualiopi_certificate_number',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          ...fr('Numéro de certificat Qualiopi')
        }
      },
      {
        field: 'qualiopi_certificate',
        type: 'uuid',
        meta: {
          interface: 'file',
          width: 'half',
          note: 'Certificat Qualiopi (PDF)',
          ...fr('Certificat Qualiopi')
        }
      },
      ...seoFields()
    ]
  },
  {
    collection: 'familles_formation',
    icon: 'category',
    note: 'Les 11 familles de formation.',
    ...fr('Familles de formation'),
    fields: [
      primaryKey(),
      statusField(),
      sortField(),
      slugField(),
      {
        field: 'name',
        type: 'string',
        meta: { interface: 'input', width: 'half', required: true, ...fr('Nom') }
      },
      {
        field: 'intro',
        type: 'text',
        meta: {
          interface: 'input-rich-text-html',
          width: 'full',
          note: 'Intro éditoriale',
          ...fr('Introduction')
        }
      },
      {
        field: 'image',
        type: 'uuid',
        meta: {
          interface: 'file-image',
          width: 'half',
          note: 'Visuel du hero de la page famille',
          ...fr('Image')
        }
      },
      {
        field: 'subnav_title',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: "Titre de la section sous-familles (ex: « Parcourir par type d'engin »)",
          ...fr('Titre des sous-familles')
        }
      },
      {
        field: 'audience_text',
        type: 'text',
        meta: {
          interface: 'input-multiline',
          width: 'half',
          note: 'Contenu de la carte « Qui est concerné ? »'
        }
      },
      {
        field: 'validity_text',
        type: 'text',
        meta: {
          interface: 'input-multiline',
          width: 'half',
          note: 'Contenu de la carte « Validité et renouvellement »'
        }
      },
      ...seoFields()
    ]
  },
  {
    collection: 'sous_familles_formation',
    icon: 'account_tree',
    note: "Sous-familles éditoriales — regroupent les formations au sein d'une famille.",
    ...fr('Sous-familles de formation'),
    fields: [
      primaryKey(),
      statusField(),
      sortField(),
      slugField(),
      {
        field: 'name',
        type: 'string',
        meta: { interface: 'input', width: 'half', required: true, ...fr('Nom') }
      },
      {
        field: 'caption',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Accroche courte sur la carte (ex: « R489 · R485 »)',
          ...fr('Accroche')
        }
      }
      // famille = relation M2O vers familles_formation (voir relations)
    ]
  },
  {
    collection: 'articles',
    icon: 'article',
    note: 'Articles de blog.',
    ...fr('Articles'),
    fields: [
      primaryKey(),
      statusField(),
      sortField(),
      slugField(),
      {
        field: 'title',
        type: 'string',
        meta: { interface: 'input', width: 'full', required: true, ...fr('Titre') }
      },
      {
        field: 'excerpt',
        type: 'text',
        meta: { interface: 'input-multiline', width: 'full', ...fr('Extrait') }
      },
      {
        field: 'content',
        type: 'text',
        meta: { interface: 'input-rich-text-html', width: 'full', ...fr('Contenu') }
      },
      {
        field: 'category',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Catégorie thématique',
          ...fr('Catégorie')
        }
      },
      {
        field: 'author_name',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Auteur identifié de l’article',
          ...fr('Nom de l’auteur')
        }
      },
      {
        field: 'author_image',
        type: 'uuid',
        meta: {
          interface: 'file-image',
          width: 'half',
          note: 'Image auteur / signature',
          ...fr('Photo de l’auteur')
        }
      },
      {
        field: 'region',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Région concernée',
          ...fr('Région')
        }
      },
      // related_formation = relation M2O vers formations (voir relations)
      {
        field: 'publish_at',
        type: 'timestamp',
        meta: {
          interface: 'datetime',
          width: 'half',
          note: 'Publication planifiée',
          ...fr('Date de publication')
        }
      },
      ...seoFields()
    ]
  },
  {
    collection: 'pages',
    icon: 'description',
    note: 'Pages statiques (gabarits) — contenu en blocs via page_blocks.',
    ...fr('Pages'),
    fields: [
      primaryKey(),
      statusField(),
      slugField(),
      {
        field: 'title',
        type: 'string',
        meta: { interface: 'input', width: 'full', required: true, ...fr('Titre') }
      },
      ...seoFields()
    ]
  },
  {
    collection: 'page_blocks',
    icon: 'view_agenda',
    note: 'Blocs de contenu rattachés à une page (pages.id).',
    ...fr('Blocs de page'),
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
          width: 'half',
          ...fr('Type de bloc')
        }
      },
      {
        field: 'title',
        type: 'string',
        meta: { interface: 'input', width: 'full', ...fr('Titre') }
      },
      {
        field: 'body',
        type: 'text',
        meta: { interface: 'input-rich-text-html', width: 'full', ...fr('Contenu') }
      }
    ]
  },
  {
    collection: 'pages_legales',
    icon: 'gavel',
    note: 'Pages légales (mentions légales, confidentialité, CGU, accessibilité, cookies).',
    ...fr('Pages légales'),
    fields: [
      primaryKey(),
      statusField(),
      // special 'sort' : tri manuel par glisser-déposer dans la liste admin
      // (ordonne les onglets côté front) — sinon le champ caché ne serait
      // jamais modifiable par un éditeur.
      {
        field: 'sort',
        type: 'integer',
        meta: { interface: 'input', hidden: true, special: ['sort'], ...fr('Ordre') }
      },
      slugField(),
      {
        field: 'label',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          required: true,
          note: 'Libellé court (onglets, menus)',
          ...fr('Libellé')
        }
      },
      {
        field: 'title',
        type: 'string',
        meta: { interface: 'input', width: 'full', required: true, ...fr('Titre') }
      },
      {
        field: 'show_in_tabs',
        type: 'boolean',
        meta: {
          interface: 'boolean',
          width: 'half',
          note: 'Afficher dans la navigation par onglets des pages légales',
          ...fr('Afficher dans les onglets')
        },
        schema: { default_value: true }
      },
      {
        field: 'sections',
        type: 'json',
        meta: {
          interface: 'list',
          width: 'full',
          note: 'Sections de la page — ancre, titre, paragraphes, puces',
          ...fr('Sections'),
          options: {
            fields: [
              {
                field: 'id',
                name: 'Ancre',
                type: 'string',
                meta: {
                  interface: 'input',
                  width: 'half',
                  required: true,
                  note: 'Ancre HTML (ex: editeur)'
                },
                schema: {}
              },
              {
                field: 'title',
                name: 'Titre',
                type: 'string',
                meta: { interface: 'input', width: 'half', required: true },
                schema: {}
              },
              {
                field: 'paragraphs',
                name: 'Paragraphes',
                type: 'json',
                meta: { interface: 'tags', width: 'full' },
                schema: {}
              },
              {
                field: 'bullets',
                name: 'Puces',
                type: 'json',
                meta: { interface: 'tags', width: 'full' },
                schema: {}
              }
            ]
          }
        }
      },
      {
        field: 'cta_label',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Libellé du bouton en bas de page',
          ...fr('Libellé CTA')
        }
      },
      {
        field: 'cta_to',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Lien du bouton (mailto:… ou route)',
          ...fr('Lien CTA')
        }
      },
      ...seoFields(),
      {
        field: 'created_at',
        type: 'timestamp',
        meta: {
          special: ['date-created'],
          interface: 'datetime',
          width: 'half',
          readonly: true,
          hidden: true,
          ...fr('Date de création')
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
          hidden: true,
          ...fr('Dernière modification')
        }
      }
    ]
  },
  {
    collection: 'stats',
    icon: 'bar_chart',
    note: 'Entrées de la bannière statistiques (accueil).',
    ...fr('Statistiques'),
    fields: [
      primaryKey(),
      sortField(),
      {
        field: 'label',
        type: 'string',
        meta: { interface: 'input', width: 'half', required: true, ...fr('Libellé') }
      },
      {
        field: 'value',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          required: true,
          note: 'Ex: "500+"',
          ...fr('Valeur')
        }
      }
    ]
  },
  {
    collection: 'formations',
    icon: 'school',
    note: 'Miroir Digiforma — contenu éditable : la sync ne remplit que les champs vides. Seuls sessions/raw/digiforma_id sont réécrits à chaque run.',
    ...fr('Formations'),
    fields: [
      primaryKey(),
      statusField(),
      sortField(),
      {
        field: 'digiforma_id',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          readonly: true,
          note: 'ID Digiforma',
          ...fr('ID Digiforma')
        },
        schema: { is_unique: true }
      },
      {
        field: 'slug',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Slug URL — rempli par la sync, éditable (jamais écrasé)',
          ...fr('Slug')
        }
      },
      {
        field: 'title',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'full',
          note: 'Rempli par la sync, éditable',
          ...fr('Titre')
        }
      },
      {
        field: 'description',
        type: 'text',
        meta: {
          interface: 'input-rich-text-html',
          width: 'full',
          note: 'Description — remplie par la sync, éditable',
          ...fr('Description')
        }
      },
      {
        field: 'duration_days',
        type: 'integer',
        meta: { interface: 'input', width: 'half', ...fr('Durée (jours)') }
      },
      {
        field: 'duration_hours',
        type: 'integer',
        meta: { interface: 'input', width: 'half', ...fr('Durée (heures)') }
      },
      {
        field: 'price',
        type: 'float',
        meta: { interface: 'input', width: 'half', ...fr('Prix') }
      },
      {
        field: 'cpf',
        type: 'boolean',
        meta: { interface: 'boolean', width: 'half', ...fr('Éligible CPF') }
      },
      {
        field: 'cpf_code',
        type: 'string',
        meta: { interface: 'input', width: 'half', ...fr('Code CPF') }
      },
      {
        field: 'certification',
        type: 'string',
        meta: { interface: 'input', width: 'half', ...fr('Certification') }
      },
      {
        field: 'certifier_name',
        type: 'string',
        meta: { interface: 'input', width: 'half', ...fr('Certificateur') }
      },
      {
        field: 'category_name',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Catégorie Digiforma brute',
          ...fr('Catégorie Digiforma')
        }
      },
      {
        field: 'modalities',
        type: 'json',
        meta: { interface: 'tags', width: 'full', ...fr('Modalités') }
      },
      {
        field: 'center_slug',
        type: 'string',
        meta: { interface: 'input', width: 'half', ...fr('Centre (slug)') }
      },
      {
        field: 'center_slugs',
        type: 'json',
        meta: { interface: 'tags', width: 'full', ...fr('Centres (slugs)') }
      },
      {
        field: 'sessions',
        type: 'json',
        meta: {
          interface: 'input-code',
          width: 'full',
          readonly: true,
          note: 'Sessions JSON — réécrites par la sync à chaque run',
          ...fr('Sessions')
        }
      },
      {
        field: 'locations_text',
        type: 'text',
        meta: {
          interface: 'input-multiline',
          width: 'full',
          note: 'Texte localisations pour recherche',
          ...fr('Localisations')
        }
      },
      {
        field: 'blocks',
        type: 'json',
        meta: {
          interface: 'list',
          width: 'full',
          note: 'Blocs pédagogiques (programme) — remplis par la sync, éditables',
          ...fr('Programme'),
          options: {
            fields: [
              {
                field: 'name',
                name: 'Nom',
                type: 'string',
                meta: { interface: 'input', width: 'full', required: true },
                schema: {}
              },
              {
                field: 'subtitle',
                name: 'Sous-titre',
                type: 'string',
                meta: { interface: 'input', width: 'full', note: 'Ligne résumée sur la fiche' },
                schema: {}
              },
              {
                field: 'description',
                name: 'Description',
                type: 'text',
                meta: { interface: 'input-rich-text-html', width: 'full' },
                schema: {}
              },
              {
                field: 'goals',
                name: 'Objectifs',
                type: 'json',
                meta: {
                  interface: 'list',
                  width: 'full',
                  note: 'Objectifs du bloc',
                  options: {
                    fields: [
                      {
                        field: 'text',
                        name: 'Texte',
                        type: 'string',
                        meta: { interface: 'input', width: 'full', required: true },
                        schema: {}
                      }
                    ]
                  }
                },
                schema: {}
              },
              {
                field: 'type',
                name: 'Type',
                type: 'string',
                meta: {
                  interface: 'select-dropdown',
                  width: 'half',
                  options: {
                    allowOther: true,
                    choices: [
                      { text: 'Théorie', value: 'theorie' },
                      { text: 'Pratique', value: 'pratique' },
                      { text: 'Évaluation', value: 'evaluation' }
                    ]
                  }
                },
                schema: {}
              },
              {
                field: 'position',
                name: 'Position',
                type: 'integer',
                meta: { interface: 'input', width: 'half', note: 'Ordre d’affichage' },
                schema: {}
              },
              {
                field: 'durationInHours',
                name: 'Durée (heures)',
                type: 'float',
                meta: { interface: 'input', width: 'half', note: 'Durée en heures' },
                schema: {}
              },
              {
                field: 'durationInDays',
                name: 'Durée (jours)',
                type: 'float',
                meta: {
                  interface: 'input',
                  width: 'half',
                  note: 'Durée en jours (si pas d’heures)'
                },
                schema: {}
              }
            ]
          }
        }
      },
      {
        field: 'generated_program_url',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'full',
          ...fr('URL du programme généré')
        }
      },
      {
        field: 'pedagogy',
        type: 'json',
        meta: {
          interface: 'list',
          width: 'full',
          note: 'Modalités pédagogiques — proposées par la sync depuis Digiforma, éditables',
          ...fr('Pédagogie'),
          options: {
            fields: [
              {
                field: 'title',
                name: 'Titre',
                type: 'string',
                meta: { interface: 'input', width: 'full', required: true },
                schema: {}
              },
              {
                field: 'description',
                name: 'Description',
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
          note: "Modalités d'évaluation — proposées par la sync depuis Digiforma, éditables",
          ...fr('Évaluation')
        }
      },
      {
        field: 'validity',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
          note: 'Validité de la certification (ex: « 5 ans · recyclage ») — éditorial',
          ...fr('Validité')
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
          note: 'Payload Digiforma brut',
          ...fr('Données brutes Digiforma')
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
          hidden: true,
          ...fr('Date de création')
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
          hidden: true,
          ...fr('Dernière modification')
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
    meta: { interface: 'select-dropdown-m2o', ...fr('Centre') }
  },
  {
    collection: 'articles',
    field: 'related_formation',
    related_collection: 'formations',
    meta: {
      interface: 'select-dropdown-m2o',
      width: 'half',
      note: 'Formation mise en avant dans l’article (carte « Formation liée »)',
      ...fr('Formation liée')
    }
  },
  {
    collection: 'articles',
    field: 'author_image',
    related_collection: 'directus_files',
    meta: { interface: 'file-image', note: 'Image auteur', ...fr('Photo de l’auteur') }
  },
  {
    collection: 'articles',
    field: 'cover_image',
    related_collection: 'directus_files',
    meta: { interface: 'file-image', ...fr('Image de couverture') }
  },
  {
    collection: 'centres',
    field: 'image',
    related_collection: 'directus_files',
    meta: { interface: 'file-image', ...fr('Image') }
  },
  {
    collection: 'centres',
    field: 'qualiopi_certificate',
    related_collection: 'directus_files',
    meta: { interface: 'file', ...fr('Certificat Qualiopi') }
  },
  {
    collection: 'familles_formation',
    field: 'icon',
    related_collection: 'directus_files',
    meta: { interface: 'file-image', note: 'Picto', ...fr('Icône') }
  },
  {
    collection: 'familles_formation',
    field: 'image',
    related_collection: 'directus_files',
    meta: { interface: 'file-image', ...fr('Image') }
  },
  {
    collection: 'formations',
    field: 'image',
    related_collection: 'directus_files',
    meta: {
      interface: 'file-image',
      note: 'Visuel de la fiche — pré-rempli par la sync (import Digiforma), remplaçable',
      ...fr('Image')
    }
  },
  {
    collection: 'page_blocks',
    field: 'page',
    related_collection: 'pages',
    meta: { interface: 'select-dropdown-m2o', required: true, ...fr('Page') }
  },
  {
    collection: 'page_blocks',
    field: 'image',
    related_collection: 'directus_files',
    meta: { interface: 'file-image', ...fr('Image') }
  },
  {
    collection: 'stats',
    field: 'icon',
    related_collection: 'directus_files',
    meta: { interface: 'file-image', ...fr('Icône') }
  },
  {
    collection: 'formations',
    field: 'famille',
    related_collection: 'familles_formation',
    meta: {
      interface: 'select-dropdown-m2o',
      note: 'Affectation éditoriale — seul champ modifiable',
      ...fr('Famille')
    }
  },
  {
    collection: 'formations',
    field: 'sous_famille',
    related_collection: 'sous_familles_formation',
    meta: {
      interface: 'select-dropdown-m2o',
      note: 'Affectation éditoriale — proposée par la sync, jamais réécrite',
      ...fr('Sous-famille')
    }
  },
  {
    collection: 'sous_familles_formation',
    field: 'famille',
    related_collection: 'familles_formation',
    meta: {
      interface: 'select-dropdown-m2o',
      required: true,
      note: 'Famille parente',
      ...fr('Famille')
    }
  }
]
