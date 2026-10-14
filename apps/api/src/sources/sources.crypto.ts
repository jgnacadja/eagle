import { createDecipheriv, createCipheriv, randomBytes } from 'node:crypto'

// Format partagé avec le hook Directus `sources-encrypt`
// (directus/extensions/sources-encrypt/crypto.js) :
// `enc:v1:<base64(iv | tag | ciphertext)>` — AES-256-GCM, IV 12 o, tag 16 o.
export const ENCRYPTED_PREFIX = 'enc:v1:'

const IV_BYTES = 12
const TAG_BYTES = 16
const KEY_BYTES = 32

export class SourcesCryptoError extends Error {}

export function isEncrypted(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX)
}

export function parseEncryptionKey(raw: string | undefined): Buffer {
  const key = Buffer.from(raw ?? '', 'base64')
  if (key.length !== KEY_BYTES) {
    throw new SourcesCryptoError('SOURCES_ENC_KEY invalid: 32 bytes encoded in base64 expected')
  }
  return key
}

export function encryptSecret(plain: string, key: Buffer, iv = randomBytes(IV_BYTES)): string {
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return `${ENCRYPTED_PREFIX}${Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64')}`
}

/** Les messages d'erreur ne contiennent jamais la valeur ni le chiffré. */
export function decryptSecret(value: string, key: Buffer): string {
  if (!isEncrypted(value)) {
    throw new SourcesCryptoError('Secret is not encrypted (missing enc:v1: prefix)')
  }
  const raw = Buffer.from(value.slice(ENCRYPTED_PREFIX.length), 'base64')
  if (raw.length < IV_BYTES + TAG_BYTES) {
    throw new SourcesCryptoError('Encrypted secret is truncated')
  }
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, raw.subarray(0, IV_BYTES))
    decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES))
    return Buffer.concat([
      decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)),
      decipher.final()
    ]).toString('utf8')
  } catch {
    throw new SourcesCryptoError('Secret could not be decrypted (wrong key or altered data)')
  }
}
