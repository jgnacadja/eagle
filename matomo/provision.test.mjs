import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { dimensions, goals, privacy, site } from './config.mjs'
import { planDimension, planGoal, planSite, provision } from './provision.mjs'

const fakeApi = (responses = {}) => {
  const calls = []
  const api = async (method, params = {}) => {
    calls.push({ method, params })
    const handler = responses[method]
    return typeof handler === 'function' ? handler(params, calls) : (handler ?? null)
  }
  return { api, calls }
}

describe('planSite', () => {
  it('crée le site absent, ignore le site conforme, met à jour le divergent', () => {
    assert.equal(planSite(null).action, 'create')
    assert.equal(
      planSite({
        name: site.name,
        timezone: site.timezone,
        ecommerce: '0',
        urls: site.urls
      }).action,
      'skip'
    )
    assert.equal(
      planSite({ name: 'Ancien', timezone: site.timezone, ecommerce: '0', urls: site.urls }).action,
      'update'
    )
    assert.equal(
      planSite({ name: site.name, timezone: 'UTC', ecommerce: '0', urls: site.urls }).action,
      'update'
    )
  })

  it('tolère `urls` renvoyé en chaîne par getSiteFromId', () => {
    assert.equal(
      planSite({
        name: site.name,
        timezone: site.timezone,
        ecommerce: '0',
        urls: site.urls[0]
      }).action,
      'update'
    )
  })
})

describe('planDimension', () => {
  const defs = dimensions[0]

  it('crée la dimension absente, ignore celle du même nom et même scope', () => {
    assert.equal(planDimension([], defs).action, 'create')
    assert.equal(
      planDimension([{ name: 'Gabarit', scope: 'action', iddimension: '3', index: '1' }], defs)
        .action,
      'skip'
    )
    // même nom mais autre scope → création (Gabarit action ≠ Gabarit visite)
    assert.equal(
      planDimension([{ name: 'Gabarit', scope: 'visit', iddimension: '9' }], defs).action,
      'create'
    )
  })

  it('recrée une dimension désactivée', () => {
    assert.equal(
      planDimension([{ name: 'Gabarit', scope: 'action', active: '0' }], defs).action,
      'create'
    )
  })
})

describe('planGoal', () => {
  const def = goals.find((g) => g.key === 'devis')

  it('crée l’objectif absent', () => {
    assert.equal(planGoal([], def).action, 'create')
  })

  it('ignore l’objectif identique (idempotence)', () => {
    const existing = {
      name: 'Demande de devis',
      match_attribute: 'url',
      pattern: '/confirmation/devis',
      pattern_type: 'contains',
      idgoal: '4'
    }
    assert.deepEqual(planGoal([existing], def), { action: 'skip', idgoal: '4' })
  })

  it('met à jour un objectif dont le déclencheur a changé', () => {
    const existing = {
      name: 'Demande de devis',
      match_attribute: 'url',
      pattern: '/ancienne-url',
      pattern_type: 'contains',
      idgoal: '4'
    }
    assert.deepEqual(planGoal([existing], def), { action: 'update', idgoal: '4' })
  })

  it('compare match_attribute pour les objectifs événement', () => {
    const tel = goals.find((g) => g.key === 'tel')
    const wrongAttr = {
      name: 'Clic téléphone',
      match_attribute: 'event',
      pattern: '^click_phone$',
      pattern_type: 'regex',
      idgoal: '7'
    }
    assert.equal(planGoal([wrongAttr], tel).action, 'update')
    assert.equal(planGoal([{ ...wrongAttr, match_attribute: 'event_action' }], tel).action, 'skip')
  })
})

describe('config', () => {
  it('déclare les 6 dimensions ST-32 avec les portées du ticket', () => {
    assert.equal(dimensions.length, 6)
    const scopes = Object.fromEntries(dimensions.map((d) => [d.key, d.scope]))
    assert.equal(scopes.gabarit, 'action')
    assert.equal(scopes.famille, 'action')
    assert.equal(scopes.departement, 'action')
    assert.equal(scopes.source, 'action')
    assert.equal(scopes.landingSeo, 'visit')
    assert.equal(scopes.cluster, 'visit')
  })

  it('déclare les 7 objectifs ST-32 sans doublon de nom', () => {
    assert.equal(goals.length, 7)
    assert.equal(new Set(goals.map((g) => g.name)).size, 7)
  })

  it('chaque objectif URL pointe une confirmation ST-30 connue', () => {
    const urlGoals = goals.filter((g) => g.matchAttribute === 'url')
    for (const g of urlGoals) {
      assert.match(g.pattern, /^\/confirmation\/(devis|rendez-vous|inscription|candidature)/, g.key)
    }
  })
})

describe('provision', () => {
  it('instance vierge : crée site, dimensions, objectifs, applique la vie privée', async () => {
    const { api, calls } = fakeApi({
      'SitesManager.getSiteFromId': () => {
        throw new Error('not found')
      },
      'SitesManager.addSite': () => 1,
      'CustomDimensions.getConfiguredCustomDimensions': () => [],
      'Goals.getGoals': () => []
    })
    await provision(api)

    const methods = calls.map((c) => c.method)
    assert.ok(methods.includes('SitesManager.addSite'))
    assert.equal(
      methods.filter((m) => m === 'CustomDimensions.configureNewCustomDimension').length,
      6
    )
    assert.equal(methods.filter((m) => m === 'Goals.addGoal').length, 7)
    assert.ok(methods.includes('PrivacyManager.setAnonymizeIpSettings'))

    const privacyCall = calls.find((c) => c.method === 'PrivacyManager.setAnonymizeIpSettings')
    assert.deepEqual(privacyCall.params, privacy)

    // Objectif événement : match_attribute `event_action` ; URL : `url`.
    const addGoalCalls = calls.filter((c) => c.method === 'Goals.addGoal')
    const urlGoal = addGoalCalls.find((c) => c.params.pattern === '/confirmation/devis')
    assert.equal(urlGoal.params.matchAttribute, 'url')
    const telGoal = addGoalCalls.find((c) => c.params.pattern === '^click_phone$')
    assert.equal(telGoal.params.matchAttribute, 'event_action')
  })

  it('instance déjà conforme : aucune écriture hors vie privée', async () => {
    const { api, calls } = fakeApi({
      'SitesManager.getSiteFromId': () => ({
        name: site.name,
        timezone: site.timezone,
        ecommerce: '0',
        urls: site.urls
      }),
      'CustomDimensions.getConfiguredCustomDimensions': () =>
        dimensions.map((d, i) => ({
          name: d.name,
          scope: d.scope,
          iddimension: String(i + 1),
          index: String(i + 1),
          active: '1'
        })),
      'Goals.getGoals': () =>
        goals.map((g, i) => ({
          name: g.name,
          match_attribute: g.matchAttribute,
          pattern: g.pattern,
          pattern_type: g.patternType,
          idgoal: String(i + 1)
        }))
    })
    await provision(api)
    const writes = calls.filter(
      (c) =>
        /^(SitesManager\.addSite|SitesManager\.updateSite|CustomDimensions\.configure|Goals\.)/.test(
          c.method
        ) && !/getGoals|getConfigured|getSiteFromId/.test(c.method)
    )
    assert.deepEqual(writes, [])
  })

  it('échoue si le site créé reçoit un idSite ≠ SITE_ID', async () => {
    const { api, calls } = fakeApi({
      'SitesManager.getSiteFromId': () => {
        throw new Error('not found')
      },
      'SitesManager.addSite': () => 2
    })
    await assert.rejects(() => provision(api), /idSite=2/)
    assert.equal(
      calls.filter((c) => c.method.startsWith('CustomDimensions.')).length,
      0
    )
  })
})
