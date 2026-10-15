import {
  ROUTED_COLLECTIONS,
  WATCHED_FIELDS,
  applyPlan,
  planForCreate,
  planForUpdate,
  publicPath
} from './redirects.js'

// ST-03 — aucun changement d'URL ne produit de 404. Le `filter` lit l'état
// AVANT écriture (l'action ne reçoit plus les anciennes valeurs) et empile
// les plans ; l'`action` les applique après l'écriture — une erreur là ne
// bloque jamais l'édition.
//
// `formations.famille` fait partie de l'URL : le renommage d'une famille
// cascade sur ses formations publiées, et le changement de famille d'une
// formation déplace sa page.
const FIELDS_BY_COLLECTION = {
  formations: ['id', 'slug', 'status', 'famille'],
  familles_formation: ['id', 'slug', 'status'],
  articles: ['id', 'slug', 'status'],
  centres: ['id', 'slug', 'status'],
  pages_legales: ['id', 'slug', 'status']
}

export default ({ filter, action }, { services, getSchema, database, logger }) => {
  const { ItemsService } = services
  // Plans empilés par le filter, consommés par l'action du même événement —
  // clé `${collection}:${itemId}`.
  const pending = new Map()

  const svc = async (collection) =>
    new ItemsService(collection, {
      knex: database,
      schema: await getSchema(),
      accountability: { admin: true }
    })

  function enqueue(collection, id, plan) {
    if (!plan) return
    const key = `${collection}:${id}`
    const plans = pending.get(key) ?? []
    plans.push(plan)
    pending.set(key, plans)
  }

  async function familleSlugOf(familles, familleId, cache) {
    if (familleId === null || familleId === undefined) return null
    if (!cache.has(familleId)) {
      const famille = await familles.readOne(familleId, { fields: ['slug'] })
      cache.set(familleId, famille?.slug ?? null)
    }
    return cache.get(familleId)
  }

  // Lit l'état public « avant » de chaque item touché et empile le plan
  // correspondant. `payload` ne porte que les champs écrits : les autres
  // valeurs viennent de la ligne lue (encore ancienne à ce stade).
  const beforeWrite = (collection) => async (payload, meta) => {
    if (!WATCHED_FIELDS.some((f) => f in payload)) return payload
    const keys = meta?.keys ?? []
    if (!keys.length) return payload

    const items = await svc(collection)
    const familles = collection === 'formations' ? await svc('familles_formation') : null
    const familleCache = new Map()
    const current = await items.readByQuery({
      filter: { id: { _in: keys } },
      fields: FIELDS_BY_COLLECTION[collection],
      limit: -1
    })

    for (const item of current.data ?? []) {
      const before = {
        status: item.status,
        path: publicPath(
          collection,
          item.slug,
          await familleSlugOf(familles, item.famille, familleCache)
        )
      }
      const slug = 'slug' in payload ? payload.slug : item.slug
      const status = 'status' in payload ? payload.status : item.status
      const famille = 'famille' in payload ? payload.famille : item.famille
      const after = {
        status,
        path: publicPath(collection, slug, await familleSlugOf(familles, famille, familleCache))
      }
      enqueue(collection, item.id, planForUpdate(before, after))
    }

    // Renommage de famille : toutes ses formations publiées déménagent —
    // chacune reçoit sa redirection (leurs slugs n'ont pas changé).
    if (collection === 'familles_formation' && 'slug' in payload) {
      const formations = await svc('formations')
      for (const item of current.data ?? []) {
        const children = await formations.readByQuery({
          filter: { _and: [{ famille: { _eq: item.id } }, { status: { _eq: 'published' } }] },
          fields: ['id', 'slug'],
          limit: -1
        })
        for (const child of children.data ?? []) {
          enqueue(
            collection,
            item.id,
            planForUpdate(
              { status: 'published', path: publicPath('formations', child.slug, item.slug) },
              { status: 'published', path: publicPath('formations', child.slug, payload.slug) }
            )
          )
        }
      }
    }

    return payload
  }

  const beforeDelete = (collection) => async (payload, meta) => {
    const keys = Array.isArray(payload) ? payload : (meta?.keys ?? [])
    if (!keys.length) return payload

    const items = await svc(collection)
    const familles = collection === 'formations' ? await svc('familles_formation') : null
    const familleCache = new Map()
    const current = await items.readByQuery({
      filter: { id: { _in: keys } },
      fields: FIELDS_BY_COLLECTION[collection],
      limit: -1
    })

    for (const item of current.data ?? []) {
      const before = {
        status: item.status,
        path: publicPath(
          collection,
          item.slug,
          await familleSlugOf(familles, item.famille, familleCache)
        )
      }
      enqueue(collection, item.id, planForUpdate(before, { status: 'deleted', path: null }))
    }
    return payload
  }

  // Consomme les plans de l'événement (et d'éventuels reliquats d'une
  // écriture avortée — même collection, mêmes clés, écrasés au filter).
  const afterWrite = (collection) => async (meta) => {
    const keys = meta?.keys ?? []
    const redirects = await svc('redirects')
    for (const key of keys) {
      const plans = pending.get(`${collection}:${key}`) ?? []
      pending.delete(`${collection}:${key}`)
      for (const plan of plans) {
        try {
          await applyPlan(redirects, plan)
        } catch (error) {
          logger?.warn({ error, plan, collection }, 'slug-redirects: plan not applied')
        }
      }
    }
    // Cascade famille : les plans enfants sont empilés sous la clé parente —
    // rien à faire d'autre, ils ont été vidés avec elle.
  }

  const afterCreate = (collection) => async (meta) => {
    const items = Array.isArray(meta?.payload) ? meta.payload : [meta?.payload]
    const familles = collection === 'formations' ? await svc('familles_formation') : null
    const familleCache = new Map()
    const redirects = await svc('redirects')
    for (const item of items) {
      if (!item || typeof item !== 'object') continue
      try {
        const plan = planForCreate({
          status: item.status,
          path: publicPath(
            collection,
            item.slug,
            await familleSlugOf(familles, item.famille, familleCache)
          )
        })
        await applyPlan(redirects, plan)
      } catch (error) {
        logger?.warn({ error, collection }, 'slug-redirects: revive plan failed')
      }
    }
  }

  for (const collection of ROUTED_COLLECTIONS) {
    filter(`${collection}.items.update`, beforeWrite(collection))
    filter(`${collection}.items.delete`, beforeDelete(collection))
    action(`${collection}.items.update`, afterWrite(collection))
    action(`${collection}.items.delete`, afterWrite(collection))
    action(`${collection}.items.create`, afterCreate(collection))
  }
}
