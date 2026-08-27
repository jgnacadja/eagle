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

async function ensureRelations(token) {
  for (const rel of relations) {
    if (await fieldExists(token, rel.collection, rel.field)) {
      log(`↷  relation ${rel.collection}.${rel.field} déjà présente`)
      continue
    }
    await api(token, 'POST', `/fields/${rel.collection}`, {
      field: rel.field,
      type: rel.related_collection === 'directus_files' ? 'uuid' : 'integer',
      meta: rel.meta
    })
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
  return new Set(
    data.filter((p) => p.policy === policyId).map((p) => `${p.collection}:${p.action}`)
  )
}

async function createPermissions(token, policyId, wanted, existing) {
  let created = 0
  for (const grant of wanted) {
    const key = `${grant.collection}:${grant.action}`
    if (existing.has(key)) continue
    await api(token, 'POST', '/permissions', {
      policy: policyId,
      collection: grant.collection,
      action: grant.action,
      fields: ['*'],
      permissions: grant.permissions ?? {},
      validation: {}
    })
    created += 1
  }
  return created
}

async function ensurePermissions(token, policyIds) {
  for (const role of roles) {
    const policyId = policyIds.get(role.name)
    const existing = await fetchExistingPermissions(token, policyId)
    const wanted = permissionsFor(role.name)
    const created = await createPermissions(token, policyId, wanted, existing)
    log(`✔  permissions ${role.name} — ${created} créées, ${wanted.length - created} déjà présentes`)
  }
}

// Le rôle "Public" natif de Directus (visiteurs non authentifiés) n'est pas
// dans `roles` — c'est un cas particulier repéré via directus_access où
// `role` et `user` sont tous les deux null. Sans permissions dessus, un
// site public ne peut rien lire (deny-by-default).
async function findPublicPolicyId(token) {
  const { data } = await api(token, 'GET', '/access?limit=-1')
  const publicAccess = data.find((a) => a.role === null && a.user === null)
  if (!publicAccess) throw new Error('Policy Public introuvable (attendue nativement dans Directus)')
  return publicAccess.policy
}

async function ensurePublicPermissions(token) {
  const policyId = await findPublicPolicyId(token)
  const existing = await fetchExistingPermissions(token, policyId)
  const wanted = publicPermissions()
  const created = await createPermissions(token, policyId, wanted, existing)
  log(`✔  permissions public — ${created} créées, ${wanted.length - created} déjà présentes`)
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

  log('Schéma v1 prêt.')
}

main().catch((error) => {
  logError('Build schema échoué :', error.message)
  process.exitCode = 1
})
