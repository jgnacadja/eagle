#!/usr/bin/env node
// Index que l'API Directus ne sait pas déclarer (composites / partiels).
// Exécuté APRÈS build.mjs (les colonnes `formations.source` et
// `sources.is_hq` doivent exister) — voir l'entrypoint de `directus-init`.
// Idempotent : sûr à relancer.
//
//   up   : unique (source, digiforma_id) à la place de l'unique digiforma_id,
//          et au plus une source HQ.
//   down : rétablit l'unique digiforma_id (échoue s'il existe des doublons
//          entre sources — à nettoyer avant).
//
// `up` / `down` reçoivent une instance knex : Directus en embarque une, que
// ce script charge depuis l'image (voir `loadKnex`). Il ne tourne donc que
// dans le conteneur `directus-init` — `pnpm directus:indexes [up|down]` l'y
// lance, y compris pour le retour arrière.

import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { log, logError } from '../logger.mjs'

export const COMPOSITE_INDEX = 'formations_source_digiforma_id_unique'
export const LEGACY_UNIQUE = 'formations_digiforma_id_unique'
export const SINGLE_HQ_INDEX = 'sources_single_hq'

export async function up(knex) {
  await knex.raw(`CREATE UNIQUE INDEX IF NOT EXISTS ?? ON formations (source, digiforma_id)`, [
    COMPOSITE_INDEX
  ])
  // L'unique historique est une contrainte (le DDL knex d'`is_unique`) :
  // Postgres refuse de supprimer l'index qui la porte tant qu'elle existe.
  // La contrainte part donc d'abord (avec son index), puis un éventuel index
  // nu du même nom.
  await knex.raw(`ALTER TABLE formations DROP CONSTRAINT IF EXISTS ??`, [LEGACY_UNIQUE])
  await knex.raw(`DROP INDEX IF EXISTS ??`, [LEGACY_UNIQUE])
  await knex.raw(`CREATE UNIQUE INDEX IF NOT EXISTS ?? ON sources (is_hq) WHERE is_hq`, [
    SINGLE_HQ_INDEX
  ])
}

export async function down(knex) {
  await knex.raw(`DROP INDEX IF EXISTS ??`, [SINGLE_HQ_INDEX])
  await knex.raw(`DROP INDEX IF EXISTS ??`, [COMPOSITE_INDEX])
  await knex.raw(`CREATE UNIQUE INDEX IF NOT EXISTS ?? ON formations (digiforma_id)`, [
    LEGACY_UNIQUE
  ])
}

// knex vit dans node_modules de l'image Directus (/directus), pas à côté de
// ce script monté en lecture seule.
function loadKnex() {
  const require = createRequire('/directus/package.json')
  const knex = require('knex')
  return (knex.default ?? knex)({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 5432),
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    }
  })
}

async function main() {
  const direction = process.argv[2] ?? 'up'
  if (direction !== 'up' && direction !== 'down') {
    throw new Error(`Direction inconnue « ${direction} » (up | down)`)
  }
  const knex = loadKnex()
  try {
    await (direction === 'up' ? up(knex) : down(knex))
    log(`✔  index sources/formations (${direction})`)
  } finally {
    await knex.destroy()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main()
  } catch (error) {
    logError('Index échoués :', error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
