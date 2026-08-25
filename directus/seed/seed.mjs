#!/usr/bin/env node
// Seed idempotent des données de démonstration LEARN UP ACADEMY.
// Usage : node directus/seed/seed.mjs (après `docker compose up`).
//
// Les collections ciblées (centres, familles_formation, articles) sont
// modélisées en ST-11. Tant qu'une collection n'existe pas encore, ce script
// la saute proprement (log + skip) plutôt que d'échouer — il devient
// pleinement actif une fois ST-11 livré, sans changement requis.

import { articles, centres, famillesFormation } from './data.mjs'
import { log, logError } from '../logger.mjs'

const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'http://localhost:8055'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL ?? 'admin@example.com'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD

const DATASETS = [
  { collection: 'centres', items: centres },
  { collection: 'familles_formation', items: famillesFormation },
  { collection: 'articles', items: articles }
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

async function seedDataset(token, { collection, items }) {
  if (!(await collectionExists(token, collection))) {
    log(`⏭  ${collection} — collection absente (ST-11 non livré), ignoré`)
    return
  }

  const existingBySlug = await fetchExistingBySlug(token, collection)
  const results = { created: 0, updated: 0 }
  for (const item of items) {
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

main().catch((error) => {
  logError('Seed échoué :', error.message)
  process.exitCode = 1
})
