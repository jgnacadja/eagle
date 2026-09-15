import type { useRuntimeConfig } from '#app'

/**
 * Header interne envoyé uniquement par les fetches SSR (serveur Nuxt → API).
 * Sans lui, tous les appels serveur partageraient l'IP du front dans le
 * throttler de l'API — un seul bucket de 100 req/min pour tous les visiteurs.
 * Le token vit dans la runtimeConfig privée : jamais exposé au navigateur.
 *
 * Retourne `undefined` (pas {}) quand rien n'est envoyé : un header vide
 * n'a pas à figurer dans les options des appels.
 */
export function internalSsrHeaders(
  config: ReturnType<typeof useRuntimeConfig>
): Record<string, string> | undefined {
  if (import.meta.client) return undefined
  const token = config.internalApiToken
  return typeof token === 'string' && token ? { 'x-internal-ssr': token } : undefined
}
