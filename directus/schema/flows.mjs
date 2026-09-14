// Flows Directus d'invalidation de cache — webhooks sortants créés par
// `pnpm directus:build`. URLs et secrets lus depuis .env au build —
// jamais commités dans le schéma. Trigger `action` (non bloquant) : une
// purge qui échoue ne fait jamais échouer l'écriture éditoriale.
//
// Deux niveaux de précision :
// - « Invalidate site cache » (toutes collections de contenu) : purge le
//   cache catalogue Redis côté API et les routes ISR du front associées à
//   la collection modifiée (mapping collection → routes côté front).
// - « Invalidate formation page » (formations uniquement) : relit le slug
//   de la formation et purge uniquement sa page fiche côté front.

// Directus tourne dans docker-compose alors que l'API et le front tournent
// sur l'hôte en dev (`pnpm dev`) : `localhost` dans le container désigne le
// container lui-même — les webhooks passent par `host.docker.internal`.
// En stack full-compose, surcharger avec `api:3001` / `front:3000`.
const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? 'http://host.docker.internal:3001'
const FRONT_INTERNAL_URL = process.env.FRONT_INTERNAL_URL ?? 'http://host.docker.internal:3000'

// Collections dont une écriture peut changer une page publique.
const CONTENT_COLLECTIONS = [
  'formations',
  'centres',
  'familles_formation',
  'sous_familles_formation',
  'articles',
  'pages',
  'page_blocks',
  'stats'
]

export const flows = [
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
      {
        name: 'Purge API (Redis)',
        key: 'purge-api',
        type: 'request',
        position_x: 20,
        position_y: 20,
        options: {
          method: 'POST',
          url: `${API_INTERNAL_URL}/admin/cache/invalidate`,
          headers: [{ header: 'x-api-key', value: process.env.ADMIN_API_KEY ?? '' }],
          body: '{"collection":"{{$trigger.collection}}"}'
        }
      },
      {
        name: 'Purge front (ISR)',
        key: 'purge-front',
        type: 'request',
        position_x: 40,
        position_y: 20,
        options: {
          method: 'POST',
          url: `${FRONT_INTERNAL_URL}/api/cache/invalidate`,
          headers: [{ header: 'x-cache-secret', value: process.env.NUXT_CACHE_PURGE_SECRET ?? '' }],
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
      {
        name: 'Relire la formation',
        key: 'read-formation',
        type: 'item-read',
        position_x: 20,
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
        position_x: 40,
        position_y: 20,
        options: {
          method: 'POST',
          url: `${FRONT_INTERNAL_URL}/api/cache/invalidate`,
          headers: [{ header: 'x-cache-secret', value: process.env.NUXT_CACHE_PURGE_SECRET ?? '' }],
          body: '{"match":"{{$last.slug}}"}'
        }
      }
    ]
  }
]
