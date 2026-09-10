export interface GeoPoint {
  lat: number
  lng: number
}

const EARTH_RADIUS_KM = 6371

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Distance à vol d'oiseau entre deux points, en kilomètres (haversine).
 * Résultat arrondi à une décimale pour l'affichage.
 */
export function distanceKm(from: GeoPoint, to: GeoPoint): number {
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const km = EARTH_RADIUS_KM * c
  return Math.round(km * 10 + Number.EPSILON) / 10
}

/**
 * Formate une distance en kilomètres pour l'affichage :
 * - moins de 1 km : « 800 m »
 * - 1 km ou plus : « 12,4 km »
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }

  const rounded = Math.round(km * 10 + Number.EPSILON) / 10
  const value = rounded.toFixed(1).replace('.', ',')
  return `${value} km`
}
