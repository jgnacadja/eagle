import { describe, expect, it } from 'vitest'
import { nonEmptyCachedData } from '~/utils/asyncDataCache'

function fakeNuxtApp(
  payloadData: Record<string, unknown>,
  staticData: Record<string, unknown> = {}
) {
  return { payload: { data: payloadData }, static: { data: staticData } }
}

describe('nonEmptyCachedData', () => {
  it('renvoie la valeur cachée non vide', () => {
    const familles = [{ slug: 'sante', label: 'Santé', count: 2 }]
    const nuxtApp = fakeNuxtApp({ 'menu-familles': familles })

    expect(nonEmptyCachedData('menu-familles', nuxtApp)).toEqual(familles)
  })

  it('ignore un tableau vide (résultat dégradé) pour repartir vers la source', () => {
    const nuxtApp = fakeNuxtApp({ 'menu-familles': [] })

    expect(nonEmptyCachedData('menu-familles', nuxtApp)).toBeUndefined()
  })

  it('ignore null et undefined', () => {
    const nuxtApp = fakeNuxtApp({ a: null })

    expect(nonEmptyCachedData('a', nuxtApp)).toBeUndefined()
    expect(nonEmptyCachedData('b', nuxtApp)).toBeUndefined()
  })

  it('lit static.data en secours', () => {
    const familles = [{ slug: 'rse', label: 'RSE', count: 1 }]
    const nuxtApp = fakeNuxtApp({}, { 'menu-familles': familles })

    expect(nonEmptyCachedData('menu-familles', nuxtApp)).toEqual(familles)
  })

  it('privilégie payload.data sur static.data', () => {
    const fraiches = [{ slug: 'a', label: 'A', count: 1 }]
    const perimees = [{ slug: 'b', label: 'B', count: 2 }]
    const nuxtApp = fakeNuxtApp({ k: fraiches }, { k: perimees })

    expect(nonEmptyCachedData('k', nuxtApp)).toEqual(fraiches)
  })
})
