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
 * Valeur brute : l'arrondi n'est appliqué qu'au formatage (formatDistance)
 * — sinon 0,96 km serait affiché « 1,0 km » au lieu de « 960 m » et le tri
 * ordonnerait des valeurs tronquées.
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
  return EARTH_RADIUS_KM * c
}

/**
 * Centroïde du groupe de points le plus concentré : chaque point compte
 * ses voisins dans `radiusKm`, on retourne le barycentre du plus grand
 * voisinage. Sert à cadrer la carte sur la zone la plus dense d'un
 * département — les centres « couvrant » un département peuvent être
 * implantés dans les départements voisins, un fit global cadrerait trop
 * large.
 */
export function densestClusterCenter(points: GeoPoint[], radiusKm = 15): GeoPoint | null {
  let best: GeoPoint[] = []
  for (const p of points) {
    const group = points.filter((o) => distanceKm(p, o) <= radiusKm)
    if (group.length > best.length) best = group
  }
  if (!best.length) return null
  return {
    lat: best.reduce((s, p) => s + p.lat, 0) / best.length,
    lng: best.reduce((s, p) => s + p.lng, 0) / best.length
  }
}

/**
 * Numéro de département déduit du code postal — sert à composer les
 * adresses mail du réseau (`contact{dept}@learnup-academy.com`).
 * 5 chiffres attendus : préfixe « 97 » → 3 chiffres (DROM), Corse
 * (20xxx) → « 2A » sous 20200, « 2B » au-delà, sinon les 2 premiers.
 */
export function departmentCodeFromPostalCode(postalCode: string | null | undefined): string | null {
  const cp = postalCode?.trim() ?? ''
  if (!/^\d{5}$/.test(cp)) return null
  if (cp.startsWith('97')) return cp.slice(0, 3)
  if (cp.startsWith('20')) return Number(cp.slice(0, 3)) < 202 ? '2A' : '2B'
  return cp.slice(0, 2)
}

/**
 * Forme de comparaison d'une valeur de département : casse et accents
 * ignorés, espaces, apostrophes et tirets supprimés — « Val de Marne » (tag libre) et
 * « Val-de-Marne » (géocodage BAN) doivent se rejoindre. Même règle que
 * `normalizeDepartment` côté API (`apps/api/src/centres`).
 */
export function normalizeDepartment(text: string | null | undefined): string {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s'’-]+/g, '')
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
