import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useFormTracking } from '~/composables/useFormTracking'

describe('useFormTracking', () => {
  beforeEach(() => {
    window.dataLayer = []
    document.title = 'Demande de formation'
  })

  it('pushes form_view on call', () => {
    const { trackFormView } = useFormTracking({
      formId: 'demande_formation',
      formName: 'Demande de formation'
    })

    trackFormView(1, 'Besoin')

    const lastEvent = window.dataLayer?.find((e) => e.event === 'form_view')
    expect(lastEvent).toMatchObject({
      event: 'form_view',
      form_id: 'demande_formation',
      form_name: 'Demande de formation',
      form_step: 1,
      form_step_name: 'Besoin'
    })
  })

  it('triggers form_start on first interaction only once', () => {
    const { trackFormStart, trackFieldInteraction } = useFormTracking({
      formId: 'demande_formation',
      formName: 'Demande de formation'
    })

    trackFormStart('besoin')
    trackFieldInteraction('nom')

    const startEvents = window.dataLayer?.filter((e) => e.event === 'form_start')
    expect(startEvents?.length).toBe(1)
    expect(startEvents?.[0]).toMatchObject({
      event: 'form_start',
      form_id: 'demande_formation',
      field_name: 'besoin'
    })
  })

  it('pushes form_error with field and error details', () => {
    const { trackFormError } = useFormTracking({
      formId: 'demande_formation',
      formName: 'Demande de formation'
    })

    trackFormError('email', 'Email invalide')

    const errorEvent = window.dataLayer?.find((e) => e.event === 'form_error')
    expect(errorEvent).toMatchObject({
      event: 'form_error',
      form_id: 'demande_formation',
      field_name: 'email',
      error_message: 'Email invalide',
      error_type: 'validation'
    })
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

    const submitEvent = window.dataLayer?.find((e) => e.event === 'form_submit')
    expect(submitEvent).toMatchObject({
      event: 'form_submit',
      form_id: 'demande_formation',
      form_type: 'devis',
      steps_count: 3,
      completion_time_seconds: 5
    })
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

    const abandonEvent = window.dataLayer?.find((e) => e.event === 'form_abandon')
    expect(abandonEvent).toMatchObject({
      event: 'form_abandon',
      form_id: 'demande_formation',
      last_field_filled: 'besoin',
      fields_completed_count: 1,
      fields_total_count: 5,
      time_spent_seconds: 12
    })
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

    const submitEvent = window.dataLayer?.find((e) => e.event === 'form_submit')
    expect(submitEvent).toMatchObject({
      event: 'form_submit',
      form_id: 'demande_organisme',
      form_name: 'Référencer mon organisme'
    })
  })
})
