import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useConfirmationRedirect } from '~/composables/useConfirmationRedirect'
import { confirmationFlagKey } from '~/utils/confirmation'

const navigateMock = vi.fn()
vi.stubGlobal('navigateTo', navigateMock)

describe('useConfirmationRedirect (ST-30)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.sessionStorage.clear()
  })

  it('pose le drapeau de conversion puis navigue vers /confirmation/{type}', async () => {
    const { confirmConversion } = useConfirmationRedirect()

    await confirmConversion('devis')

    expect(window.sessionStorage.getItem(confirmationFlagKey('devis'))).toBe('{}')
    expect(navigateMock).toHaveBeenCalledWith('/confirmation/devis')
  })

  it('sérialise le contexte (référence, détail, CTA retour) dans le drapeau', async () => {
    const { confirmConversion } = useConfirmationRedirect()
    const context = {
      reference: 'LU-2026-1012-042',
      detail: 'Un conseiller vous rappellera dès que possible au 06 12 34 56 78.',
      backTo: '/formations/sante/sst-initial',
      backLabel: 'Retour à la formation'
    }

    await confirmConversion('rendez-vous', context)

    expect(JSON.parse(window.sessionStorage.getItem(confirmationFlagKey('rendez-vous'))!)).toEqual(
      context
    )
    expect(navigateMock).toHaveBeenCalledWith('/confirmation/rendez-vous')
  })

  it('navigue quand même si sessionStorage est indisponible', async () => {
    const setItemSpy = vi.spyOn(window.sessionStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('denied')
    })
    const { confirmConversion } = useConfirmationRedirect()

    await confirmConversion('devis')

    expect(navigateMock).toHaveBeenCalledWith('/confirmation/devis')
    setItemSpy.mockRestore()
  })
})
