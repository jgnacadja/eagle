#!/usr/bin/env node
// Seed idempotent des données de démonstration LEARN UP ACADEMY.
// Usage : node directus/seed/seed.mjs (après `docker compose up`).
//
// Les collections ciblées (centres, familles_formation, articles) sont
// modélisées en ST-11. Tant qu'une collection n'existe pas encore, ce script
// la saute proprement (log + skip) plutôt que d'échouer — il devient
// pleinement actif une fois ST-11 livré, sans changement requis.

import { articles, centres, famillesFormation, formations, sousFamillesFormation } from './data.mjs'
import { log, logError } from '../logger.mjs'

const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'http://localhost:8055'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL ?? 'admin@example.com'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD

const DATASETS = [
  { collection: 'centres', items: centres },
  { collection: 'familles_formation', items: famillesFormation },
  {
    collection: 'sous_familles_formation',
    items: sousFamillesFormation,
    // Chaque item porte `familleSlug` : résolu en id de familles_formation
    // (collection seedée juste avant) avant l'upsert.
    refs: [{ key: 'familleSlug', collection: 'familles_formation', field: 'famille' }]
  },
  { collection: 'articles', items: articles },
  {
    collection: 'formations',
    items: formations,
    refs: [
      { key: 'familleSlug', collection: 'familles_formation', field: 'famille' },
      { key: 'sousFamilleSlug', collection: 'sous_familles_formation', field: 'sous_famille' }
    ]
  }
]

async function waitForDirectus(timeoutMs = 30_000, intervalMs = 2_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${DIRECTUS_URL}/server/health`)
      if (res.ok) return
    } catch {
      // Directus pas encore prêt — on retente jusqu'au timeout.
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  throw new Error(`Directus injoignable sur ${DIRECTUS_URL} après ${timeoutMs}ms`)
}

async function authenticate() {
  if (!ADMIN_PASSWORD) {
    throw new Error('DIRECTUS_ADMIN_PASSWORD manquant (voir .env.example)')
  }
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  })
  if (!res.ok) {
    throw new Error(`Authentification Directus échouée (${res.status})`)
  }
  const { data } = await res.json()
  return data.access_token
}

async function collectionExists(token, collection) {
  const res = await fetch(`${DIRECTUS_URL}/collections/${collection}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.ok
}

// Deux pièges observés empiriquement sur cette version de Directus, tous les
// deux évités ici :
// - `filter[slug][_eq]=x&limit=1` juste après une écriture peut renvoyer un
//   résultat vide alors que l'item existe (répétable, cause exacte non
//   identifiée côté Directus)
// - combiner `limit=-1` avec `fields=...` (restriction de champs) renvoie
//   systématiquement un tableau vide, alors que chacun fonctionne seul
// Charger la collection complète (`limit=-1`, pas de `fields`) une seule
// fois et comparer en mémoire contourne les deux, et reste largement assez
// efficace pour des jeux de données de démo.
async function fetchExistingBySlug(token, collection) {
  const url = new URL(`${DIRECTUS_URL}/items/${collection}`)
  url.searchParams.set('limit', '-1')
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Lecture ${collection} échouée (${res.status})`)
  const { data } = await res.json()
  return new Map(data.map((row) => [row.slug, row.id]))
}

// Les champs `imageUrl` de data.mjs ne sont pas des champs de collection :
// le seed importe le fichier dans directus_files (endpoint /files/import)
// et renseigne le champ `image` avec l'id retourné. Idempotent : le fichier
// est retrouvé par `filename_download` avant réimport.
async function ensureFile(token, url, filename) {
  const lookup = await fetch(
    `${DIRECTUS_URL}/files?filter[filename_download][_eq]=${encodeURIComponent(filename)}&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (lookup.ok) {
    const { data } = await lookup.json()
    if (data[0]?.id) return data[0].id
  }
  const res = await fetch(`${DIRECTUS_URL}/files/import`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url, data: { title: filename, filename_download: filename } })
  })
  if (!res.ok) throw new Error(`Import du fichier ${filename} échoué (${res.status})`)
  const { data } = await res.json()
  return data.id
}

async function upsertItem(token, collection, item, existingId) {
  const url = existingId
    ? `${DIRECTUS_URL}/items/${collection}/${existingId}`
    : `${DIRECTUS_URL}/items/${collection}`

  const res = await fetch(url, {
    method: existingId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  })
  if (!res.ok) {
    throw new Error(`Upsert ${collection}/${item.slug} échoué (${res.status})`)
  }
  return existingId ? 'updated' : 'created'
}

// Résout les clés `*Slug` en ids de leurs collections cibles. Retourne
// `null` si une ref est manquante — l'item doit être ignoré.
function resolveRefs(item, refs, refsBySlug, collection) {
  for (const ref of refs ?? []) {
    if (item[ref.key] === undefined) continue
    const refId = refsBySlug.get(ref.collection).get(item[ref.key])
    if (refId === undefined) {
      log(`⏭  ${collection}/${item.slug} — ${ref.collection}/${item[ref.key]} absent, ignoré`)
      return null
    }
    item[ref.field] = refId
    delete item[ref.key]
  }
  return item
}

const FILE_FIELDS = [
  { key: 'imageUrl', field: 'image', suffix: '' },
  { key: 'author_imageUrl', field: 'author_image', suffix: '-author' },
  { key: 'cover_imageUrl', field: 'cover_image', suffix: '-cover' }
]

async function prepareItem(token, rawItem, refs, refsBySlug, collection) {
  const fileKeys = new Set(FILE_FIELDS.map(({ key }) => key))
  const item = Object.fromEntries(Object.entries(rawItem).filter(([key]) => !fileKeys.has(key)))

  if (!resolveRefs(item, refs, refsBySlug, collection)) return null

  for (const { key, field, suffix } of FILE_FIELDS) {
    const url = rawItem[key]
    if (url) {
      item[field] = await ensureFile(token, url, `seed-${collection}-${item.slug}${suffix}.jpg`)
    }
  }
  return item
}

async function seedDataset(token, { collection, items, refs }) {
  if (!(await collectionExists(token, collection))) {
    log(`⏭  ${collection} — collection absente (ST-11 non livré), ignoré`)
    return
  }

  const existingBySlug = await fetchExistingBySlug(token, collection)
  const refsBySlug = new Map()
  for (const ref of refs ?? []) {
    if (!refsBySlug.has(ref.collection)) {
      refsBySlug.set(ref.collection, await fetchExistingBySlug(token, ref.collection))
    }
  }
  const results = { created: 0, updated: 0 }
  for (const rawItem of items) {
    const item = await prepareItem(token, rawItem, refs, refsBySlug, collection)
    if (!item) continue

    const outcome = await upsertItem(token, collection, item, existingBySlug.get(item.slug))
    results[outcome] += 1
  }
  log(`✔  ${collection} — ${results.created} créés, ${results.updated} mis à jour`)
}

async function main() {
  log(`Connexion à Directus (${DIRECTUS_URL})…`)
  await waitForDirectus()
  const token = await authenticate()

  for (const dataset of DATASETS) {
    await seedDataset(token, dataset)
  }

  log('Seed terminé.')
}

try {
  await main()
} catch (error) {
  logError('Seed échoué :', error.message)
  process.exitCode = 1
}
