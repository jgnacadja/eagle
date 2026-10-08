import assert from 'node:assert/strict'
import { createDecipheriv } from 'node:crypto'
import { describe, it } from 'node:test'
import { encryptPayload, encryptSecret, parseKey, PREFIX } from './crypto.js'
import hook from './index.js'

const KEY = Buffer.alloc(32, 7)
const KEY_B64 = KEY.toString('base64')

function decrypt(value) {
  const raw = Buffer.from(value.slice(PREFIX.length), 'base64')
  const decipher = createDecipheriv('aes-256-gcm', KEY, raw.subarray(0, 12))
  decipher.setAuthTag(raw.subarray(12, 28))
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8')
}

describe('encryptPayload', () => {
  it('chiffre les secrets en clair (round-trip)', () => {
    const out = encryptPayload(
      { name: 'Lyon', digiforma_api_key: 'k1', hubspot_token: 't1' },
      KEY_B64
    )
    assert.equal(out.name, 'Lyon')
    assert.ok(out.digiforma_api_key.startsWith(PREFIX))
    assert.equal(decrypt(out.digiforma_api_key), 'k1')
    assert.equal(decrypt(out.hubspot_token), 't1')
  })

  it('utilise un IV aléatoire distinct à chaque chiffrement', () => {
    assert.notEqual(encryptSecret('k', KEY), encryptSecret('k', KEY))
  })

  it('ne rechiffre pas une valeur déjà préfixée', () => {
    const already = encryptSecret('k', KEY)
    assert.equal(encryptPayload({ digiforma_api_key: already }, KEY_B64).digiforma_api_key, already)
  })

  it('laisse passer vide / null / absent sans exiger de clé', () => {
    const payload = { digiforma_api_key: '', hubspot_token: null, name: 'x' }
    assert.deepEqual(encryptPayload(payload, undefined), payload)
    assert.deepEqual(encryptPayload({ name: 'x' }, undefined), { name: 'x' })
  })

  it('refuse l’écriture d’un secret sans clé ou avec une clé invalide', () => {
    assert.throws(() => encryptPayload({ digiforma_api_key: 'k' }, undefined), /SOURCES_ENC_KEY/)
    assert.throws(() => encryptPayload({ hubspot_token: 't' }, 'court'), /SOURCES_ENC_KEY/)
    assert.throws(() => parseKey(''), /SOURCES_ENC_KEY/)
  })

  it('n’altère pas le payload d’origine', () => {
    const payload = { digiforma_api_key: 'k' }
    encryptPayload(payload, KEY_B64)
    assert.equal(payload.digiforma_api_key, 'k')
  })
})

describe('hook', () => {
  it('s’enregistre sur la création et la mise à jour de sources', () => {
    const registered = {}
    process.env.SOURCES_ENC_KEY = KEY_B64
    hook({ filter: (event, handler) => (registered[event] = handler) })
    assert.deepEqual(Object.keys(registered).sort(), [
      'sources.items.create',
      'sources.items.update'
    ])
    const out = registered['sources.items.create']({ digiforma_api_key: 'secret' })
    assert.ok(out.digiforma_api_key.startsWith(PREFIX))
    assert.equal(decrypt(out.digiforma_api_key), 'secret')
  })
})
