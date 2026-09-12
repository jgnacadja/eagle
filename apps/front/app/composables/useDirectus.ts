import { createDirectus, rest } from '@directus/sdk'

/**
 * Le front ne parle plus à Directus directement : toutes les requêtes passent
 * par le proxy `/directus` de l'API NestJS (apps/api/src/directus), qui
 * injecte le token serveur. SSR et navigateur ne joignent pas l'API par la
 * même URL sous Docker — voir nuxt.config.ts.
 *
 * En SSR, le fetch du SDK reçoit le header interne `x-internal-ssr` pour que
 * le throttler de l'API ne mette pas les requêtes serveur dans le bucket
 * public (partagé par tous les visiteurs sinon).
 */
export function useDirectusClient() {
  const config = useRuntimeConfig()
  const apiBase = import.meta.server ? config.apiBase : config.public.apiBase
  const ssrHeaders = internalSsrHeaders(config)
  return createDirectus(`${apiBase}/directus`, {
    globals: {
      fetch: (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const headers = new Headers(init?.headers)
        for (const [key, value] of Object.entries(ssrHeaders ?? {})) {
          headers.set(key, value)
        }
        return fetch(input, { ...init, headers })
      }
    }
  }).with(rest())
}
