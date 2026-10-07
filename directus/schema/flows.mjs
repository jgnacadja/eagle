// Flows Directus d'invalidation de cache — webhooks sortants créés par
// `pnpm directus:build`. Trigger `action` (non bloquant) : une
// purge qui échoue ne fait jamais échouer l'écriture éditoriale.
//
// Deux niveaux de précision :
// - « Invalidate site cache » (toutes collections de contenu) : purge le
//   cache catalogue Redis côté API et les routes ISR du front associées à
//   la collection modifiée (mapping collection → routes côté front).
// - « Invalidate formation page » (formations uniquement) : relit le slug
//   de la formation et purge uniquement sa page fiche côté front.

// URLs et secrets ne sont PAS cuits en base : `{{ $env.* }}` est interpolé
// à l'exécution depuis l'env du container Directus — un rebuild avec un
// .env différent ne casse plus les flows et aucun secret n'est stocké.
// Prérequis sur l'instance Directus (docker-compose.yml les pose déjà) :
//   FLOWS_ENV_ALLOW_LIST=API_INTERNAL_URL,FRONT_INTERNAL_URL,ADMIN_API_KEY,NUXT_CACHE_PURGE_SECRET
//   + les 4 variables elles-mêmes (base URLs sans slash final).
const API_INTERNAL_URL = '{{$env.API_INTERNAL_URL}}'
const FRONT_INTERNAL_URL = '{{$env.FRONT_INTERNAL_URL}}'
const ADMIN_API_KEY = '{{$env.ADMIN_API_KEY}}'
const CACHE_PURGE_SECRET = '{{$env.NUXT_CACHE_PURGE_SECRET}}'

// Collections dont une écriture peut changer une page publique.
const CONTENT_COLLECTIONS = [
  'formations',
  'centres',
  'familles_formation',
  'sous_familles_formation',
  'articles',
  'pages',
  'page_blocks',
  'pages_legales',
  'pages_legales_sections',
  'pages_legales_subsections',
  'stats'
]

// La sync Digiforma écrit via le compte de service DIRECTUS_TOKEN — un
// PATCH par formation à chaque run horaire. Sans garde, chaque run
// déclencherait N appels /admin/cache/invalidate (2 SCAN du keyspace
// chacun) + N purges ISR, alors que la sync purge elle-même le catalogue
// en fin de run. L'opération `condition` en tête de chaîne arrête le flow
// pour ces écritures (chemin `reject` non câblé = arrêt propre).
function syncGuard(syncUserId) {
  if (!syncUserId) return []
  return [
    {
      name: 'Écriture hors sync ?',
      key: 'not-sync-writer',
      type: 'condition',
      position_x: 20,
      position_y: 20,
      options: {
        filter: { $accountability: { user: { _neq: syncUserId } } }
      }
    }
  ]
}

/**
 * @param {{ syncUserId?: string | null }} [options]
 *   `syncUserId` : id du compte porteur de DIRECTUS_TOKEN (résolu via
 *   /users/me dans build.mjs). Sans lui, les flows purgent aussi les
 *   écritures de la sync — comportement dégradé, pas de garde ajoutée.
 */
export function buildFlows({ syncUserId } = {}) {
  return [
    {
      name: 'Invalidate site cache',
      icon: 'bolt',
      trigger: 'event',
      accountability: 'all',
      status: 'active',
      options: {
        type: 'action',
        scope: ['items.create', 'items.update', 'items.delete'],
        collections: CONTENT_COLLECTIONS
      },
      operations: [
        ...syncGuard(syncUserId),
        {
          name: 'Purge API (Redis)',
          key: 'purge-api',
          type: 'request',
          position_x: 40,
          position_y: 20,
          options: {
            method: 'POST',
            url: `${API_INTERNAL_URL}/admin/cache/invalidate`,
            headers: [{ header: 'x-api-key', value: ADMIN_API_KEY }],
            body: '{"collection":"{{$trigger.collection}}"}'
          }
        },
        {
          name: 'Purge front (ISR)',
          key: 'purge-front',
          type: 'request',
          position_x: 60,
          position_y: 20,
          options: {
            method: 'POST',
            url: `${FRONT_INTERNAL_URL}/api/cache/invalidate`,
            headers: [{ header: 'x-cache-secret', value: CACHE_PURGE_SECRET }],
            body: '{"collection":"{{$trigger.collection}}"}'
          }
        }
      ]
    },
    {
      name: 'Invalidate formation page',
      icon: 'target',
      trigger: 'event',
      accountability: 'all',
      status: 'active',
      options: {
        type: 'action',
        scope: ['items.create', 'items.update'],
        collections: ['formations']
      },
      operations: [
        ...syncGuard(syncUserId),
        {
          name: 'Relire la formation',
          key: 'read-formation',
          type: 'item-read',
          position_x: 40,
          position_y: 20,
          options: {
            collection: 'formations',
            key: '{{$trigger.keys[0]}}',
            permissions: '$full',
            query: { fields: 'slug' }
          }
        },
        {
          name: 'Purge fiche front (ISR)',
          key: 'purge-formation-page',
          type: 'request',
          position_x: 60,
          position_y: 20,
          options: {
            method: 'POST',
            url: `${FRONT_INTERNAL_URL}/api/cache/invalidate`,
            headers: [{ header: 'x-cache-secret', value: CACHE_PURGE_SECRET }],
            body: '{"match":"{{$last.slug}}"}'
          }
        }
      ]
    },
    {
      // Sans ce déclencheur, le géocodage d'une adresse fraîchement saisie
      // n'attendait qu'un miss `centres:all` (TTL + cooldown) : les champs
      // readonly restaient figés après la sauvegarde. Trigger `action`
      // non bloquant — une BAN lente ou en échec ne fait pas échouer
      // l'écriture éditoriale.
      name: 'Geocode centre on address change',
      icon: 'location_on',
      trigger: 'event',
      accountability: 'all',
      status: 'active',
      options: {
        type: 'action',
        scope: ['items.create', 'items.update'],
        collections: ['centres']
      },
      operations: [
        {
          name: 'Adresse saisie ?',
          key: 'address-written',
          type: 'condition',
          position_x: 20,
          position_y: 20,
          options: {
            // `payload` ne porte que les champs écrits : `address` présent
            // ⇔ l'éditeur vient de saisir/corriger l'adresse (update) ou
            // de la renseigner à la création. Le PATCH géodata de l'API
            // (department, geocoded_address, name…) ne touche pas
            // `address` → pas de boucle. (reject non câblé = arrêt propre)
            filter: { $trigger: { payload: { address: { _nnull: true } } } }
          }
        },
        {
          name: 'Géocoder via l’API (BAN)',
          key: 'geocode-centre',
          type: 'request',
          position_x: 40,
          position_y: 20,
          options: {
            method: 'POST',
            url: `${API_INTERNAL_URL}/admin/centres/geocode`,
            headers: [{ header: 'x-api-key', value: ADMIN_API_KEY }]
          }
        },
        {
          // Le PATCH géodata part du compte de sync (DIRECTUS_TOKEN) —
          // exclu du flow « Invalidate site cache » par la garde. La
          // purge ISR /centres est donc chaînée ici, après le géocodage.
          name: 'Purge front (ISR)',
          key: 'purge-front-centres',
          type: 'request',
          position_x: 60,
          position_y: 20,
          options: {
            method: 'POST',
            url: `${FRONT_INTERNAL_URL}/api/cache/invalidate`,
            headers: [{ header: 'x-cache-secret', value: CACHE_PURGE_SECRET }],
            body: '{"collection":"centres"}'
          }
        }
      ]
    }
  ]
}
