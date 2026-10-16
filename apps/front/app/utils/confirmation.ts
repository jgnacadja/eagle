// ST-30 — pages de confirmation /confirmation/{type} : chaque conversion
// mène à une URL dédiée (règle R-18) pour être mesurable dans Matomo
// (objectif = visite de l'URL, ST-32). Types issus du plan de tracking
// (ST-31) — un type inconnu de la route répond 404.
export const CONFIRMATION_TYPES = ['devis', 'rendez-vous', 'inscription', 'candidature'] as const

export type ConfirmationType = (typeof CONFIRMATION_TYPES)[number]

/** Drapeau posé par le formulaire juste avant la redirection. */
export function confirmationFlagKey(type: ConfirmationType): string {
  return `learnup:confirmation:${type}`
}

/**
 * Route de confirmation connue (`/confirmation/{type}`) — le tracker Matomo
 * s'en sert pour exclure ces pages du suivi automatique : seule la page,
 * après validation du drapeau de conversion, émet la vue mesurable.
 */
export function isConfirmationPath(path: string): boolean {
  const type = /^\/confirmation\/([^/]+)\/?$/.exec(path)?.[1]
  return (CONFIRMATION_TYPES as readonly string[]).includes(type ?? '')
}
