#!/usr/bin/env node
// Sauvegarde complète d'une instance Directus : schéma, données, fichiers.
// Usage : pnpm directus:backup (lit .env via --env-file).
//
// Cible résolue dans l'ordre : DIRECTUS_BACKUP_URL > NUXT_PUBLIC_DIRECTUS_URL
// > DIRECTUS_URL > http://localhost:8055. Token : DIRECTUS_BACKUP_TOKEN >
// DIRECTUS_MCP_TOKEN > DIRECTUS_TOKEN, sinon login email/password admin.
//
// Sortie : backups/directus-<YYYYmmdd-THHMMSS>/ (gitignoré) contenant
//   schema.json     — /schema/snapshot (réapplicable via /schema/apply)
//   data/*.json     — items des collections métier (ids de relations inclus)
//   system/*.json   — users, roles, permissions, settings, translations…
//   files/          — binaires /assets/{id} + _files.json (métadonnées)
//   manifest.json   — url, date, compteurs par collection
//
// Journaux transitoires exclus volontairement : activity, revisions,
// sessions, notifications, migrations, deployments.

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { log, logError } from '../logger.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DIRECTUS_URL = (
  process.env.DIRECTUS_BACKUP_URL ??
  process.env.NUXT_PUBLIC_DIRECTUS_URL ??
  process.env.DIRECTUS_URL ??
  'http://localhost:8055'
).replace(/\/$/, '')
const STATIC_TOKEN =
  process.env.DIRECTUS_BACKUP_TOKEN ?? process.env.DIRECTUS_MCP_TOKEN ?? process.env.DIRECTUS_TOKEN
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD
const CONCURRENCY = 5

const SYSTEM_ENDPOINTS = [
  'users',
  'roles',
  'permissions',
  'policies',
  'access',
  'presets',
  'settings',
  'dashboards',
  'panels',
  'flows',
  'operations',
  'folders',
  'shares',
  'translations',
  'versions',
  'comments',
  'extensions'
]

let failures = 0

async function authenticate() {
  if (STATIC_TOKEN) return STATIC_TOKEN
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      'Aucun token : définir DIRECTUS_BACKUP_TOKEN/DIRECTUS_MCP_TOKEN ou admin email+password'
    )
  }
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  })
  if (!res.ok) throw new Error(`Authentification Directus échouée (${res.status})`)
  const { data } = await res.json()
  return data.access_token
}

async function api(token, path) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${path} → ${res.status} ${body.slice(0, 200)}`)
  }
  return res.json()
}

async function writeJson(file, data) {
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(data, null, 2))
}

async function download(token, path, dest) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error(`${path} → ${res.status}`)
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, Buffer.from(await res.arrayBuffer()))
}

async function backup() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const outDir = join(ROOT, 'backups', `directus-${stamp}`)
  const manifest = { url: DIRECTUS_URL, date: stamp, collections: {}, system: {}, files: {} }

  const res = await fetch(`${DIRECTUS_URL}/server/health`)
  if (!res.ok) throw new Error(`Directus injoignable sur ${DIRECTUS_URL} (${res.status})`)
  const token = await authenticate()
  log(`Backup de ${DIRECTUS_URL} → ${outDir}`)

  const snapshot = await api(token, '/schema/snapshot')
  await writeJson(join(outDir, 'schema.json'), snapshot)

  const { data: collections } = await api(token, '/collections?limit=-1')
  const userCollections = collections
    .map((c) => c.collection)
    .filter((name) => !name.startsWith('directus_'))

  for (const name of userCollections) {
    try {
      const payload = await api(token, `/items/${name}?limit=-1`)
      const rows = Array.isArray(payload.data) ? payload.data : [payload.data]
      await writeJson(join(outDir, 'data', `${name}.json`), payload.data)
      manifest.collections[name] = rows.length
      log(`  ${name}: ${rows.length}`)
    } catch (err) {
      failures++
      manifest.collections[name] = 'ERROR'
      logError(`  ${name}: échec — ${err.message}`)
    }
  }

  for (const name of SYSTEM_ENDPOINTS) {
    try {
      const payload = await api(token, `/${name}?limit=-1`)
      const rows = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : []
      await writeJson(join(outDir, 'system', `${name}.json`), payload.data)
      manifest.system[name] = rows.length
    } catch (err) {
      manifest.system[name] = 'skipped'
      logError(`  system/${name}: ignoré — ${err.message}`)
    }
  }

  try {
    const { data: files } = await api(token, '/files?limit=-1')
    await writeJson(join(outDir, 'files', '_files.json'), files)
    let bytes = 0
    let done = 0
    for (let i = 0; i < files.length; i += CONCURRENCY) {
      await Promise.all(
        files.slice(i, i + CONCURRENCY).map(async (file) => {
          const safe = String(file.filename_download ?? 'file').replaceAll('/', '_')
          const dest = join(outDir, 'files', `${file.id}-${safe}`)
          try {
            await download(token, `/assets/${file.id}`, dest)
            bytes += Number(file.filesize ?? 0)
            done++
          } catch (err) {
            failures++
            logError(`  file ${file.id}: échec — ${err.message}`)
          }
        })
      )
    }
    manifest.files = { count: done, total: files.length, bytes }
    log(`  files: ${done}/${files.length} (${Math.round(bytes / 1024)} Ko)`)
  } catch (err) {
    failures++
    logError(`  files: échec — ${err.message}`)
  }

  await writeJson(join(outDir, 'manifest.json'), manifest)
  log(`Backup terminé : ${outDir}`)
  if (failures > 0) {
    logError(`${failures} élément(s) en échec — backup partiel`)
    process.exitCode = 1
  }
}

backup().catch((err) => {
  logError(`Backup impossible : ${err.message}`)
  process.exitCode = 1
})
