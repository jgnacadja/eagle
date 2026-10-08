import { describe, expect, it } from 'vitest'
import {
  decryptSecret,
  ENCRYPTED_PREFIX,
  encryptSecret,
  isEncrypted,
  parseEncryptionKey,
  SourcesCryptoError
} from './sources.crypto'

const KEY = Buffer.alloc(32, 7)

describe('sources.crypto', () => {
  it('round-trips a secret', () => {
    const encrypted = encryptSecret('digi-key-123', KEY)
    expect(isEncrypted(encrypted)).toBe(true)
    expect(encrypted).not.toContain('digi-key-123')
    expect(decryptSecret(encrypted, KEY)).toBe('digi-key-123')
  })

  it('uses a fresh IV each time', () => {
    expect(encryptSecret('k', KEY)).not.toBe(encryptSecret('k', KEY))
  })

  it('decrypts a value produced by the Directus hook (shared format)', () => {
    // Vecteur généré par directus/extensions/sources-encrypt/crypto.js
    // (clé = 32 × 0x07, IV = 12 × 0x03).
    const fromHook = 'enc:v1:AwMDAwMDAwMDAwMDCTV4qRlGkuwGvc1ehlN6xEGXxGp3Qzs7V3Fxbw=='
    expect(decryptSecret(fromHook, KEY)).toBe('digi-key-123')
    expect(encryptSecret('digi-key-123', KEY, Buffer.alloc(12, 3))).toBe(fromHook)
  })

  it('fails when the auth tag is altered', () => {
    const raw = Buffer.from(encryptSecret('k', KEY).slice(ENCRYPTED_PREFIX.length), 'base64')
    raw[12] ^= 0xff
    const tampered = `${ENCRYPTED_PREFIX}${raw.toString('base64')}`
    expect(() => decryptSecret(tampered, KEY)).toThrow(SourcesCryptoError)
  })

  it('fails with the wrong key without leaking the value', () => {
    const encrypted = encryptSecret('super-secret', KEY)
    try {
      decryptSecret(encrypted, Buffer.alloc(32, 9))
      expect.unreachable()
    } catch (error) {
      expect((error as Error).message).not.toContain('super-secret')
      expect((error as Error).message).not.toContain(encrypted)
    }
  })

  it('rejects a plaintext or truncated value', () => {
    expect(() => decryptSecret('plain', KEY)).toThrow(/not encrypted/)
    expect(() => decryptSecret(`${ENCRYPTED_PREFIX}AAAA`, KEY)).toThrow(/truncated/)
  })

  it('validates the key length', () => {
    expect(parseEncryptionKey(KEY.toString('base64'))).toEqual(KEY)
    expect(() => parseEncryptionKey(undefined)).toThrow(SourcesCryptoError)
    expect(() => parseEncryptionKey('short')).toThrow(/SOURCES_ENC_KEY/)
  })
})
