<template>
  <div class="flex items-center gap-sm rounded-full border border-outline px-md py-sm">
    <IconMapPin :size="16" class="shrink-0 text-ink-subtle" />
    <input
      :id="inputId"
      v-model="input"
      type="text"
      :list="listId"
      :placeholder="placeholder"
      autocomplete="off"
      class="min-w-0 flex-1 border-0 bg-transparent text-small text-ink-body placeholder:text-ink-placeholder focus:outline-none focus:ring-0"
      @input="onInput"
    />
    <button
      v-if="input"
      type="button"
      class="text-ink-subtle transition-colors hover:text-accent-text"
      aria-label="Effacer la localisation"
      @click="clear()"
    >
      <IconClose :size="14" />
    </button>
    <datalist :id="listId">
      <option v-for="suggestion in suggestions" :key="suggestion.label" :value="suggestion.label" />
    </datalist>
  </div>
</template>

<script setup lang="ts">
import { ref, useId, watch } from 'vue'

const model = defineModel<string | undefined>()
withDefaults(defineProps<{ inputId?: string; placeholder?: string }>(), {
  inputId: undefined,
  placeholder: 'Ville, département, région'
})

interface GeoSuggestion {
  label: string
  value: string
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

const input = ref(model.value ?? '')
const suggestions = ref<GeoSuggestion[]>([])
const listId = `geo-suggest-${useId()}`

// L'input porte le label (« Lyon (69) ») pendant que le modèle reçoit la valeur
// de filtrage (lat,lng ou code département) via cette correspondance.
const valueByLabel = new Map<string, string>()
const labelByValue = new Map<string, string>()

let debounce: ReturnType<typeof setTimeout> | null = null
let requestSeq = 0

watch(model, (value) => {
  const next = (value && labelByValue.get(value)) ?? value ?? ''
  if (next !== input.value) input.value = next
})

function communeToSuggestion(commune: GeoCommune): GeoSuggestion {
  const suffix = commune.codeDepartement ? ` (${commune.codeDepartement})` : ''
  // Centre de la commune → recherche par proximité (rayon) côté API
  const value = commune.centre
    ? `${commune.centre.coordinates[1]},${commune.centre.coordinates[0]}`
    : commune.nom
  return { label: `${commune.nom}${suffix}`, value }
}

function departementToSuggestion(departement: GeoDepartement): GeoSuggestion {
  return { label: `${departement.nom} (${departement.code})`, value: departement.code }
}

async function fetchSuggestions(query: string): Promise<GeoSuggestion[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  try {
    if (/^\d{5}$/.test(trimmed)) {
      const communes = await $fetch<GeoCommune[]>(`${GEO_API}/communes`, {
        params: { codePostal: trimmed, fields: 'nom,codeDepartement,centre', limit: 6 }
      })
      return communes.map(communeToSuggestion)
    }

    if (/^\d{1,2}$/.test(trimmed)) {
      const departements = await $fetch<GeoDepartement[]>(`${GEO_API}/departements`, {
        params: { code: trimmed }
      })
      return departements.map(departementToSuggestion)
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
    return [
      ...departements.map(departementToSuggestion),
      ...communes.map(communeToSuggestion)
    ].slice(0, 7)
  } catch {
    // API geo indisponible : la saisie libre continue de fonctionner.
    return []
  }
}

function onInput() {
  model.value = valueByLabel.get(input.value) ?? (input.value || undefined)

  if (debounce) clearTimeout(debounce)
  const query = input.value
  const seq = ++requestSeq
  debounce = setTimeout(() => {
    void fetchSuggestions(query).then((results) => {
      if (seq !== requestSeq) return
      suggestions.value = results
      valueByLabel.clear()
      labelByValue.clear()
      for (const suggestion of results) {
        valueByLabel.set(suggestion.label, suggestion.value)
        labelByValue.set(suggestion.value, suggestion.label)
      }
    })
  }, 200)
}

function clear() {
  input.value = ''
  model.value = undefined
}
</script>
