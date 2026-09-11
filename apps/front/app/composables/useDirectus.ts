import { createDirectus, rest } from '@directus/sdk'

/**
 * Le front ne parle plus à Directus directement : toutes les requêtes passent
 * par le proxy `/directus` de l'API NestJS (apps/api/src/directus), qui
 * injecte le token serveur. SSR et navigateur ne joignent pas l'API par la
 * même URL sous Docker — voir nuxt.config.ts.
 */
export function useDirectusClient() {
  const config = useRuntimeConfig()
  const apiBase = import.meta.server ? config.apiBase : config.public.apiBase
  return createDirectus(`${apiBase}/directus`).with(rest())
}
