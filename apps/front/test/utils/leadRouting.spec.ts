import { describe, expect, it } from 'vitest'
import { leadRoutingFromQuery } from '~/utils/leadRouting'

describe('leadRoutingFromQuery', () => {
  it('lit formationId et centreId positifs', () => {
    expect(leadRoutingFromQuery({ formationId: '12', centreId: '3' })).toEqual({
      formationId: 12,
      centreId: 3
    })
  })

  it('omet les clés absentes (rien à envoyer hors contexte)', () => {
    expect(leadRoutingFromQuery({})).toEqual({})
    expect(leadRoutingFromQuery({ centreId: '5' })).toEqual({ centreId: 5 })
    expect(Object.keys(leadRoutingFromQuery({ formationId: '7' }))).toEqual(['formationId'])
  })

  it('prend la 1re valeur d’un paramètre répété', () => {
    expect(leadRoutingFromQuery({ formationId: ['4', '9'] })).toEqual({ formationId: 4 })
  })

  it.each(['abc', '0', '-3', '1.5', '', ' 7', '12abc', '1234567890', 'NaN'])(
    'ignore la valeur invalide %j',
    (value) => {
      expect(leadRoutingFromQuery({ formationId: value, centreId: value })).toEqual({})
    }
  )

  it('ignore les types non chaîne', () => {
    expect(leadRoutingFromQuery({ formationId: 12, centreId: null })).toEqual({})
    expect(leadRoutingFromQuery({ formationId: [], centreId: [5] })).toEqual({})
  })
})
