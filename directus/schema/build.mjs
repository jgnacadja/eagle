#!/usr/bin/env node
// Bootstrap unique du schéma Directus v1 (ST-11) : collections, relations,
// rôles + permissions. Vise un environnement Directus vierge fraîchement
// démarré (`docker compose up`).
//
// Ce script est l'outil de CONSTRUCTION du schéma — la source de vérité
// versionnée pour la restauration est le snapshot exporté ensuite via
// `directus schema snapshot` (voir directus/README.md). Existence-checked
// pour rester sûr à ré-exécuter, mais n'est pas le mécanisme de restore
// officiel.

import { collections, relations } from './collections.mjs'
import { buildFlows } from './flows.mjs'
import { permissionsFor, publicPermissions, roles } from './roles.mjs'
import { legalSectionToHtml, stripSectionNumber } from '../legalContent.mjs'
import { log, logError } from '../logger.mjs'

const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'http://localhost:8055'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL ?? 'admin@example.com'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD

async function authenticate() {
  if (!ADMIN_PASSWORD) throw new Error('DIRECTUS_ADMIN_PASSWORD manquant')
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  })
  if (!res.ok) throw new Error(`Authentification échouée (${res.status})`)
  const { data } = await res.json()
  return data.access_token
}

async function api(token, method, path, body) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${path} échoué (${res.status}): ${text}`)
  }
  return res.status === 204 ? null : res.json()
}

async function collectionExists(token, name) {
  const res = await fetch(`${DIRECTUS_URL}/collections/${name}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.ok
}

async function fieldExists(token, collection, field) {
  const res = await fetch(`${DIRECTUS_URL}/fields/${collection}/${field}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.ok
}

async function ensureCollections(token) {
  for (const def of collections) {
    if (await collectionExists(token, def.collection)) {
      log(`↷  collection ${def.collection} déjà présente`)
      // Convergent aussi sur le meta de collection (note, traductions
      // de nom, visibilité) — sinon un renommage ou un masquage déclaré ici
      // resterait invisible.
      await api(token, 'PATCH', `/collections/${def.collection}`, {
        meta: {
          note: def.note ?? null,
          translations: def.translations ?? null,
          hidden: def.hidden ?? false
        }
      })
      // Collection existante : créer les champs déclarés mais absents —
      // le fichier collections.mjs reste la source de vérité du schéma.
      for (const field of def.fields) {
        if (await fieldExists(token, def.collection, field.field)) {
          // Convergent : le meta déclaré ici (readonly, note, interface…)
          // reste la source de vérité — les réglages faits à la main dans
          // l'admin sont écrasés au prochain build.
          if (field.meta) {
            // PATCH meta fusionne les clés : readonly/hidden absents du meta
            // déclaré doivent être explicitement remis à false pour être
            // retirés de la base.
            await api(token, 'PATCH', `/fields/${def.collection}/${field.field}`, {
              meta: { readonly: false, hidden: false, ...field.meta }
            })
          }
          continue
        }
        await api(token, 'POST', `/fields/${def.collection}`, field)
        log(`✔  champ ${def.collection}.${field.field} créé`)
      }
      continue
    }
    await api(token, 'POST', '/collections', {
      collection: def.collection,
      icon: def.icon,
      meta: {
        note: def.note,
        translations: def.translations ?? null,
        hidden: def.hidden ?? false
      },
      schema: {},
      fields: def.fields
    })
    log(`✔  collection ${def.collection} créée (${def.fields.length} champs)`)
  }
}

async function relationExists(token, collection, field) {
  const res = await fetch(`${DIRECTUS_URL}/relations/${collection}/${field}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.ok
}

// Phase 1 : les colonnes M2O sont créées avant la migration de contenu —
// une colonne suffit pour écrire des items, la relation n'est pas requise.
async function ensureRelationFields(token) {
  for (const rel of relations) {
    if (await relationExists(token, rel.collection, rel.field)) continue
    if (await fieldExists(token, rel.collection, rel.field)) continue
    await api(token, 'POST', `/fields/${rel.collection}`, {
      field: rel.field,
      type: rel.related_collection === 'directus_files' ? 'uuid' : 'integer',
      meta: rel.meta
    })
    log(`✔  champ ${rel.collection}.${rel.field} créé`)
  }
}

// Le meta du champ relation (note, traductions…) reste convergent — sinon
// les réglages déclarés ici ne s'appliqueraient jamais sur une relation
// déjà créée. one_field/sort_field sont aussi reconvergés via PATCH.
async function convergeRelation(token, rel) {
  if (rel.meta) {
    await api(token, 'PATCH', `/fields/${rel.collection}/${rel.field}`, {
      meta: { readonly: false, hidden: false, ...rel.meta }
    })
  }
  const { data: current } = await api(token, 'GET', `/relations/${rel.collection}/${rel.field}`)
  const metaPatch = {}
  if (rel.one_field && current.meta?.one_field !== rel.one_field)
    metaPatch.one_field = rel.one_field
  if (rel.sort_field && current.meta?.sort_field !== rel.sort_field)
    metaPatch.sort_field = rel.sort_field
  if (rel.junction_field && current.meta?.junction_field !== rel.junction_field)
    metaPatch.junction_field = rel.junction_field
  if (Object.keys(metaPatch).length) {
    await api(token, 'PATCH', `/relations/${rel.collection}/${rel.field}`, {
      meta: metaPatch
    })
  }
  log(`↷  relation ${rel.collection}.${rel.field} déjà présente`)
}

async function createRelation(token, rel) {
  const meta = {}
  if (rel.one_field) meta.one_field = rel.one_field
  if (rel.sort_field) meta.sort_field = rel.sort_field
  if (rel.junction_field) meta.junction_field = rel.junction_field
  await api(token, 'POST', '/relations', {
    collection: rel.collection,
    field: rel.field,
    related_collection: rel.related_collection,
    ...(Object.keys(meta).length ? { meta } : {})
  })
  log(`✔  relation ${rel.collection}.${rel.field} → ${rel.related_collection}`)
}

// Phase 2 : relations + alias O2M (`one_field` crée le champ miroir sur le
// parent ; `sort_field` active le tri manuel et l'ordre de lecture). Sur
// une relation existante, on converge one_field/sort_field via PATCH.
async function ensureRelations(token) {
  for (const rel of relations) {
    if (await relationExists(token, rel.collection, rel.field)) {
      await convergeRelation(token, rel)
    } else {
      await createRelation(token, rel)
    }
    // Meta de l'alias O2M (interface, gabarit, traductions) — le champ est
    // créé par Directus au POST /relations, son meta reste convergent ici.
    if (rel.one_field && rel.one_meta) {
      await api(token, 'PATCH', `/fields/${rel.related_collection}/${rel.one_field}`, {
        meta: { readonly: false, hidden: false, ...rel.one_meta }
      })
    }
  }
}

// Migration « pages légales » : le champ JSON `pages_legales.sections`
// (interface `list` + tags — un clic supprimait un paragraphe) est
// converti en lignes `pages_legales_sections` puis supprimé pour laisser
// le nom `sections` à l'alias O2M créé par ensureRelations. Idempotent :
// une section déjà copiée (même page + ancre) est ignorée ; sans champ
// JSON, no-op. Interrompue avant toute suppression si le contenu source
// n'est pas migrable en entier — sinon une section sans ancre ou avec
// ancre dupliquée serait perdue avec le champ JSON.
// Valide et planifie la migration : toute section sans ancre ou avec une
// ancre dupliquée dans sa page est une erreur bloquante (la section serait
// perdue à la suppression du champ JSON). Les sections déjà copiées
// (même page + ancre) sont ignorées — le run est idempotent.
// Valide l'ancre d'une section : vide ou dupliquée dans sa page → erreur
// bloquante (la section serait perdue à la suppression du champ JSON).
function validSectionAnchor(page, index, section, pageAnchors) {
  const anchor = typeof section?.id === 'string' ? section.id.trim() : ''
  if (!anchor) {
    return { error: `${page.slug ?? page.id}#${index + 1} (ancre vide)` }
  }
  if (pageAnchors.has(anchor)) {
    return { error: `${page.slug ?? page.id}#${anchor} (ancre dupliquée)` }
  }
  pageAnchors.add(anchor)
  return { anchor }
}

// Valide et planifie la migration. Les sections déjà copiées (même page +
// ancre) sont ignorées — le run est idempotent.
function collectSectionsToMigrate(pages, migratedKeys) {
  const errors = []
  const toMigrate = []
  for (const page of pages ?? []) {
    const sections = Array.isArray(page.sections) ? page.sections : []
    const pageAnchors = new Set()
    for (const [index, section] of sections.entries()) {
      const { anchor, error } = validSectionAnchor(page, index, section, pageAnchors)
      if (error) {
        errors.push(error)
        continue
      }
      if (migratedKeys.has(`${page.id}:${anchor}`)) continue
      toMigrate.push({ page, index, section, anchor })
    }
  }
  return { errors, toMigrate }
}

async function migrateLegalSections(token) {
  // Champ inconnu → 403 ou 404 selon l'état du schéma : on liste les
  // champs de la collection plutôt que de lire le champ directement.
  const { data: fields } = await api(token, 'GET', '/fields/pages_legales?limit=-1')
  const field = (fields ?? []).find((f) => f.field === 'sections')
  if (field?.type !== 'json') return // absent ou déjà un alias O2M

  const { data: pages } = await api(token, 'GET', '/items/pages_legales?limit=-1')
  const { data: existing } = await api(token, 'GET', '/items/pages_legales_sections?limit=-1')
  const migratedKeys = new Set((existing ?? []).map((row) => `${row.page}:${row.anchor}`))

  const { errors, toMigrate } = collectSectionsToMigrate(pages, migratedKeys)
  if (errors.length) {
    throw new Error(
      `Migration pages_legales.sections interrompue — ancres à corriger avant suppression du champ JSON : ${errors.join(', ')}`
    )
  }

  for (const { page, index, section, anchor } of toMigrate) {
    await api(token, 'POST', '/items/pages_legales_sections', {
      page: page.id,
      sort: index + 1,
      title: stripSectionNumber(section?.title) || `Section ${index + 1}`,
      anchor,
      body: legalSectionToHtml(section)
    })
  }

  await api(token, 'DELETE', '/fields/pages_legales/sections')
  log(
    `✔  pages_legales.sections migré — ${toMigrate.length} section(s) copiée(s), champ JSON supprimé`
  )
}

// Migration « catégorie d'article » : le champ `articles.category` était un
// varchar libre (chaque rubrique retapée à la main) — il devient un M2O
// vers la collection `categories`. Pour chaque libellé distinct on crée la
// catégorie (slug dérivé), puis la colonne est recréée en `integer` et les
// articles rattachés — la relation FK est posée ensuite par
// ensureRelations. Idempotent : `category` déjà `integer` → no-op ; une
// catégorie existante (même slug) est réutilisée.
function slugifyCategory(label) {
  return label
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function migrateArticleCategories(token) {
  const { data: fields } = await api(token, 'GET', '/fields/articles?limit=-1')
  const field = (fields ?? []).find((f) => f.field === 'category')
  if (field?.type !== 'string') return // absent ou déjà un M2O integer

  const { data: articles } = await api(token, 'GET', '/items/articles?limit=-1&fields=id,category')
  const labelsBySlug = new Map()
  const articleLabel = new Map()
  for (const article of articles ?? []) {
    const label = article.category?.trim().replace(/\s+/g, ' ')
    if (!label) continue
    const slug = slugifyCategory(label)
    labelsBySlug.set(slug, label)
    articleLabel.set(article.id, slug)
  }

  const { data: existingCats } = await api(
    token,
    'GET',
    '/items/categories?limit=-1&fields=id,slug'
  )
  const slugToId = new Map((existingCats ?? []).map((cat) => [cat.slug, cat.id]))

  let sort = 1
  for (const [slug, name] of labelsBySlug) {
    if (slugToId.has(slug)) continue
    const { data: created } = await api(token, 'POST', '/items/categories', {
      status: 'published',
      slug,
      name,
      sort: sort++
    })
    slugToId.set(slug, created.id)
  }

  // La colonne varchar ne peut pas porter la contrainte FK ni être castée
  // proprement : on la supprime puis la recrée en integer (Directus gère le
  // DROP/ADD COLUMN), les ids sont réécrits depuis le mapping en mémoire.
  await api(token, 'DELETE', '/fields/articles/category')
  const rel = relations.find((r) => r.collection === 'articles' && r.field === 'category')
  await api(token, 'POST', '/fields/articles', {
    field: 'category',
    type: 'integer',
    meta: rel?.meta
  })

  for (const [articleId, slug] of articleLabel) {
    const categoryId = slugToId.get(slug)
    if (!categoryId) continue
    await api(token, 'PATCH', `/items/articles/${articleId}`, { category: categoryId })
  }

  log(
    `✔  articles.category migré — ${labelsBySlug.size} catégorie(s), ${articleLabel.size} article(s) rattaché(s)`
  )
}

async function fetchByName(token, endpoint) {
  const { data } = await api(token, 'GET', `${endpoint}?limit=-1`)
  return new Map(data.map((r) => [r.name, r.id]))
}

async function ensureRoles(token) {
  const existing = await fetchByName(token, '/roles')
  for (const role of roles) {
    if (existing.has(role.name)) {
      log(`↷  rôle ${role.name} déjà présent`)
      continue
    }
    const { data } = await api(token, 'POST', '/roles', {
      name: role.name,
      icon: role.icon,
      description: role.description
    })
    existing.set(role.name, data.id)
    log(`✔  rôle ${role.name} créé`)
  }
  return existing
}

// Directus 11 : les permissions ne sont pas attachées directement au rôle,
// mais à une Policy, elle-même reliée au rôle via directus_access. Une
// policy par rôle ici.
async function ensurePolicies(token) {
  const existing = await fetchByName(token, '/policies')
  for (const role of roles) {
    if (existing.has(role.name)) {
      log(`↷  policy ${role.name} déjà présente`)
      continue
    }
    const { data } = await api(token, 'POST', '/policies', {
      name: role.name,
      icon: role.icon,
      description: role.description,
      admin_access: false,
      app_access: true
    })
    existing.set(role.name, data.id)
    log(`✔  policy ${role.name} créée`)
  }
  return existing
}

async function ensureAccess(token, roleIds, policyIds) {
  const { data: existingAccess } = await api(token, 'GET', '/access?limit=-1')
  const linked = new Set(existingAccess.map((a) => `${a.role}:${a.policy}`))

  for (const role of roles) {
    const roleId = roleIds.get(role.name)
    const policyId = policyIds.get(role.name)
    const key = `${roleId}:${policyId}`
    if (linked.has(key)) {
      log(`↷  ${role.name} déjà lié à sa policy`)
      continue
    }
    await api(token, 'POST', '/access', { role: roleId, policy: policyId })
    log(`✔  ${role.name} lié à sa policy`)
  }
}

async function fetchExistingPermissions(token, policyId) {
  const { data } = await api(token, 'GET', '/permissions?limit=-1')
  const map = new Map()
  for (const p of data.filter((p) => p.policy === policyId)) {
    map.set(`${p.collection}:${p.action}`, {
      id: p.id,
      fields: p.fields,
      permissions: p.permissions
    })
  }
  return map
}

// Égalité profonde stable (ordre des clés insensible) — sert à comparer
// les filtres `permissions` d'une permission existante au schéma voulu.
function deepEqual(a, b) {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((key) => key in b && deepEqual(a[key], b[key]))
}

// Convergent sur `fields` et `permissions` : une permission existante dont
// la liste de champs ou le filtre diffèrent du schéma voulu est patchée —
// sinon une restriction type ['famille'] ou un filtre `status: published`
// ajouté après coup resterait figé alors que le schéma a évolué.
async function createPermissions(token, policyId, wanted, existing) {
  let created = 0
  let updated = 0
  for (const grant of wanted) {
    const key = `${grant.collection}:${grant.action}`
    const wantedFields = grant.fields ?? ['*']
    const wantedPermissions = grant.permissions ?? {}
    const current = existing.get(key)
    if (current) {
      const currentFields = current.fields ?? ['*']
      const sameFields =
        currentFields.length === wantedFields.length &&
        wantedFields.every((f) => currentFields.includes(f))
      const samePermissions = deepEqual(current.permissions ?? {}, wantedPermissions)
      if (!sameFields || !samePermissions) {
        await api(token, 'PATCH', `/permissions/${current.id}`, {
          ...(sameFields ? {} : { fields: wantedFields }),
          ...(samePermissions ? {} : { permissions: wantedPermissions })
        })
        updated += 1
      }
      continue
    }
    await api(token, 'POST', '/permissions', {
      policy: policyId,
      collection: grant.collection,
      action: grant.action,
      fields: wantedFields,
      permissions: wantedPermissions,
      validation: {}
    })
    created += 1
  }
  return { created, updated }
}

async function ensurePermissions(token, policyIds) {
  for (const role of roles) {
    const policyId = policyIds.get(role.name)
    const existing = await fetchExistingPermissions(token, policyId)
    const wanted = permissionsFor(role.name)
    const { created, updated } = await createPermissions(token, policyId, wanted, existing)
    log(
      `✔  permissions ${role.name} — ${created} créées, ${updated} mises à jour, ${wanted.length - created - updated} déjà présentes`
    )
  }
}

// Le rôle "Public" natif de Directus (visiteurs non authentifiés) n'est pas
// dans `roles` — c'est un cas particulier repéré via directus_access où
// `role` et `user` sont tous les deux null. Sans permissions dessus, un
// site public ne peut rien lire (deny-by-default).
async function findPublicPolicyId(token) {
  const { data } = await api(token, 'GET', '/access?limit=-1')
  const publicAccess = data.find((a) => a.role === null && a.user === null)
  if (!publicAccess)
    throw new Error('Policy Public introuvable (attendue nativement dans Directus)')
  return publicAccess.policy
}

async function ensurePublicPermissions(token) {
  const policyId = await findPublicPolicyId(token)
  const existing = await fetchExistingPermissions(token, policyId)
  const wanted = publicPermissions()
  const { created, updated } = await createPermissions(token, policyId, wanted, existing)
  log(
    `✔  permissions public — ${created} créées, ${updated} mises à jour, ${wanted.length - created - updated} déjà présentes`
  )
}

// Flows (webhooks sortants) : chaînés via `operation` sur le flow puis
// `resolve` sur chaque opération — l'ordre du tableau `operations` définit
// la chaîne. Convergent : les opérations existantes (match par `key`) sont
// patchées — URLs et secrets d'env restent la source de vérité.
// Id du compte de service porteur de DIRECTUS_TOKEN (écritures de la sync
// Digiforma) — résolu via /users/me. Les flows l'excluent en première
// opération : ses PATCH horaires par formation généreraient sinon une
// rafale de purges redondantes, la sync purgeant déjà le catalogue en fin
// de run. Token absent/invalide → flows construits sans la garde.
async function fetchSyncUserId() {
  const syncToken = process.env.DIRECTUS_TOKEN
  if (!syncToken) return null
  const res = await fetch(`${DIRECTUS_URL}/users/me?fields=id`, {
    headers: { Authorization: `Bearer ${syncToken}` }
  })
  if (!res.ok) return null
  const { data } = await res.json()
  return data?.id ?? null
}

async function ensureFlowOperations(token, flowId, operations) {
  const { data: existing } = await api(
    token,
    'GET',
    `/operations?filter[flow][_eq]=${flowId}&limit=-1`
  )
  const byKey = new Map(existing.map((op) => [op.key, op]))

  let previousId = null
  for (const op of operations) {
    const current = byKey.get(op.key)
    if (current) {
      await api(token, 'PATCH', `/operations/${current.id}`, {
        name: op.name,
        type: op.type,
        options: op.options
      })
    } else {
      const { data: created } = await api(token, 'POST', '/operations', {
        ...op,
        flow: flowId
      })
      byKey.set(op.key, created)
    }
    const opId = byKey.get(op.key).id
    if (previousId) {
      await api(token, 'PATCH', `/operations/${previousId}`, { resolve: opId })
    } else {
      await api(token, 'PATCH', `/flows/${flowId}`, { operation: opId })
    }
    previousId = opId
  }
}

async function ensureFlows(token, syncUserId) {
  const { data: existing } = await api(token, 'GET', '/flows?limit=-1')
  const byName = new Map(existing.map((f) => [f.name, f]))

  for (const flowDef of buildFlows({ syncUserId })) {
    const { operations, ...flowPayload } = flowDef
    const known = byName.get(flowDef.name)
    if (known) {
      await api(token, 'PATCH', `/flows/${known.id}`, flowPayload)
      await ensureFlowOperations(token, known.id, operations)
      log(`↷  flow ${flowDef.name} déjà présent — opérations resynchronisées`)
      continue
    }
    const { data: flow } = await api(token, 'POST', '/flows', flowPayload)
    await ensureFlowOperations(token, flow.id, operations)
    log(`✔  flow ${flowDef.name} créé (${operations.length} opérations)`)
  }
}

async function main() {
  log(`Connexion à Directus (${DIRECTUS_URL})…`)
  const token = await authenticate()

  await ensureCollections(token)
  await ensureRelationFields(token)
  // La migration JSON → lignes tourne entre colonnes et alias : elle lit
  // `pages_legales.sections` (encore JSON), écrit via la colonne `page`,
  // puis supprime le champ pour libérer le nom de l'alias O2M.
  await migrateLegalSections(token)
  await migrateArticleCategories(token)
  await ensureRelations(token)
  const roleIds = await ensureRoles(token)
  const policyIds = await ensurePolicies(token)
  await ensureAccess(token, roleIds, policyIds)
  await ensurePermissions(token, policyIds)
  await ensurePublicPermissions(token)

  const syncUserId = await fetchSyncUserId()
  if (!syncUserId) {
    log('⚠  DIRECTUS_TOKEN absent/invalide — flows construits sans exclusion du compte de sync')
  }
  await ensureFlows(token, syncUserId)

  log('Schéma v1 prêt.')
}

try {
  await main()
} catch (error) {
  logError('Build schema échoué :', error instanceof Error ? error.message : error)
  process.exitCode = 1
}
