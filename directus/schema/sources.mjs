// Multi-sources (Digiforma + HubSpot par franchise) : logique pure de la
// migration « source HQ », isolée de build.mjs pour être testable sans
// instance Directus.

export const HQ_CODE = 'hq'

const HUBSPOT_FORMS = ['newsletter', 'demande', 'candidature', 'conseiller', 'rappel']

const orNull = (value) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : null)

/**
 * Ligne `sources` de la tête de réseau, reprise des variables d'env actuelles.
 * La clé API Digiforma n'est jamais copiée : elle est saisie dans l'admin
 * (chiffrée par le hook) — vide = repli sur DIGIFORMA_API_KEY côté API.
 */
export function buildHqSource(env) {
  const forms = Object.fromEntries(
    HUBSPOT_FORMS.map((form) => [
      `hubspot_form_${form}`,
      orNull(env[`HUBSPOT_FORM_${form.toUpperCase()}`])
    ])
  )
  return {
    name: 'LEARN UP ACADEMY (siège)',
    code: HQ_CODE,
    is_hq: true,
    status: 'active',
    digiforma_api_url: orNull(env.DIGIFORMA_API_URL),
    hubspot_portal_id: orNull(env.HUBSPOT_PORTAL_ID),
    ...forms
  }
}

/**
 * Choisit l'action sur les sources existantes : créer la ligne HQ, réutiliser
 * l'existante, ou échouer si l'invariant « une seule HQ » est déjà violé.
 * @returns {{ action: 'create' | 'reuse', id?: string }}
 */
export function planHqSource(existingSources) {
  const hqRows = existingSources.filter((source) => source.is_hq)
  if (hqRows.length > 1) {
    throw new Error(
      `Plusieurs sources HQ (${hqRows.map((s) => s.code).join(', ')}) — une seule autorisée`
    )
  }
  if (hqRows.length === 1) return { action: 'reuse', id: hqRows[0].id }
  return { action: 'create' }
}
