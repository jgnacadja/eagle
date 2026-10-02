import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyTextToClipboard } from '~/utils/clipboard'

const setClipboard = (impl?: (text: string) => Promise<void>) => {
  Object.defineProperty(navigator, 'clipboard', {
    value: impl ? { writeText: impl } : undefined,
    configurable: true
  })
}

const setExecCommand = (impl?: (cmd: string) => boolean) => {
  Object.defineProperty(document, 'execCommand', { value: impl, configurable: true })
}

afterEach(() => {
  setClipboard()
  setExecCommand()
})

describe('copyTextToClipboard', () => {
  it('utilise la Clipboard API quand elle réussit', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)

    await expect(copyTextToClipboard('hello')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('retombe sur execCommand quand la Clipboard API échoue', async () => {
    setClipboard(vi.fn().mockRejectedValue(new Error('denied')))
    const execCommand = vi.fn().mockReturnValue(true)
    setExecCommand(execCommand)

    await expect(copyTextToClipboard('hello')).resolves.toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('renvoie false quand le repli est indisponible', async () => {
    setClipboard(vi.fn().mockRejectedValue(new Error('denied')))

    await expect(copyTextToClipboard('hello')).resolves.toBe(false)
  })
})
