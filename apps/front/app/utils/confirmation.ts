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

// Secours en mémoire : le drapeau n'a besoin de survivre qu'à la navigation
// SPA vers /confirmation/{type} — quand sessionStorage est indisponible
// (navigation privée stricte, quota, politique), ce Map assure le relais et
// la conversion reste authentifiée au lieu de rebondir vers l'accueil.
const pendingConfirmation = new Map<string, string>()

/** Pose le drapeau de conversion (contexte sérialisé en JSON). */
export function markConfirmationFlag(type: ConfirmationType, payload: string): void {
  const key = confirmationFlagKey(type)
  try {
    window.sessionStorage.setItem(key, payload)
    pendingConfirmation.delete(key)
  } catch {
    pendingConfirmation.set(key, payload)
  }
}

/** Lit puis consomme le drapeau — null si absent (accès direct, rechargement). */
export function takeConfirmationFlag(type: ConfirmationType): string | null {
  const key = confirmationFlagKey(type)
  try {
    const flag = window.sessionStorage.getItem(key)
    if (flag !== null) {
      window.sessionStorage.removeItem(key)
      return flag
    }
  } catch {
    // sessionStorage indisponible — le secours en mémoire prend le relais.
  }
  const flag = pendingConfirmation.get(key) ?? null
  pendingConfirmation.delete(key)
  return flag
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
