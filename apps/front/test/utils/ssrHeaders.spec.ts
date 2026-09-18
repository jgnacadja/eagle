import { describe, expect, it } from 'vitest'
import { internalSsrHeaders } from '~/utils/ssrHeaders'

type Config = Parameters<typeof internalSsrHeaders>[0]

function configWith(token?: string): Config {
  return { internalApiToken: token } as unknown as Config
}

// `import.meta.client` est indéfini sous Vitest : seule la branche serveur
// (Nuxt SSR → API) est testable ici — c'est aussi le seul contexte où le
// header est produit.
describe('internalSsrHeaders', () => {
  it('retourne le header x-internal-ssr quand un token est configuré', () => {
    expect(internalSsrHeaders(configWith('secret-token'))).toEqual({
      'x-internal-ssr': 'secret-token'
    })
  })

  it('retourne undefined quand le token est vide ou absent', () => {
    expect(internalSsrHeaders(configWith(''))).toBeUndefined()
    expect(internalSsrHeaders(configWith())).toBeUndefined()
  })
})
