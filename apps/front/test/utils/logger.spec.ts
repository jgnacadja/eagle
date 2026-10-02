import { afterEach, describe, expect, it, vi } from 'vitest'
import { logClientError, logClientWarning, logServerError } from '~/utils/logger'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('logger', () => {
  it('logServerError délègue à console.error avec ses arguments', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    logServerError('échec serveur', { code: 500 })

    expect(spy).toHaveBeenCalledWith('échec serveur', { code: 500 })
  })

  it('logClientError délègue à console.error avec ses arguments', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    logClientError('échec client')

    expect(spy).toHaveBeenCalledWith('échec client')
  })

  it('logClientWarning délègue à console.warn avec ses arguments', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    logClientWarning('alerte client', { detail: 'info' })

    expect(spy).toHaveBeenCalledWith('alerte client', { detail: 'info' })
  })
})
