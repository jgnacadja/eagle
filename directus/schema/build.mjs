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
import { flows } from './flows.mjs'
import { permissionsFor, publicPermissions, roles } from './roles.mjs'
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
      meta: { note: def.note },
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

async function ensureRelations(token) {
  for (const rel of relations) {
    if (await relationExists(token, rel.collection, rel.field)) {
      log(`↷  relation ${rel.collection}.${rel.field} déjà présente`)
      continue
    }
    if (!(await fieldExists(token, rel.collection, rel.field))) {
      await api(token, 'POST', `/fields/${rel.collection}`, {
        field: rel.field,
        type: rel.related_collection === 'directus_files' ? 'uuid' : 'integer',
        meta: rel.meta
      })
    }
    await api(token, 'POST', '/relations', {
      collection: rel.collection,
      field: rel.field,
      related_collection: rel.related_collection
    })
    log(`✔  relation ${rel.collection}.${rel.field} → ${rel.related_collection}`)
  }
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
    map.set(`${p.collection}:${p.action}`, { id: p.id, fields: p.fields })
  }
  return map
}

// Convergent sur `fields` : une permission existante dont la liste de
// champs diffère du schéma voulu est patchée — sinon une restriction type
// ['famille'] resterait figée alors que le schéma a évolué.
async function createPermissions(token, policyId, wanted, existing) {
  let created = 0
  let updated = 0
  for (const grant of wanted) {
    const key = `${grant.collection}:${grant.action}`
    const wantedFields = grant.fields ?? ['*']
    const current = existing.get(key)
    if (current) {
      const currentFields = current.fields ?? ['*']
      const sameFields =
        currentFields.length === wantedFields.length &&
        wantedFields.every((f) => currentFields.includes(f))
      if (!sameFields) {
        await api(token, 'PATCH', `/permissions/${current.id}`, { fields: wantedFields })
        updated += 1
      }
      continue
    }
    await api(token, 'POST', '/permissions', {
      policy: policyId,
      collection: grant.collection,
      action: grant.action,
      fields: wantedFields,
      permissions: grant.permissions ?? {},
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

async function ensureFlows(token) {
  const { data: existing } = await api(token, 'GET', '/flows?limit=-1')
  const byName = new Map(existing.map((f) => [f.name, f]))

  for (const flowDef of flows) {
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
  await ensureRelations(token)
  const roleIds = await ensureRoles(token)
  const policyIds = await ensurePolicies(token)
  await ensureAccess(token, roleIds, policyIds)
  await ensurePermissions(token, policyIds)
  await ensurePublicPermissions(token)
  await ensureFlows(token)

  log('Schéma v1 prêt.')
}

try {
  await main()
} catch (error) {
  logError('Build schema échoué :', error instanceof Error ? error.message : error)
  process.exitCode = 1
}
