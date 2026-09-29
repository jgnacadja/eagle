#!/usr/bin/env node
// Restaure un backup produit par backup.mjs sur une instance Directus.
// Usage : pnpm directus:restore -- backups/directus-<stamp> [--yes]
//   --yes requis : la restauration écrit sur la cible (upsert par clé primaire).
//
// Cible résolue comme backup.mjs : DIRECTUS_BACKUP_URL >
// NUXT_PUBLIC_DIRECTUS_URL > DIRECTUS_URL > http://localhost:8055.
// Token identique (DIRECTUS_BACKUP_TOKEN > DIRECTUS_MCP_TOKEN > DIRECTUS_TOKEN,
// sinon login admin email/password).
//
// Étapes :
//   1. Schéma : /schema/diff puis /schema/apply (snapshot du backup).
//   2. Fichiers : /files/import depuis les URLs du backup source, id préservé ;
//      repli métadonnées-only (PATCH) si l'id existe déjà.
//   3. Données : upsert POST puis PATCH sur conflit de clé ; les items en échec
//      de FK sont re-joués une fois toutes les collections passées.
// Les collections système (system/*.json) ne sont pas réinjectées
// automatiquement — à rejouer manuellement selon le besoin.

import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { log, logError } from '../logger.mjs'

const args = process.argv.slice(2)
const BACKUP_DIR = args.find((a) => !a.startsWith('--'))
const CONFIRMED = args.includes('--yes')
const DIRECTUS_URL = (
  process.env.DIRECTUS_BACKUP_URL ??
  process.env.NUXT_PUBLIC_DIRECTUS_URL ??
  process.env.DIRECTUS_URL ??
  'http://localhost:8055'
).replace(/\/$/, '')
const STATIC_TOKEN =
  process.env.DIRECTUS_BACKUP_TOKEN ?? process.env.DIRECTUS_MCP_TOKEN ?? process.env.DIRECTUS_TOKEN

// Ordre parents → enfants pour les clés étrangères connues du projet.
// Les collections inconnues passent ensuite (ordre alphabétique), puis une
// passe de rattrapage rejoue les items rejetés par FK.
const COLLECTION_ORDER = [
  'pages',
  'page_blocks',
  'familles_formation',
  'centres',
  'sous_familles_formation',
  'formations',
  'articles',
  'avis',
  'stats',
  'pages_legales',
  'pages_legales_sections',
  'pages_legales_subsections'
]

let token

async function authenticate() {
  if (STATIC_TOKEN) return STATIC_TOKEN
  const email = process.env.DIRECTUS_ADMIN_EMAIL
  const password = process.env.DIRECTUS_ADMIN_PASSWORD
  if (!email || !password) throw new Error('Aucun token ni identifiants admin dans l’env')
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) throw new Error(`Authentification échouée (${res.status})`)
  return (await res.json()).data.access_token
}

async function api(path, options = {}) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
  const body = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, body }
}

async function applySchema() {
  const raw = JSON.parse(await readFile(join(BACKUP_DIR, 'schema.json'), 'utf8'))
  const schema = raw.data ?? raw
  // Directus 11 : snapshot en body brut, `force` en query. 204 = aucun diff.
  const diff = await api('/schema/diff?force=true', {
    method: 'POST',
    body: JSON.stringify(schema)
  })
  if (diff.status === 204) {
    log('  schéma déjà à jour')
    return
  }
  if (!diff.ok || !diff.body.data) throw new Error(`schema/diff → ${diff.status}`)
  const apply = await api('/schema/apply', {
    method: 'POST',
    body: JSON.stringify(diff.body.data)
  })
  if (!apply.ok) throw new Error(`schema/apply → ${apply.status}`)
  const changes = diff.body.data?.diff?.length ?? '?'
  log(`  schéma appliqué (${changes} changement(s))`)
}

async function restoreFiles(manifest) {
  let meta
  try {
    meta = JSON.parse(await readFile(join(BACKUP_DIR, 'files', '_files.json'), 'utf8'))
  } catch {
    log('  files: pas de métadonnées, ignoré')
    return
  }
  const source = manifest?.url ?? DIRECTUS_URL
  let ok = 0
  for (const file of meta) {
    const { id, ...fields } = file
    const res = await api('/files/import', {
      method: 'POST',
      body: JSON.stringify({ url: `${source}/assets/${id}`, data: { id, ...fields } })
    })
    if (res.ok) {
      ok++
    } else {
      // Id déjà présent : on aligne au moins les métadonnées.
      const patch = await api(`/files/${id}`, { method: 'PATCH', body: JSON.stringify(fields) })
      if (patch.ok) ok++
      else logError(`  file ${id}: ${res.status}`)
    }
  }
  log(`  files: ${ok}/${meta.length}`)
}

async function upsertItem(collection, item, pkField = 'id') {
  const res = await api(`/items/${collection}`, { method: 'POST', body: JSON.stringify(item) })
  if (res.ok) return 'created'
  const code = res.body?.errors?.[0]?.extensions?.code
  if (code === 'RECORD_NOT_UNIQUE' || res.status === 400 || res.status === 409) {
    const patch = await api(`/items/${collection}/${item[pkField]}`, {
      method: 'PATCH',
      body: JSON.stringify(item)
    })
    return patch.ok ? 'updated' : `error:${patch.status}`
  }
  return `error:${res.status}`
}

async function restoreData() {
  const files = (await readdir(join(BACKUP_DIR, 'data')))
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.slice(0, -5))
  const ordered = [
    ...COLLECTION_ORDER.filter((c) => files.includes(c)),
    ...files.filter((c) => !COLLECTION_ORDER.includes(c)).sort()
  ]
  const deferred = []

  for (const collection of ordered) {
    const payload = JSON.parse(
      await readFile(join(BACKUP_DIR, 'data', `${collection}.json`), 'utf8')
    )
    const items = Array.isArray(payload) ? payload : [payload]
    let ok = 0
    for (const item of items) {
      const result = await upsertItem(collection, item)
      if (result.startsWith('error:')) deferred.push({ collection, item, result })
      else ok++
    }
    log(`  ${collection}: ${ok}/${items.length}`)
  }

  if (deferred.length > 0) {
    log(`  rattrapage FK : ${deferred.length} item(s)`)
    let remaining = deferred.length
    for (const { collection, item } of deferred) {
      const result = await upsertItem(collection, item)
      if (!result.startsWith('error:')) remaining--
      else logError(`  ${collection}#${item.id}: toujours en échec (${result})`)
    }
    if (remaining > 0) logError(`${remaining} item(s) non restaurés`)
  }
}

async function restore() {
  if (!BACKUP_DIR)
    throw new Error('Indiquer le dossier de backup : restore.mjs backups/directus-<stamp>')
  const manifest = JSON.parse(await readFile(join(BACKUP_DIR, 'manifest.json'), 'utf8'))
  if (!CONFIRMED) {
    log(`Restore de ${manifest.url} (${manifest.date}) → ${DIRECTUS_URL}`)
    log(
      `Collections : ${Object.keys(manifest.collections).length}, fichiers : ${manifest.files?.count ?? 0}`
    )
    log('Relancer avec --yes pour exécuter.')
    return
  }
  const health = await fetch(`${DIRECTUS_URL}/server/health`)
  if (!health.ok) throw new Error(`Cible injoignable : ${DIRECTUS_URL} (${health.status})`)
  token = await authenticate()
  log(`Restore → ${DIRECTUS_URL}`)
  await applySchema()
  await restoreFiles(manifest)
  await restoreData()
  log('Restore terminé.')
}

restore().catch((err) => {
  logError(`Restore impossible : ${err.message}`)
  process.exitCode = 1
})
