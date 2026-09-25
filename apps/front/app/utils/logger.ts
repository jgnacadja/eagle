// Wrapper minimal autour de console — un seul point d'exception ESLint
// (no-console), miroir de directus/logger.mjs. Réservé aux logs serveur.
export function logServerError(message: string, ...args: unknown[]): void {
  console.error(message, ...args)
}

// Erreurs côté navigateur (ex : soumission lead échouée) — même point unique.
export function logClientError(message: string, ...args: unknown[]): void {
  console.error(message, ...args)
}
