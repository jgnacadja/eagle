import { ref } from 'vue'

/**
 * Suggestion géographique issue de geo.api.gouv.fr.
 */
export interface GeoSuggestion {
  /** Libellé affiché dans la liste — « Lyon (69) », « Rhône (69) ». */
  label: string
  /**
   * Valeur de localisation catalogue : « lat,lng » pour une commune
   * (recherche par rayon côté API), code INSEE pour un département.
   */
  location: string
  /**
   * Terme de recherche texte — le nom seul (« Lyon », « Rhône »). Utilisé
   * pour la recherche centres (`?q=`), qui matche par sous-chaîne et non
   * par coordonnées.
   */
  term: string
  /** Nature de la suggestion — un département pré-remplit le filtre territoire. */
  kind: 'commune' | 'department'
}

interface GeoCommune {
  nom: string
  codeDepartement?: string
  centre?: { coordinates: [number, number] }
}

interface GeoDepartement {
  code: string
  nom: string
}

const GEO_API = 'https://geo.api.gouv.fr'

function communeToSuggestion(commune: GeoCommune): GeoSuggestion {
  const suffix = commune.codeDepartement ? ` (${commune.codeDepartement})` : ''
  // Centre de la commune → recherche par proximité (rayon) côté API catalogue.
  const location = commune.centre
    ? `${commune.centre.coordinates[1]},${commune.centre.coordinates[0]}`
    : commune.nom
  return { label: `${commune.nom}${suffix}`, location, term: commune.nom, kind: 'commune' }
}

function departementToSuggestion(departement: GeoDepartement): GeoSuggestion {
  return {
    label: `${departement.nom} (${departement.code})`,
    location: departement.code,
    term: departement.nom,
    kind: 'department'
  }
}

/**
 * Dédup sur le libellé : « Paris (75) » sort à la fois en département et en
 * commune — le département (listé en premier) est conservé, le terme de
 * recherche est identique dans les deux cas.
 */
function dedupeByLabel(suggestions: GeoSuggestion[]): GeoSuggestion[] {
  const seen = new Set<string>()
  return suggestions.filter((s) => (seen.has(s.label) ? false : (seen.add(s.label), true)))
}

async function fetchSuggestions(query: string): Promise<GeoSuggestion[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  try {
    if (/^\d{5}$/.test(trimmed)) {
      const communes = await $fetch<GeoCommune[]>(`${GEO_API}/communes`, {
        params: { codePostal: trimmed, fields: 'nom,codeDepartement,centre', limit: 6 }
      })
      return dedupeByLabel(communes.map(communeToSuggestion))
    }

    if (/^\d{1,2}$/.test(trimmed)) {
      const departements = await $fetch<GeoDepartement[]>(`${GEO_API}/departements`, {
        params: { code: trimmed }
      })
      return dedupeByLabel(departements.map(departementToSuggestion))
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
    return dedupeByLabel([
      ...departements.map(departementToSuggestion),
      ...communes.map(communeToSuggestion)
    ]).slice(0, 7)
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
