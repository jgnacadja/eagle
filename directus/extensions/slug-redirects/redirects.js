// ST-03 — logique du hook `slug-redirects` : aucun changement d'URL ne doit
// produire de 404. Les fonctions ici sont pures ou ne dépendent que d'un
// service items (ItemsService-like) injecté — testables hors Directus.

// Collections porteuses d'une URL publique par slug. `pages` est absente :
// ses items alimentent des gabarits codés (accueil, institutionnel), pas des
// routes — seules `pages_legales` portent une URL `/{slug}`.
export const ROUTED_COLLECTIONS = [
  'formations',
  'familles_formation',
  'articles',
  'centres',
  'pages_legales'
]

// Champs qui changent l'URL ou la disponibilité publique d'un item — un
// PATCH ne touchant aucun d'eux ne peut pas créer de redirection.
export const WATCHED_FIELDS = ['slug', 'status', 'famille']

/** Chemin public d'un item (plan d'URL). `familleSlug` = slug de la famille. */
export function publicPath(collection, slug, familleSlug) {
  switch (collection) {
    case 'formations':
      return familleSlug ? `/formations/${familleSlug}/${slug}` : null
    case 'familles_formation':
      return `/formations/${slug}`
    case 'articles':
      return `/actualites/${slug}`
    case 'centres':
      return `/centres/${slug}`
    case 'pages_legales':
      return `/${slug}`
    default:
      return null
  }
}

export function normalizePath(path) {
  if (typeof path !== 'string') return null
  const clean = path.replace(/\/+$/, '').toLowerCase()
  return clean.startsWith('/') ? clean : `/${clean}`
}

/**
 * Décide ce qu'un changement d'item implique dans `redirects`.
 * `before`/`after` : `{ path: string|null, status: string }` — `path` null =
 * l'item n'a pas d'URL publique (ex. formation sans famille).
 *   rename : l'URL vivante change → 301 ancien → nouveau, chaînes corrigées.
 *   gone   : la page disparaît (dépublication, suppression) → 410.
 *   revive : la page revient → les lignes auto bloquant l'adresse partent.
 */
export function planForUpdate(before, after) {
  const wasLive = before.status === 'published' && Boolean(before.path)
  const isLive = after.status === 'published' && Boolean(after.path)
  if (wasLive && isLive && before.path !== after.path) {
    return { type: 'rename', from: before.path, to: after.path }
  }
  if (wasLive && !isLive) return { type: 'gone', path: before.path }
  if (!wasLive && isLive) return { type: 'revive', path: after.path }
  return null
}

/** Une création ou une relecture d'item n'a qu'un état « après ». */
export function planForCreate(after) {
  return after.status === 'published' && after.path ? { type: 'revive', path: after.path } : null
}

/**
 * Applique un plan sur la collection `redirects` via un service items
 * (createMany / updateByQuery / deleteByQuery / readByQuery, filtres Directus).
 * Règles : `from_path` unique ; une ligne « manual »/« import » n'est jamais
 * écrasée par l'automate ; jamais de chaîne (les cibles suivent le dernier
 * renommage) ni de boucle (une ligne dont la source redevient vivante part).
 */
export async function applyPlan(svc, plan) {
  if (!plan) return
  switch (plan.type) {
    case 'rename':
      return applyRename(svc, plan.from, plan.to)
    case 'gone':
      return applyGone(svc, plan.path)
    case 'revive':
      return applyRevive(svc, plan.path)
  }
}

async function applyRename(svc, from, to) {
  // La cible redevient vivante : une ligne auto partant DE `to` masquerait
  // la page — elle part (réversible A→B→A, l'inverse sera recréé dessous).
  const outgoing = await svc.readByQuery({
    filter: { _and: [{ from_path: { _eq: to } }, { origin: { _eq: 'auto' } }] },
    fields: ['id'],
    limit: -1
  })
  for (const row of outgoing.data ?? []) {
    await svc.deleteByQuery({ filter: { id: { _eq: row.id } } })
  }

  // Pas de chaîne : les lignes pointant vers l'ancienne adresse suivent.
  await svc.updateByQuery(
    { filter: { _and: [{ to_path: { _eq: from } }, { origin: { _eq: 'auto' } }] } },
    { to_path: to }
  )

  // La redirection du chemin renommé : créée si absente, mise à jour si auto,
  // jamais touchée si saisie à la main (l'éditorial prime).
  const existing = await svc.readByQuery({
    filter: { from_path: { _eq: from } },
    fields: ['id', 'origin'],
    limit: 1
  })
  const row = existing.data?.[0]
  if (!row) {
    await svc.createMany([{ from_path: from, to_path: to, status: '301', origin: 'auto' }])
  } else if (row.origin === 'auto') {
    await svc.updateByQuery({ filter: { id: { _eq: row.id } } }, { to_path: to, status: '301' })
  }

  // Filet : une ligne auto pointant sur elle-même (A→B→A via la réécriture
  // de cibles) bouclerait la résolution.
  await svc.deleteByQuery({
    filter: {
      _and: [{ from_path: { _eq: to } }, { to_path: { _eq: to } }, { origin: { _eq: 'auto' } }]
    }
  })
}

async function applyGone(svc, path) {
  // La page disparaît : les lignes auto menant à elle mèneraient vers une
  // 404 — elles deviennent 410 à leur propre adresse.
  await svc.updateByQuery(
    { filter: { _and: [{ to_path: { _eq: path } }, { origin: { _eq: 'auto' } }] } },
    { to_path: null, status: '410' }
  )

  const existing = await svc.readByQuery({
    filter: { from_path: { _eq: path } },
    fields: ['id', 'origin', 'status'],
    limit: 1
  })
  const row = existing.data?.[0]
  if (!row) {
    await svc.createMany([{ from_path: path, to_path: null, status: '410', origin: 'auto' }])
  } else if (row.origin === 'auto' && row.status !== '410') {
    // Un 301 auto depuis l'adresse devient obsolète : la page n'existe plus.
    await svc.updateByQuery({ filter: { id: { _eq: row.id } } }, { to_path: null, status: '410' })
  }
}

async function applyRevive(svc, path) {
  // La page revient à cette adresse : un 301/410 auto qui la couvrait la
  // rendrait injoignable. Les lignes manuelles/importées restent (décision
  // éditoriale — le référent peut détourner l'adresse à dessein).
  await svc.deleteByQuery({
    filter: { _and: [{ from_path: { _eq: path } }, { origin: { _eq: 'auto' } }] }
  })
}
