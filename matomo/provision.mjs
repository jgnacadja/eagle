#!/usr/bin/env node
// Provisioning idempotent de l'instance Matomo (ST-32) : site, dimensions
// personnalisées, objectifs, réglages vie privée. Équivalent de
// directus/schema/build.mjs — config.mjs est la source de vérité.
//
// Usage : pnpm matomo:provision
// Requis : MATOMO_TOKEN_AUTH (token admin « secure only », jamais commité —
// .env local / secret CI). MATOMO_URL sinon http://localhost:${MATOMO_PORT:-8080}.
//
// Le token doit être envoyé en POST (les tokens « secure only » refusent le
// query string) — toutes les requêtes de ce script passent par api().

import { dimensions, goals, privacy, site, SITE_ID } from './config.mjs'
import { log, logError } from '../directus/logger.mjs'

const MATOMO_URL = (
  process.env.MATOMO_URL ?? `http://localhost:${process.env.MATOMO_PORT ?? '8080'}`
).replace(/\/+$/, '')

/**
 * Appel API Matomo (`module=API`). `params` part en POST form-urlencoded,
 * token inclus — jamais en GET.
 */
export function createApi(baseUrl, token) {
  return async function api(method, params = {}) {
    const body = new URLSearchParams()
    body.set('token_auth', token)
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        for (const item of value) body.append(`${key}[]`, String(item))
      } else {
        body.set(key, String(value))
      }
    }
    const res = await fetch(`${baseUrl}/index.php?module=API&method=${method}&format=json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })
    if (!res.ok) throw new Error(`${method} : HTTP ${res.status}`)
    const data = await res.json()
    if (data && data.result === 'error') {
      throw new Error(`${method} : ${data.message ?? 'erreur Matomo'}`)
    }
    return data
  }
}

/**
 * Diff du site : 'create' si absent, 'update' si un champ déclaré diffère,
 * 'skip' sinon. `current` est la ligne SitesManager.getSiteFromId.
 */
export function planSite(current) {
  if (!current) return { action: 'create' }
  const currentUrls = (current.urls ?? []).map(String).sort()
  const wanted = [...site.urls].sort()
  if (
    current.name !== site.name ||
    current.timezone !== site.timezone ||
    Number(current.ecommerce) !== site.ecommerce ||
    JSON.stringify(currentUrls) !== JSON.stringify(wanted)
  ) {
    return { action: 'update' }
  }
  return { action: 'skip' }
}

/** Une dimension existe si une config du même scope porte ce nom. */
export function planDimension(existing, def) {
  const found = existing.find(
    (d) => d.name === def.name && d.scope === def.scope && d.active !== '0' && d.active !== false
  )
  return found
    ? { action: 'skip', iddimension: found.iddimension, index: found.index }
    : { action: 'create' }
}

/**
 * Diff d'un objectif : 'create' si aucun objectif du même nom, 'update' si
 * le déclencheur diffère, 'skip' sinon.
 */
export function planGoal(existing, def) {
  const found = existing.find((g) => g.name === def.name)
  if (!found) return { action: 'create' }
  const sameTrigger =
    found.match_attribute === def.matchAttribute &&
    found.pattern === def.pattern &&
    found.pattern_type === def.patternType
  return sameTrigger
    ? { action: 'skip', idgoal: found.idgoal }
    : { action: 'update', idgoal: found.idgoal }
}

async function ensureSite(api) {
  let current = null
  try {
    current = await api('SitesManager.getSiteFromId', { idSite: SITE_ID })
  } catch {
    current = null
  }
  const plan = planSite(current)
  if (plan.action === 'create') {
    await api('SitesManager.addSite', {
      siteName: site.name,
      timezone: site.timezone,
      ecommerce: site.ecommerce,
      urls: site.urls
    })
    log(`+ site « ${site.name} » créé`)
  } else if (plan.action === 'update') {
    await api('SitesManager.updateSite', {
      idSite: SITE_ID,
      siteName: site.name,
      timezone: site.timezone,
      ecommerce: site.ecommerce,
      urls: site.urls
    })
    log(`↻ site « ${site.name} » mis à jour`)
  } else {
    log(`↷ site « ${site.name} » déjà conforme`)
  }
}

async function ensureDimensions(api) {
  const existing =
    (await api('CustomDimensions.getConfiguredCustomDimensions', {
      idSite: SITE_ID
    })) ?? []
  for (const def of dimensions) {
    const plan = planDimension(existing, def)
    if (plan.action === 'skip') {
      log(`↷ dimension « ${def.name} » (${def.scope}) déjà présente`)
      continue
    }
    await api('CustomDimensions.configureNewCustomDimension', {
      idSite: SITE_ID,
      name: def.name,
      scope: def.scope,
      active: 1,
      caseSensitive: 0
    })
    log(`+ dimension « ${def.name} » (${def.scope}) créée`)
  }
}

async function ensureGoals(api) {
  const existing = (await api('Goals.getGoals', { idSite: SITE_ID })) ?? []
  for (const def of goals) {
    const plan = planGoal(existing, def)
    if (plan.action === 'skip') {
      log(`↷ objectif « ${def.name} » déjà présent`)
      continue
    }
    const params = {
      idSite: SITE_ID,
      name: def.name,
      matchAttribute: def.matchAttribute,
      pattern: def.pattern,
      patternType: def.patternType,
      caseSensitive: 0,
      allowMultipleConversionsPerVisit: 0
    }
    if (plan.action === 'create') {
      await api('Goals.addGoal', params)
      log(`+ objectif « ${def.name} » créé (${def.matchAttribute} ${def.pattern})`)
    } else {
      await api('Goals.updateGoal', { ...params, idGoal: plan.idgoal })
      log(`↻ objectif « ${def.name} » mis à jour`)
    }
  }
}

async function ensurePrivacy(api) {
  await api('PrivacyManager.setAnonymizeIpSettings', privacy)
  log('↻ anonymisation IP appliquée (masque /' + 8 * privacy.ipAddressMaskLength + ')')
}

export async function provision(api) {
  await ensureSite(api)
  await ensureDimensions(api)
  await ensureGoals(api)
  await ensurePrivacy(api)
}

async function main() {
  const token = process.env.MATOMO_TOKEN_AUTH
  if (!token) {
    logError(
      'MATOMO_TOKEN_AUTH manquant — créer un token dans Matomo (Personnel → Sécurité) et le poser dans .env'
    )
    process.exit(1)
  }
  const api = createApi(MATOMO_URL, token)
  await provision(api)
  log(`✔ provisioning terminé sur ${MATOMO_URL}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    logError(err.message)
    process.exit(1)
  })
}
