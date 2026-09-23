import { ref } from 'vue'

/**
 * Suggestion géographique issue de geo.api.gouv.fr.
 */
export interface GeoSuggestion {
  /** Libellé affiché — « Lyon (69) », « Rhône (département 69) », « 75001 Paris ». */
  label: string
  /**
   * Valeur de localisation catalogue : « lat,lng » pour une commune ou un
   * code postal (recherche par rayon côté API), code INSEE pour un
   * département.
   */
  location: string
  /**
   * Terme de recherche texte — le nom seul (« Lyon », « Rhône ») ou le
   * code postal (« 75001 »). Utilisé pour la recherche centres (`?q=`),
   * qui matche par sous-chaîne et non par coordonnées.
   */
  term: string
  /** Nature de la suggestion — un département pré-remplit le filtre territoire. */
  kind: 'commune' | 'department'
}

interface GeoCommune {
  nom: string
  codeDepartement?: string
  codesPostaux?: string[]
  centre?: { coordinates: [number, number] }
}

interface GeoDepartement {
  code: string
  nom: string
}

const GEO_API = 'https://geo.api.gouv.fr'
const MAX_SUGGESTIONS = 8
// « 97 » peut désigner 5 départements d'outre-mer : borne le nombre de
// requêtes `/departements/{code}/communes` par saisie.
const MAX_DEPARTEMENT_FETCH = 5

function communeToSuggestion(commune: GeoCommune): GeoSuggestion {
  const suffix = commune.codeDepartement ? ` (${commune.codeDepartement})` : ''
  // Centre de la commune → recherche par proximité (rayon) côté API catalogue.
  const location = commune.centre
    ? `${commune.centre.coordinates[1]},${commune.centre.coordinates[0]}`
    : commune.nom
  return { label: `${commune.nom}${suffix}`, location, term: commune.nom, kind: 'commune' }
}

/**
 * « 75001 Paris » : le code postal est le terme de recherche centres
 * (matche `postal_code`) et l'ancre `lat,lng` du centre communal sert la
 * recherche catalogue par rayon.
 */
function codePostalToSuggestion(codePostal: string, commune: GeoCommune): GeoSuggestion {
  const location = commune.centre
    ? `${commune.centre.coordinates[1]},${commune.centre.coordinates[0]}`
    : codePostal
  return { label: `${codePostal} ${commune.nom}`, location, term: codePostal, kind: 'commune' }
}

// « (département XX) » distingue le territoire de la ville homonyme :
// « Paris (75) » (commune) et « Paris (département 75) » coexistent dans
// la liste au lieu de s'exclure à la déduplication.
function departementToSuggestion(departement: GeoDepartement): GeoSuggestion {
  return {
    label: `${departement.nom} (département ${departement.code})`,
    location: departement.code,
    term: departement.nom,
    kind: 'department'
  }
}

function dedupeByLabel(suggestions: GeoSuggestion[]): GeoSuggestion[] {
  const seen = new Set<string>()
  return suggestions.filter((s) => (seen.has(s.label) ? false : (seen.add(s.label), true)))
}

async function fetchSuggestions(query: string): Promise<GeoSuggestion[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  try {
    if (/^\d{2,5}$/.test(trimmed)) {
      // Pas de recherche par préfixe de code postal sur geo.api.gouv.fr :
      // on déplie les codes postaux des communes des départements dont le
      // code correspond à la saisie — préfixe (« 97 » → 971…976) ou amorce
      // (« 75001 » → 75, « 20… » → Corse 2A/2B).
      const departements = await $fetch<GeoDepartement[]>(`${GEO_API}/departements`)
      const candidates = departements.filter(
        (d) =>
          d.code.startsWith(trimmed) ||
          trimmed.startsWith(d.code) ||
          (trimmed.startsWith('20') && (d.code === '2A' || d.code === '2B'))
      )
      const communes = (
        await Promise.all(
          candidates.slice(0, MAX_DEPARTEMENT_FETCH).map((d) =>
            $fetch<GeoCommune[]>(`${GEO_API}/departements/${d.code}/communes`, {
              params: { fields: 'nom,codesPostaux,codeDepartement,centre' }
            })
          )
        )
      ).flat()
      const postaux = communes
        .flatMap((commune) =>
          (commune.codesPostaux ?? [])
            .filter((cp) => cp.startsWith(trimmed))
            .map((cp) => codePostalToSuggestion(cp, commune))
        )
        .sort((a, b) => a.term.localeCompare(b.term))
      return dedupeByLabel([
        ...departements.filter((d) => d.code.startsWith(trimmed)).map(departementToSuggestion),
        ...postaux
      ]).slice(0, MAX_SUGGESTIONS)
    }

    const [communes, departements] = await Promise.all([
      $fetch<GeoCommune[]>(`${GEO_API}/communes`, {
        params: {
          nom: trimmed,
          fields: 'nom,codeDepartement,centre',
          boost: 'population',
          limit: 5
        }
      }),
      $fetch<GeoDepartement[]>(`${GEO_API}/departements`, {
        params: { nom: trimmed, limit: 3 }
      })
    ])
    // Villes en premier : c'est l'intention la plus fréquente (« paris »
    // cherche la ville avant le département homonyme).
    return dedupeByLabel([
      ...communes.map(communeToSuggestion),
      ...departements.map(departementToSuggestion)
    ]).slice(0, MAX_SUGGESTIONS)
  } catch {
    // API geo indisponible : la saisie libre continue de fonctionner.
    return []
  }
}

/**
 * Autocomplétion « ville, code postal ou département » sur geo.api.gouv.fr.
 * Debounce 200 ms + garde de séquence : une réponse périmée n'écrase pas
 * les suggestions d'une saisie plus récente. Partagé entre
 * `LocationSuggest` (filtre catalogue, valeur `location`) et la recherche
 * centres de l'accueil (terme `term` → query `q`).
 */
export function useGeoSuggest() {
  const suggestions = ref<GeoSuggestion[]>([])

  let debounce: ReturnType<typeof setTimeout> | null = null
  let requestSeq = 0

  function request(query: string) {
    if (debounce) clearTimeout(debounce)
    const seq = ++requestSeq
    debounce = setTimeout(() => {
      void fetchSuggestions(query).then((results) => {
        if (seq !== requestSeq) return
        suggestions.value = results
      })
    }, 200)
  }

  function reset() {
    suggestions.value = []
  }

  /** Suggestion dont le libellé est exactement `label` (choix datalist). */
  function byLabel(label: string): GeoSuggestion | undefined {
    return suggestions.value.find((s) => s.label === label)
  }

  /** Suggestion dont la valeur de localisation est `location`. */
  function byLocation(location: string): GeoSuggestion | undefined {
    return suggestions.value.find((s) => s.location === location)
  }

  return { suggestions, request, reset, byLabel, byLocation }
}
