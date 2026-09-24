import { describe, expect, it } from 'vitest'
import {
  ASSISTANT_ROUTE,
  assistantEntryHref,
  assistantRoute,
  readAssistantQuery
} from '~/utils/assistant-route'

describe('assistant-route', () => {
  it('construit la route avec la requête initiale trimée en ?q=', () => {
    expect(assistantRoute()).toEqual({ path: ASSISTANT_ROUTE })
    expect(assistantRoute('   ')).toEqual({ path: ASSISTANT_ROUTE })
    expect(assistantRoute(' former 8 salariés ')).toEqual({
      path: ASSISTANT_ROUTE,
      query: { q: 'former 8 salariés' }
    })
  })

  it('construit un lien partageable encodé', () => {
    expect(assistantEntryHref()).toBe('/recherche-assistee')
    expect(assistantEntryHref('')).toBe('/recherche-assistee')
    expect(assistantEntryHref('caces & sst')).toBe('/recherche-assistee?q=caces%20%26%20sst')
  })

  it('lit la requête initiale dans la query de la route', () => {
    expect(readAssistantQuery({})).toBe('')
    expect(readAssistantQuery({ q: '  sst  ' })).toBe('sst')
    expect(readAssistantQuery({ q: ['a', 'b'] })).toBe('')
    expect(readAssistantQuery({ q: null })).toBe('')
  })
})
