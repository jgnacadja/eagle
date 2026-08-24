import { createDirectus, rest } from '@directus/sdk'

/**
 * Le rendu SSR (dans le conteneur front) et le navigateur ne joignent pas
 * Directus par la même URL sous Docker — voir nuxt.config.ts.
 */
export function useDirectusClient() {
  const config = useRuntimeConfig()
  const baseUrl = import.meta.server ? config.directusUrl : config.public.directusUrl
  return createDirectus(baseUrl).with(rest())
}
