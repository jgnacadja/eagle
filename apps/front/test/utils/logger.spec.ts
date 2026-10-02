import { afterEach, describe, expect, it, vi } from 'vitest'
import { logClientError, logServerError } from '~/utils/logger'

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
})
