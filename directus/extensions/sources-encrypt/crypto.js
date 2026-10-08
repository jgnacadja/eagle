// Chiffrement des secrets de `sources` — format partagé avec l'API NestJS
// (`apps/api/src/sources/sources.crypto.ts`) : `enc:v1:<base64(iv|tag|ciphertext)>`,
// AES-256-GCM, IV aléatoire de 12 octets, tag de 16 octets.
import { Buffer } from 'node:buffer'
import { createCipheriv, randomBytes } from 'node:crypto'

export const PREFIX = 'enc:v1:'
export const SECRET_FIELDS = ['digiforma_api_key', 'hubspot_token']

const IV_BYTES = 12
const KEY_BYTES = 32

export function parseKey(raw) {
  const key = Buffer.from(String(raw ?? ''), 'base64')
  if (key.length !== KEY_BYTES) {
    throw new Error('SOURCES_ENC_KEY invalide : 32 octets encodés en base64 attendus')
  }
  return key
}

export function encryptSecret(plain, key, iv = randomBytes(IV_BYTES)) {
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return `${PREFIX}${Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64')}`
}

/**
 * Chiffre les champs secrets présents et non déjà chiffrés. Valeur vide/null
 * = effacement (laissé tel quel). Sans clé valide, refuse l'écriture plutôt
 * que de stocker un secret en clair.
 */
export function encryptPayload(payload, rawKey) {
  if (!payload || typeof payload !== 'object') return payload
  const pending = SECRET_FIELDS.filter(
    (field) =>
      typeof payload[field] === 'string' &&
      payload[field] !== '' &&
      !payload[field].startsWith(PREFIX)
  )
  if (pending.length === 0) return payload

  const key = parseKey(rawKey)
  const result = { ...payload }
  for (const field of pending) result[field] = encryptSecret(payload[field], key)
  return result
}
