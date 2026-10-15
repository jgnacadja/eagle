import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useFormTracking } from '~/composables/useFormTracking'
import type { MatomoCommand } from '~/utils/matomo'

const pushed = (): MatomoCommand[] =>
  (window._paq ?? []).filter((c): c is MatomoCommand => c[0] === 'trackEvent')

const findEvent = (action: string) => pushed().find((c) => c[2] === action)

describe('useFormTracking', () => {
  beforeEach(() => {
    window._paq = []
    document.title = 'Demande de formation'
  })

  it('pushes form_view on call', () => {
    const { trackFormView } = useFormTracking({
      formId: 'demande_formation',
      formName: 'Demande de formation'
    })

    trackFormView(1, 'Besoin')

    expect(findEvent('form_view')).toEqual([
      'trackEvent',
      'Formulaires',
      'form_view',
      'demande_formation:Besoin'
    ])
  })

  it('triggers form_start on first interaction only once', () => {
    const { trackFormStart, trackFieldInteraction } = useFormTracking({
      formId: 'demande_formation',
      formName: 'Demande de formation'
    })

    trackFormStart('besoin')
    trackFieldInteraction('nom')

    const startEvents = pushed().filter((c) => c[2] === 'form_start')
    expect(startEvents.length).toBe(1)
    expect(startEvents[0]).toEqual([
      'trackEvent',
      'Formulaires',
      'form_start',
      'demande_formation:besoin'
    ])
  })

  it('pushes form_error with field and error details', () => {
    const { trackFormError } = useFormTracking({
      formId: 'demande_formation',
      formName: 'Demande de formation'
    })

    trackFormError('email', 'Email invalide')

    expect(findEvent('form_error')).toEqual([
      'trackEvent',
      'Formulaires',
      'form_error',
      'demande_formation:email:validation'
    ])
  })

  it('pushes form_submit on successful completion', () => {
    vi.useFakeTimers()
    const { trackFormStart, trackFormSubmit } = useFormTracking({
      formId: 'demande_formation',
      formName: 'Demande de formation',
      totalSteps: 3
    })

    trackFormStart('besoin')
    vi.advanceTimersByTime(5000)
    trackFormSubmit('devis')

    expect(findEvent('form_submit')).toEqual([
      'trackEvent',
      'Formulaires',
      'form_submit',
      'demande_formation:devis',
      5
    ])
    vi.useRealTimers()
  })

  it('pushes form_abandon if started but not submitted', () => {
    vi.useFakeTimers()
    const { trackFormStart, trackFormAbandon } = useFormTracking({
      formId: 'demande_formation',
      formName: 'Demande de formation',
      totalFields: 5
    })

    trackFormStart('besoin')
    vi.advanceTimersByTime(12000)
    trackFormAbandon()

    expect(findEvent('form_abandon')).toEqual([
      'trackEvent',
      'Formulaires',
      'form_abandon',
      'demande_formation',
      1
    ])
    vi.useRealTimers()
  })

  it('supports reactive/getter options for formId and formName', () => {
    let currentId = 'demande_franchise' as const
    let currentName = 'Ouvrir un centre'

    const { trackFormSubmit } = useFormTracking({
      formId: () => currentId,
      formName: () => currentName
    })

    currentId = 'demande_organisme'
    currentName = 'Référencer mon organisme'

    trackFormSubmit('demande_organisme')

    const submitEvent = findEvent('form_submit')
    expect(submitEvent?.[1]).toBe('Formulaires')
    expect(submitEvent?.[3]).toContain('demande_organisme')
  })
})
