// Dimensions personnalisées Matomo — contrat
// matomo/config.mjs : `idcustomdimension` est global et suit l'ordre de
// déclaration du fichier de config (1..6). Le tracker JS adresse cet id
// global (`dimension{idcustomdimension}`) — pas l'index par portée.
// Toute réorganisation de config.mjs doit être répercutée ici,
// et réciproquement.

export const ACTION_DIMENSION = {
  gabarit: 1,
  famille: 2,
  departement: 3,
  source: 4
} as const

export const VISIT_DIMENSION = {
  landingSeo: 5,
  cluster: 6
} as const

export type ActionDimensionKey = keyof typeof ACTION_DIMENSION
export type VisitDimensionKey = keyof typeof VISIT_DIMENSION

/**
 * Gabarit de la page (dimension action, posée sur 100 % des vues) déduit
 * du nom de route Nuxt — liste fermée issue. Une route
 * répertoriée retombe sur `autre` : le crawl reste mesurable sans casse.
 */
const GABARIT_BY_ROUTE: Record<string, string> = {
  index: 'accueil',
  formations: 'catalogue-formations',
  'formations-famille': 'famille',
  'formations-famille-slug': 'formation',
  centres: 'catalogue-centres',
  'centres-slug': 'centre',
  'centres-demande-de-formation': 'demande-formation',
  actualites: 'catalogue-actualites',
  'actualites-slug': 'article',
  'confirmation-type': 'confirmation',
  'parler-a-votre-conseiller': 'conseiller',
  'rejoindre-le-reseau': 'rejoindre-reseau',
  'partenaire-reseau': 'partenaire-reseau',
  'entreprise-reseau': 'entreprise-reseau',
  'referencer-mon-organisme': 'referencer-organisme',
  entreprise: 'entreprise',
  'a-propos': 'a-propos',
  slug: 'page'
}

export function gabaritForRouteName(name: string | symbol | null | undefined): string {
  return GABARIT_BY_ROUTE[String(name ?? '')] ?? 'autre'
}

/** Première valeur de query/param utilisable, `undefined` sinon. */
export function firstStringParam(value: unknown): string | undefined {
  if (typeof value === 'string' && value) return value
  if (Array.isArray(value)) return firstStringParam(value[0])
  return undefined
}

/**
 * Libellé « Source catalogue » du plan : `hq` = catalogue éditorial
 * Learn Up, tout autre compte = remontée Digiforma (franchise).
 */
export function sourceLabel(sourceCode: string | null | undefined): string | undefined {
  if (!sourceCode) return undefined
  return sourceCode === 'hq' ? 'Learn Up' : 'Digiforma'
}
