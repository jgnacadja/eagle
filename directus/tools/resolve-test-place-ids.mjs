#!/usr/bin/env node
// Branche des fiches Google Places EXISTANTES (avec avis) sur les centres
// pour tester la synchro des avis sans fiche LEARN UP.
//
// Usage : pnpm reviews:test-ids [-- slug="textQuery" ...]
//   Par défaut : Basic-Fit — chaîne multi-sites avec beaucoup d'avis,
//   présente à Créteil et Paris 12 comme les centres seedés.
//
// Requiert : GOOGLE_API_KEY (Places API New — palier gratuit 10k appels/mois),
// DIRECTUS_URL/DIRECTUS_ADMIN_EMAIL/DIRECTUS_ADMIN_PASSWORD (comme le seed).
// La synchro reste à déclencher ensuite : POST /admin/sync-reviews.
import { log, logError } from '../logger.mjs'

const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'http://localhost:8055'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL ?? 'admin@example.com'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
const PLACES_URL = process.env.GOOGLE_PLACES_API_URL ?? 'https://places.googleapis.com/v1'

// Centres seedés → requêtes Text Search (fiches tierces à avis, remplacées
// par les vrais place_id LEARN UP à l'activation).
const DEFAULT_QUERIES = {
  creteil: 'Basic-Fit Créteil',
  paris: 'Basic-Fit Paris Daumesnil'
}

function parseQueries(argv) {
  const overrides = Object.fromEntries(
    argv
      .filter((arg) => arg.includes('='))
      .map((arg) => {
        const [slug, ...rest] = arg.split('=')
        return [slug.trim(), rest.join('=').replaceAll('"', '').trim()]
      })
  )
  return { ...DEFAULT_QUERIES, ...overrides }
}

async function authenticate() {
  if (!ADMIN_PASSWORD) throw new Error('DIRECTUS_ADMIN_PASSWORD manquant (voir .env.example)')
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  })
  if (!res.ok) throw new Error(`Authentification Directus échouée (${res.status})`)
  const { data } = await res.json()
  return data.access_token
}

// Résout le place_id + l'URL Maps d'une fiche via Text Search — le premier
// résultat est loggé pour contrôle (displayName + adresse).
async function resolvePlace(query) {
  const res = await fetch(`${PLACES_URL}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri'
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'fr', pageSize: 1 })
  })
  if (!res.ok) {
    throw new Error(`Places searchText "${query}" → HTTP ${res.status} : ${await res.text()}`)
  }
  const { places } = await res.json()
  return places?.[0] ?? null
}

async function patchCentre(token, slug, place) {
  const find = await fetch(
    `${DIRECTUS_URL}/items/centres?filter[slug][_eq]=${encodeURIComponent(slug)}&fields[]=id&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!find.ok) throw new Error(`Lecture du centre "${slug}" échouée (${find.status})`)
  const { data } = await find.json()
  const centre = data?.[0]
  if (!centre) throw new Error(`Centre "${slug}" introuvable — seed d'abord (pnpm seed)`)

  const patch = await fetch(`${DIRECTUS_URL}/items/centres/${centre.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      google_place_id: place.id,
      google_maps_url: place.googleMapsUri ?? null
    })
  })
  if (!patch.ok) throw new Error(`PATCH centre "${slug}" échoué (${patch.status})`)
}

async function main() {
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY manquante — créer un projet Google Cloud + Places API (New)')
  }
  const token = await authenticate()
  const queries = parseQueries(process.argv.slice(2))

  for (const [slug, query] of Object.entries(queries)) {
    const place = await resolvePlace(query)
    if (!place) {
      log(`✗ ${slug} ← "${query}" : aucun résultat — ajuster la requête`)
      continue
    }
    await patchCentre(token, slug, place)
    log(
      `✓ ${slug} ← ${place.displayName?.text ?? place.id} (${place.formattedAddress}) ` +
      `— note ${place.rating ?? '?'} / ${place.userRatingCount ?? '?'} avis`
    )
  }

  log('Ensuite : curl -X POST <API>/admin/sync-reviews -H "x-api-key: $ADMIN_API_KEY"')
}

main().catch((error) => {
  logError('resolve-test-place-ids', error)
  process.exitCode = 1
})
