/**
 * Un statut fourni sans `archived_by_source` est une décision éditoriale.
 * Les opérations automatiques de la sync écrivent explicitement le marqueur
 * avec le statut, donc elles conservent leur provenance.
 */
export function clearSourceArchiveOnEditorialStatusChange(payload) {
  if (!payload || typeof payload !== 'object') return payload

  if (Array.isArray(payload)) {
    return payload.map(clearSourceArchiveOnEditorialStatusChange)
  }

  if (Object.hasOwn(payload, 'status') && !Object.hasOwn(payload, 'archived_by_source')) {
    return { ...payload, archived_by_source: false }
  }

  return payload
}
