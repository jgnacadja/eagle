import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import hook from './index.js'
import { applyPlan, normalizePath, planForCreate, planForUpdate, publicPath } from './redirects.js'

// ItemsService factice : lignes en mémoire, appels enregistrés pour
// vérifier create/update/delete côté `redirects`.
function fakeRedirectsService(seed = []) {
  let nextId = seed.length + 1
  const rows = seed.map((row, i) => ({ id: i + 1, ...row }))
  const match = (row, cond) =>
    Object.entries(cond ?? {}).every(([field, op]) => {
      if (field === '_and') return (op ?? []).every((sub) => match(row, sub))
      const value = row[field]
      if ('_eq' in (op ?? {})) return value === op._eq
      return true
    })
  return {
    rows,
    async readByQuery({ filter, limit }) {
      const out = rows.filter((row) => match(row, filter))
      return { data: limit === 1 ? out.slice(0, 1) : out }
    },
    async createMany(items) {
      for (const item of items) rows.push({ id: nextId++, ...item })
    },
    async updateByQuery({ filter }, payload) {
      for (const row of rows) if (match(row, filter)) Object.assign(row, payload)
    },
    async deleteByQuery({ filter }) {
      for (let i = rows.length - 1; i >= 0; i--) if (match(rows[i], filter)) rows.splice(i, 1)
    }
  }
}

describe('publicPath', () => {
  it('mappe chaque gabarit du plan d’URL', () => {
    assert.equal(publicPath('formations', 'caces', 'securite'), '/formations/securite/caces')
    assert.equal(publicPath('formations', 'caces', null), null)
    assert.equal(publicPath('familles_formation', 'securite'), '/formations/securite')
    assert.equal(publicPath('articles', 'actu-1'), '/actualites/actu-1')
    assert.equal(publicPath('centres', 'creteil'), '/centres/creteil')
    assert.equal(publicPath('pages_legales', 'mentions-legales'), '/mentions-legales')
  })
})

describe('normalizePath', () => {
  it('retire le slash final et met en minuscules', () => {
    assert.equal(normalizePath('/Formations/Gestion/'), '/formations/gestion')
    assert.equal(normalizePath('centres/creteil'), '/centres/creteil')
    assert.equal(normalizePath('/'), '/')
  })
})

describe('planForUpdate / planForCreate', () => {
  it('renomme une URL publiée, sans effet hors publication', () => {
    const before = { status: 'published', path: '/formations/a/x' }
    assert.deepEqual(planForUpdate(before, { status: 'published', path: '/formations/a/y' }), {
      type: 'rename',
      from: '/formations/a/x',
      to: '/formations/a/y'
    })
    assert.equal(
      planForUpdate({ status: 'draft', path: '/a' }, { status: 'draft', path: '/b' }),
      null
    )
  })

  it('410 à la dépublication, revive à la republication', () => {
    assert.deepEqual(
      planForUpdate({ status: 'published', path: '/a' }, { status: 'archived', path: '/a' }),
      { type: 'gone', path: '/a' }
    )
    assert.deepEqual(
      planForUpdate({ status: 'draft', path: '/a' }, { status: 'published', path: '/a' }),
      { type: 'revive', path: '/a' }
    )
    assert.deepEqual(planForCreate({ status: 'published', path: '/a' }), {
      type: 'revive',
      path: '/a'
    })
    assert.equal(planForCreate({ status: 'draft', path: '/a' }), null)
  })
})

describe('applyPlan — rename', () => {
  it('crée le 301 et reporte les cibles (pas de chaîne)', async () => {
    const svc = fakeRedirectsService([
      { from_path: '/a', to_path: '/b', status: '301', origin: 'auto' }
    ])
    await applyPlan(svc, { type: 'rename', from: '/b', to: '/c' })
    assert.deepEqual(
      svc.rows.map((r) => [r.from_path, r.to_path, r.status]),
      [
        ['/a', '/c', '301'],
        ['/b', '/c', '301']
      ]
    )
  })

  it('A→B→A ne boucle pas : la ligne inverse auto disparaît', async () => {
    const svc = fakeRedirectsService([
      { from_path: '/a', to_path: '/b', status: '301', origin: 'auto' }
    ])
    await applyPlan(svc, { type: 'rename', from: '/b', to: '/a' })
    assert.deepEqual(
      svc.rows.map((r) => [r.from_path, r.to_path]),
      [['/b', '/a']]
    )
  })

  it('une ligne manuelle sur from_path n’est jamais écrasée', async () => {
    const svc = fakeRedirectsService([
      { from_path: '/a', to_path: '/manuel', status: '301', origin: 'manual' }
    ])
    await applyPlan(svc, { type: 'rename', from: '/a', to: '/b' })
    assert.deepEqual(svc.rows[0], {
      id: 1,
      from_path: '/a',
      to_path: '/manuel',
      status: '301',
      origin: 'manual'
    })
  })

  it('supprime la ligne auto partant de la nouvelle adresse (elle redevient vivante)', async () => {
    const svc = fakeRedirectsService([
      { from_path: '/b', to_path: '/x', status: '301', origin: 'auto' }
    ])
    await applyPlan(svc, { type: 'rename', from: '/a', to: '/b' })
    assert.deepEqual(
      svc.rows.map((r) => r.from_path),
      ['/a']
    )
  })
})

describe('applyPlan — gone', () => {
  it('crée le 410 et convertit les 301 auto qui y menaient', async () => {
    const svc = fakeRedirectsService([
      { from_path: '/old', to_path: '/dead', status: '301', origin: 'auto' }
    ])
    await applyPlan(svc, { type: 'gone', path: '/dead' })
    assert.deepEqual(
      svc.rows.map((r) => [r.from_path, r.to_path, r.status]),
      [
        ['/old', null, '410'],
        ['/dead', null, '410']
      ]
    )
  })

  it('respecte une ligne manuelle existante sur le chemin', async () => {
    const svc = fakeRedirectsService([
      { from_path: '/p', to_path: '/autre', status: '301', origin: 'manual' }
    ])
    await applyPlan(svc, { type: 'gone', path: '/p' })
    assert.equal(svc.rows.length, 1)
    assert.equal(svc.rows[0].status, '301')
  })
})

describe('applyPlan — revive', () => {
  it('retire les lignes auto qui bloquaient l’adresse, garde les manuelles', async () => {
    const svc = fakeRedirectsService([
      { from_path: '/p', to_path: null, status: '410', origin: 'auto' },
      { from_path: '/q', to_path: '/p', status: '301', origin: 'manual' }
    ])
    await applyPlan(svc, { type: 'revive', path: '/p' })
    assert.deepEqual(
      svc.rows.map((r) => r.from_path),
      ['/q']
    )
  })
})

describe('hook wiring', () => {
  it('enregistre filter+action sur les collections porteuses d’URL', () => {
    const filters = []
    const actions = []
    hook(
      {
        filter: (event, _handler) => filters.push(event),
        action: (event, _handler) => actions.push(event)
      },
      { services: { ItemsService: class {} }, getSchema: async () => ({}), database: null }
    )
    for (const c of ['formations', 'familles_formation', 'articles', 'centres', 'pages_legales']) {
      assert.ok(filters.includes(`${c}.items.update`), `filter update ${c}`)
      assert.ok(filters.includes(`${c}.items.delete`), `filter delete ${c}`)
      assert.ok(actions.includes(`${c}.items.update`), `action update ${c}`)
      assert.ok(actions.includes(`${c}.items.delete`), `action delete ${c}`)
      assert.ok(actions.includes(`${c}.items.create`), `action create ${c}`)
    }
  })
})
