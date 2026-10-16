import { describe, it, expect } from 'vitest'
import { cleanEventPayload, toMatomoCommands } from '~/utils/matomo-events'

describe('cleanEventPayload', () => {
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

describe('toMatomoCommands', () => {
  it('traduit un événement du plan en trackEvent catégorie/action/nom', () => {
    expect(
      toMatomoCommands({
        event: 'select_formation_card',
        formation_id: 'sst',
        formation_name: 'SST',
        formation_family: 'Sécurité',
        list_name: 'catalogue',
        position: 2
      })
    ).toEqual([['trackEvent', 'Formations', 'select_formation_card', 'SST:catalogue', 2]])
  })

  it('conserve le nom du plan comme action', () => {
    const [command] = toMatomoCommands({ event: 'view_rejoindre_reseau_page' })
    expect(command).toEqual(['trackEvent', 'Réseau', 'view_rejoindre_reseau_page'])
  })

  it('pousse une valeur sans nom avec le nom vide requis par Matomo', () => {
    expect(toMatomoCommands({ event: 'view_formations_catalog', results_count: 12 })).toEqual([
      ['trackEvent', 'Formations', 'view_formations_catalog', '', 12]
    ])
  })

  it('route les recherches vers trackSiteSearch', () => {
    expect(
      toMatomoCommands({ event: 'search_formations', search_term: 'caces', results_count: 4 })
    ).toEqual([['trackSiteSearch', 'caces', 'Formations', 4]])
    expect(toMatomoCommands({ event: 'search_centres', search_term: 'lyon' })).toEqual([
      ['trackSiteSearch', 'lyon', 'Centres', 0]
    ])
  })

  it('click_phone / session_signup déclenchent les objectifs (action = nom du plan)', () => {
    expect(
      toMatomoCommands({ event: 'click_phone', center_name: 'Paris', phone_type: 'fixe' })
    ).toEqual([['trackEvent', 'Centres', 'click_phone', 'Paris:fixe']])
    expect(
      toMatomoCommands({ event: 'session_signup', formation_id: 'sst', session_id: 's1' })
    ).toEqual([['trackEvent', 'Formations', 'session_signup', 'sst:s1']])
  })

  it('ignore page_view (couvert par trackPageView) et les événements sans règle', () => {
    expect(toMatomoCommands({ event: 'page_view', page_path: '/' })).toEqual([])
    expect(toMatomoCommands({ event: 'event_inconnu' })).toEqual([])
    expect(toMatomoCommands({})).toEqual([])
  })

  it('ne propage aucune PII dans la traduction (payload déjà nettoyé)', () => {
    expect(
      toMatomoCommands(
        cleanEventPayload({
          event: 'form_submit',
          form_id: 'demande_formation',
          email: 'user@example.com',
          telephone: '0601020304'
        })
      )
    ).toEqual([['trackEvent', 'Formulaires', 'form_submit', 'demande_formation']])
  })
})
