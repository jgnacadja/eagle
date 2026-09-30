import { describe, it, expect, beforeEach } from 'vitest'
import { cleanEventPayload, useDataLayer } from '~/composables/useDataLayer'

describe('useDataLayer - cleanEventPayload', () => {
  it('removes undefined, null, and empty string values', () => {
    const raw = {
      event: 'test_event',
      valid_str: 'hello',
      valid_num: 42,
      valid_bool: false,
      empty_str: '',
      null_val: null,
      undef_val: undefined
    }

    const cleaned = cleanEventPayload(raw)

    expect(cleaned).toEqual({
      event: 'test_event',
      valid_str: 'hello',
      valid_num: 42,
      valid_bool: false
    })
  })

  it('strips PII fields (email, phone, nom, etc.)', () => {
    const raw = {
      event: 'form_submit',
      form_id: 'demande_formation',
      email: 'user@example.com',
      telephone: '0601020304',
      nom: 'Dupont',
      prenom: 'Jean',
      siret: '12345678901234'
    }

    const cleaned = cleanEventPayload(raw)

    expect(cleaned).toEqual({
      event: 'form_submit',
      form_id: 'demande_formation'
    })
    expect(cleaned).not.toHaveProperty('email')
    expect(cleaned).not.toHaveProperty('telephone')
    expect(cleaned).not.toHaveProperty('nom')
    expect(cleaned).not.toHaveProperty('prenom')
  })

  it('cleans nested objects recursively', () => {
    const raw = {
      event: 'nested_test',
      meta: {
        valid: 'ok',
        empty: '',
        email: 'secret@test.com'
      }
    }

    const cleaned = cleanEventPayload(raw)

    expect(cleaned).toEqual({
      event: 'nested_test',
      meta: {
        valid: 'ok'
      }
    })
  })
})

describe('useDataLayer - pushEvent', () => {
  beforeEach(() => {
    window.dataLayer = []
    document.title = 'LearnUp Academy - Test'
  })

  it('initializes window.dataLayer and pushes the cleaned event', () => {
    delete (window as { dataLayer?: unknown }).dataLayer

    const { pushEvent } = useDataLayer()

    pushEvent({
      event: 'click_download_program',
      formation_id: 'caces-r489',
      formation_name: 'CACES R489',
      formation_family: 'Logistique'
    })

    expect(window.dataLayer).toBeDefined()
    expect(Array.isArray(window.dataLayer)).toBe(true)
    expect(window.dataLayer?.length).toBe(1)

    const pushed = window.dataLayer?.[0]
    expect(pushed).toMatchObject({
      event: 'click_download_program',
      formation_id: 'caces-r489',
      formation_name: 'CACES R489',
      formation_family: 'Logistique'
    })
    expect(pushed?.page_path).toBeDefined()
    expect(pushed?.page_title).toBe('LearnUp Academy - Test')
  })
})
