import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { permissionsFor, publicPermissions } from './roles.mjs'
import { collections, relations } from './collections.mjs'
import { buildHqSource, planHqSource } from './sources.mjs'
import { buildFlows } from './flows.mjs'
import { COMPOSITE_INDEX, down, LEGACY_UNIQUE, SINGLE_HQ_INDEX, up } from './indexes.mjs'

const SECRET_FIELDS = ['digiforma_api_key', 'hubspot_token']

const fakeKnex = () => {
  const calls = []
  return { calls, raw: async (sql, bindings) => calls.push({ sql, bindings }) }
}

describe('buildHqSource', () => {
  it('reprend portail, URL et GUIDs de l’env, sans la clé API', () => {
    const hq = buildHqSource({
      DIGIFORMA_API_URL: ' https://digi.example/graphql ',
      DIGIFORMA_API_KEY: 'secret',
      HUBSPOT_PORTAL_ID: '123',
      HUBSPOT_FORM_NEWSLETTER: 'g-news',
      HUBSPOT_FORM_DEMANDE: 'g-dem',
      HUBSPOT_FORM_RAPPEL: ''
    })
    assert.equal(hq.code, 'hq')
    assert.equal(hq.is_hq, true)
    assert.equal(hq.status, 'active')
    assert.equal(hq.digiforma_api_url, 'https://digi.example/graphql')
    assert.equal(hq.hubspot_portal_id, '123')
    assert.equal(hq.hubspot_form_newsletter, 'g-news')
    assert.equal(hq.hubspot_form_demande, 'g-dem')
    assert.equal(hq.hubspot_form_rappel, null)
    assert.equal(hq.hubspot_form_candidature, null)
    assert.ok(!('digiforma_api_key' in hq))
    assert.ok(!JSON.stringify(hq).includes('secret'))
  })

  it('accepte un env vide (repli côté API)', () => {
    const hq = buildHqSource({})
    assert.equal(hq.digiforma_api_url, null)
    assert.equal(hq.hubspot_portal_id, null)
  })
})

describe('planHqSource', () => {
  it('crée la HQ quand aucune source n’existe', () => {
    assert.deepEqual(planHqSource([]), { action: 'create' })
    assert.deepEqual(planHqSource([{ id: 'a', code: 'lyon', is_hq: false }]), {
      action: 'create'
    })
  })

  it('réutilise la HQ existante (idempotence)', () => {
    assert.deepEqual(planHqSource([{ id: 'x', code: 'hq', is_hq: true }]), {
      action: 'reuse',
      id: 'x'
    })
  })

  it('refuse deux HQ', () => {
    assert.throws(
      () =>
        planHqSource([
          { id: 'a', code: 'hq', is_hq: true },
          { id: 'b', code: 'bis', is_hq: true }
        ]),
      /Plusieurs sources HQ/
    )
  })
})

describe('index SQL', () => {
  it('up : composite + HQ unique, retrait de l’unique historique', async () => {
    const knex = fakeKnex()
    await up(knex)
    const sql = knex.calls.map((c) => c.sql).join('\n')
    assert.match(
      sql,
      /CREATE UNIQUE INDEX IF NOT EXISTS \?\? ON formations \(source, digiforma_id\)/
    )
    assert.match(sql, /ON sources \(is_hq\) WHERE is_hq/)
    assert.match(sql, /DROP CONSTRAINT IF EXISTS/)
    const names = knex.calls.flatMap((c) => c.bindings)
    assert.ok(names.includes(COMPOSITE_INDEX) && names.includes(SINGLE_HQ_INDEX))
    assert.ok(names.includes(LEGACY_UNIQUE))
    // L'unique historique est retiré après la création du composite.
    assert.ok(sql.indexOf('(source, digiforma_id)') < sql.indexOf('DROP INDEX'))
  })

  it('up : la contrainte historique est supprimée avant son index', async () => {
    // knex émet l'unique de `digiforma_id` comme une contrainte, et Postgres
    // refuse de supprimer l'index qui la porte (« constraint … requires it »).
    const knex = fakeKnex()
    await up(knex)
    const statements = knex.calls.map((c) => c.sql)
    const dropConstraint = statements.findIndex((s) => /DROP CONSTRAINT IF EXISTS/.test(s))
    const dropIndex = statements.findIndex((s) => /DROP INDEX IF EXISTS/.test(s))
    assert.ok(dropConstraint >= 0 && dropIndex >= 0)
    assert.ok(dropConstraint < dropIndex)
    assert.deepEqual(knex.calls[dropConstraint].bindings, [LEGACY_UNIQUE])
    assert.deepEqual(knex.calls[dropIndex].bindings, [LEGACY_UNIQUE])
  })

  it('down : rétablit l’unique digiforma_id', async () => {
    const knex = fakeKnex()
    await down(knex)
    const sql = knex.calls.map((c) => c.sql).join('\n')
    assert.match(sql, /ON formations \(digiforma_id\)/)
    assert.match(sql, /DROP INDEX IF EXISTS/)
    assert.ok(knex.calls.flatMap((c) => c.bindings).includes(LEGACY_UNIQUE))
  })
})

describe('schéma sources', () => {
  const sources = collections.find((c) => c.collection === 'sources')
  const field = (name) => sources.fields.find((f) => f.field === name)

  it('déclare les champs du ticket', () => {
    for (const name of [
      'id',
      'name',
      'code',
      'is_hq',
      'status',
      'digiforma_api_url',
      'digiforma_api_key',
      'hubspot_portal_id',
      'hubspot_form_newsletter',
      'hubspot_form_demande',
      'hubspot_form_candidature',
      'hubspot_form_conseiller',
      'hubspot_form_rappel',
      'hubspot_token',
      'last_sync_at',
      'last_sync_status'
    ]) {
      assert.ok(field(name), `champ ${name} manquant`)
    }
    assert.equal(field('id').type, 'uuid')
    assert.equal(field('code').schema.is_unique, true)
    assert.equal(field('status').schema.default_value, 'active')
    assert.equal(field('last_sync_at').meta.readonly, true)
    assert.equal(field('last_sync_status').meta.readonly, true)
  })

  it('affiche les secrets masqués, saisissables par l’administrateur', () => {
    // `hidden` retire le champ du formulaire : impossible alors de saisir une
    // clé dans l'admin. Le champ reste visible mais masqué (type mot de passe) ;
    // la lecture est réservée à l'admin par les permissions ci-dessous.
    for (const name of SECRET_FIELDS) {
      assert.notEqual(field(name).meta.hidden, true, name)
      assert.equal(field(name).meta.interface, 'input', name)
      assert.equal(field(name).meta.options?.masked, true, name)
    }
  })

  it('relie centres et formations à sources, et retire l’unique simple', () => {
    const rel = (collection) =>
      relations.find((r) => r.collection === collection && r.field === 'source')
    assert.equal(rel('centres')?.related_collection, 'sources')
    assert.equal(rel('formations')?.related_collection, 'sources')
    const formations = collections.find((c) => c.collection === 'formations')
    const digiformaId = formations.fields.find((f) => f.field === 'digiforma_id')
    assert.ok(!digiformaId.schema?.is_unique)
    const archived = formations.fields.find((f) => f.field === 'archived_by_source')
    assert.equal(archived.schema.default_value, false)
  })
})

describe('permissions sources', () => {
  const rule = (role) => permissionsFor(role).filter((p) => p.collection === 'sources')

  it('admin : accès complet', () => {
    assert.deepEqual(
      rule('admin')
        .map((p) => p.action)
        .sort(),
      ['create', 'delete', 'read', 'update']
    )
    assert.ok(rule('admin').every((p) => !p.fields))
  })

  it('lecteur / éditeur / modérateur : lecture hors secrets uniquement', () => {
    for (const role of ['lecteur', 'editeur', 'moderateur']) {
      const rules = rule(role)
      assert.equal(rules.length, 1, role)
      assert.equal(rules[0].action, 'read')
      assert.ok(Array.isArray(rules[0].fields), `${role} doit lister ses champs`)
      for (const secret of SECRET_FIELDS) assert.ok(!rules[0].fields.includes(secret), role)
    }
  })

  it('public : aucune lecture de sources ni de formations.source', () => {
    const publics = publicPermissions()
    assert.ok(!publics.some((p) => p.collection === 'sources'))
    const formations = publics.find((p) => p.collection === 'formations')
    assert.ok(!formations.fields.includes('source'))
    assert.ok(!formations.fields.includes('archived_by_source'))
  })
})

describe('flows d’invalidation', () => {
  const flowNamed = (flows, name) => flows.find((f) => f.name === name)

  it('une écriture sur sources purge la config côté API, sans purge front', () => {
    const flow = flowNamed(buildFlows({ syncUserId: 'sync-user' }), 'Invalidate sources config')
    assert.ok(flow, 'flow manquant')
    assert.deepEqual(flow.options.collections, ['sources'])
    assert.deepEqual(flow.options.scope, ['items.create', 'items.update', 'items.delete'])
    const requests = flow.operations.filter((op) => op.type === 'request')
    assert.equal(requests.length, 1)
    assert.match(requests[0].options.url, /\/admin\/cache\/invalidate$/)
    assert.equal(requests[0].options.body, '{"collection":"sources"}')
    assert.ok(requests[0].options.headers.some((h) => h.header === 'x-api-key'))
  })

  it('ignore les écritures de la sync (last_sync_* à chaque run)', () => {
    const flow = flowNamed(buildFlows({ syncUserId: 'sync-user' }), 'Invalidate sources config')
    assert.equal(flow.operations[0].type, 'condition')
    assert.deepEqual(flow.operations[0].options.filter, {
      $accountability: { user: { _neq: 'sync-user' } }
    })
  })

  it('sources n’alimente pas le flow de contenu (ISR front)', () => {
    const content = flowNamed(buildFlows(), 'Invalidate site cache')
    assert.ok(!content.options.collections.includes('sources'))
  })
})
