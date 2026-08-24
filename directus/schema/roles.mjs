// 5 rôles RBAC (ST-11). "super-admin" = rôle Administrator natif de
// Directus (bypass total, existe déjà) — les 4 autres sont créés ici.
//
// Directus 11 sépare rôle et permissions via une Policy intermédiaire
// (role -> directus_access -> policy -> permissions), pas un champ `role`
// direct sur les permissions comme dans les versions antérieures. Une
// policy par rôle ici — mapping le plus simple pour ce cas d'usage.

export const roles = [
  { name: 'admin', icon: 'admin_panel_settings', description: 'Accès complet au contenu, hors administration système.' },
  { name: 'editeur', icon: 'edit', description: 'Crée et édite le contenu en brouillon.' },
  { name: 'moderateur', icon: 'fact_check', description: 'Relit et publie le contenu.' },
  { name: 'lecteur', icon: 'visibility', description: 'Lecture seule, aucune écriture.' }
]

const CONTENT_COLLECTIONS = ['centres', 'familles_formation', 'articles', 'pages', 'page_blocks', 'stats']

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
        ...['articles', 'page_blocks'].flatMap((c) => grants(c, ['create', 'read', 'update'])),
        ...['centres', 'familles_formation', 'pages', 'stats'].flatMap((c) => grants(c, ['read'])),
        ...grants('directus_files', ['create', 'read'])
      ]

    case 'moderateur':
      return [
        ...['articles', 'page_blocks'].flatMap((c) => grants(c, ['read', 'update'])),
        ...['centres', 'familles_formation', 'pages', 'stats', 'directus_files'].flatMap((c) => grants(c, ['read']))
      ]

    case 'lecteur':
      return [...CONTENT_COLLECTIONS, 'directus_files'].flatMap((c) => grants(c, ['read']))

    default:
      return []
  }
}
