import type { LeadRouting } from '@learnup/types'

// Entier strictement positif lu dans une valeur de query (chaîne ou tableau
// de chaînes — on garde la 1re). Tout le reste (texte, 0, décimal, négatif,
// valeur démesurée) est ignoré : un id douteux ne doit jamais bloquer l'envoi.
function positiveInt(value: unknown): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || !/^\d{1,9}$/.test(raw)) return undefined
  const parsed = Number(raw)
  return parsed > 0 ? parsed : undefined
}

/**
 * Rattachement d'un lead à une source (portail HubSpot) transmis par les CTA
 * en query : `?formationId=` sur une fiche formation, `?centreId=` sur une
 * page centre. Les clés absentes restent absentes du payload — l'API route
 * alors vers la tête de réseau.
 */
export function leadRoutingFromQuery(query: Record<string, unknown>): LeadRouting {
  const formationId = positiveInt(query.formationId)
  const centreId = positiveInt(query.centreId)
  return {
    ...(formationId === undefined ? {} : { formationId }),
    ...(centreId === undefined ? {} : { centreId })
  }
}
