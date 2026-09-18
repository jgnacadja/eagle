import departements from '@etalab/decoupage-administratif/data/departements.json'

/**
 * Départements français — code officiel (INSEE) → nom, via les données
 * Etalab. `centres.departments_covered` est un champ tags libre (« codes
 * ou noms ») : on normalise les codes en noms pour l'affichage et le
 * filtrage. Noms alignés sur la BAN (source du champ `department`).
 *
 * Sous-chemin JSON plutôt que `index.js` du package : celui-ci lit les
 * fichiers en `fs.readFileSync` relatif au cwd — cassant hors de sa
 * racine. Le JSON seul ne charge pas les 8 Mo de communes.
 */
const NAMES = new Map(departements.map(({ code, nom }) => [code, nom]))

/**
 * Nom d'affichage d'une valeur de département : code connu → nom,
 * sinon valeur brute (le champ accepte aussi des noms saisis à la main).
 */
export function departmentName(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  return NAMES.get(trimmed.toUpperCase()) ?? trimmed
}
