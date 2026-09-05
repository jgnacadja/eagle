/**
 * Libellé de disponibilité d'une session.
 * `full` : « 5 places disponibles » ; sinon « 5 places ».
 */
export function placesLabel(places: number, full = true): string {
  const plural = places > 1 ? 's' : ''
  return full ? `${places} place${plural} disponible${plural}` : `${places} place${plural}`
}
