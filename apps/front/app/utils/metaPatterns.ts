// Moteur de metas par patrons (ST-04) : les gabarits de titre/description
// sont éditables dans Directus (collection `seo_patterns`) sans déployer.
// Un patron contient des variables `{cle}` remplacées par les données de
// la page ; le résultat passe par les gardes-fous SERP (60/160).

/** Longueur max d'un title SERP : au-delà, Google tronque arbitrairement. */
export const TITLE_MAX_LENGTH = 60
/** Longueur max d'une meta description SERP. */
export const DESCRIPTION_MAX_LENGTH = 160

/** Suffixe de marque retiré en priorité quand un titre déborde. */
const BRAND_SUFFIXES = [
  ' | LEARN UP ACADEMY',
  ' — LEARN UP ACADEMY',
  ' - LEARN UP ACADEMY',
  ' | Learn Up Academy'
]

const VARIABLE = /\{([a-zA-Zàâäéèêëîïôöùûüç0-9_-]+)\}/g

/** Valeurs de substitution d'un patron — vide/null = variable absente. */
export type MetaPatternVars = Record<string, string | number | null | undefined>

/**
 * Substitue les `{variables}` du patron. Une variable absente/vide n'est pas
 * laissée en accolades : son séparateur adjacent (« — », « à », « | », virgule)
 * est absorbé avec elle, puis les espaces doubles et la ponctuation orpheline
 * en bord de chaîne sont nettoyés.
 */
export function renderPattern(pattern: string | null | undefined, vars: MetaPatternVars): string {
  if (!pattern) return ''
  let out = pattern.replace(VARIABLE, (raw, key: string) => {
    const value = vars[key]
    return value === undefined || value === null || value === '' ? '' : String(value)
  })
  // Séparateurs rendus orphelins par une variable vide : « {a} — {b} » avec
  // b vide doit donner « a », pas « a — ».
  out = out
    .replace(/[\s]*(?:—|–|-|\|)\s*(?=$)/, '')
    .replace(/^\s*(?:—|–|-|\|)\s*/, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .replace(/,\s*(?=$|,)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
  return out
}

/**
 * Title ≤ 60 : retire d'abord le suffixe de marque (la page conserve son
 * intitulé propre), puis tronque au mot si nécessaire — jamais de coupe
 * au milieu d'un mot ni d'espace parasite avant « … ».
 */
export function truncateTitle(title: string, max = TITLE_MAX_LENGTH): string {
  let out = title.trim()
  if (out.length <= max) return out
  for (const suffix of BRAND_SUFFIXES) {
    if (out.endsWith(suffix)) {
      const stripped = out.slice(0, -suffix.length).trim()
      if (stripped.length <= max) return stripped
      out = stripped
      break
    }
  }
  return cutAtWord(out, max)
}

/**
 * Description ≤ 160 : coupe à la dernière frontière de mot qui tient,
 * sans laisser « , … » ou espace double. Jamais de `…` si rien n'est coupé.
 */
export function truncateDescription(text: string, max = DESCRIPTION_MAX_LENGTH): string {
  const out = text.replace(/\s{2,}/g, ' ').trim()
  if (out.length <= max) return out
  return cutAtWord(out, max)
}

function cutAtWord(text: string, max: number): string {
  const budget = max - 1 // place du « … »
  let cut = text.slice(0, budget + 1)
  const lastSpace = cut.lastIndexOf(' ')
  if (lastSpace > budget * 0.6) cut = cut.slice(0, lastSpace)
  cut = cut.replace(/[\s,.;:!?—–-]+$/, '')
  // Mot unique sans frontière : le budget tient compte du « … » final.
  if (cut.length > budget) cut = cut.slice(0, budget)
  return `${cut}…`
}

/** Résolution ST-04 : explicite > patron rendu > repli — puis garde 60/160. */
export function resolveSeoTitle(
  explicit: string | null | undefined,
  pattern: string | null | undefined,
  vars: MetaPatternVars,
  fallback: string
): string {
  const rendered = explicit?.trim() || renderPattern(pattern, vars) || fallback
  return truncateTitle(rendered)
}

export function resolveSeoDescription(
  explicit: string | null | undefined,
  pattern: string | null | undefined,
  vars: MetaPatternVars,
  fallback: string
): string {
  const rendered = explicit?.trim() || renderPattern(pattern, vars) || fallback
  return truncateDescription(rendered)
}
