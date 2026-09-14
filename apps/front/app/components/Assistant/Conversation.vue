<template>
  <div class="flex h-full flex-col bg-paper">
    <!-- En-tête -->
    <header class="flex items-center justify-between gap-sm border-b border-rule px-lg py-md">
      <h2 class="flex items-center gap-sm text-small font-semibold text-ink">
        <IconSparkle :size="18" class="text-accent" aria-hidden="true" />
        Recherche assistée
      </h2>
      <div class="flex items-center gap-md">
        <Button
          variant="outline"
          class="flex items-center gap-xs rounded-full border-rule px-md py-xs text-meta font-semibold text-ink hover:border-primary hover:text-accent-text"
          @click="$emit('reset')"
        >
          <IconPlus :size="14" aria-hidden="true" />
          Nouvelle recherche
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fermer la recherche assistée"
          class="h-lg w-lg rounded-full text-ink-subtle hover:text-ink"
          @click="$emit('close')"
        >
          <IconClose :size="16" aria-hidden="true" />
        </Button>
      </div>
    </header>

    <!-- Contexte agrégé (E11) : filet pleine largeur, contenu centre -->
    <div v-if="contextChips.length" class="border-b border-rule px-lg py-sm text-meta">
      <div
        class="mx-auto flex w-full max-w-[calc(var(--spacing-container)*0.8)] flex-wrap items-center justify-between gap-sm"
      >
        <div class="flex flex-wrap items-center gap-sm">
          <span class="font-semibold uppercase tracking-wide text-ink-subtle">Contexte</span>
          <Badge v-for="chip in contextChips" :key="chip" variant="outline">
            {{ chip }}
          </Badge>
        </div>
        <Button
          variant="link"
          class="h-auto p-0 font-semibold text-primary hover:text-accent-text"
          @click="focusInput"
        >
          Modifier mon besoin
        </Button>
      </div>
    </div>

    <!-- Fil de conversation : colonne centree a largeur maximale -->
    <div
      class="mx-auto flex w-full max-w-[calc(var(--spacing-container)*0.8)] flex-1 flex-col gap-lg overflow-y-auto px-lg py-lg"
    >
      <template v-for="(entry, i) in entries" :key="entry.id ?? i">
        <!-- Bulle utilisateur -->
        <div v-if="entry.role === 'user'" class="flex justify-end">
          <form
            v-if="editingId && entry.id === editingId"
            class="flex w-full max-w-[85%] items-center gap-xs"
            @submit.prevent="submitEdit(entry)"
          >
            <Input
              v-model="editDraft"
              type="text"
              aria-label="Modifier votre message"
              class="h-control flex-1 rounded-lg border-rule bg-paper px-md text-small text-ink shadow-none focus-visible:ring-2 focus-visible:ring-outline-soft"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Envoyer la modification"
              class="h-control w-control shrink-0 rounded-full bg-primary text-paper hover:bg-primary-dark"
            >
              <IconCheck :size="16" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Annuler la modification"
              class="h-control w-control shrink-0 rounded-full text-ink-subtle hover:text-ink"
              @click="cancelEdit"
            >
              <IconClose :size="16" />
            </Button>
          </form>
          <div v-else class="flex max-w-[85%] flex-col items-end gap-xs">
            <p class="w-full rounded-lg rounded-tr-sm bg-surface px-md py-sm text-small text-ink">
              {{ entry.content }}
            </p>
            <Button
              v-if="entry.id && !pending"
              variant="link"
              class="h-auto p-0 text-meta font-semibold text-ink-subtle hover:text-primary"
              @click="startEdit(entry)"
            >
              Modifier
            </Button>
          </div>
        </div>

        <!-- Réponse assistant -->
        <div v-else class="flex gap-sm">
          <span
            class="mt-xs flex h-lg w-lg shrink-0 items-center justify-center rounded-full bg-primary text-accent"
            aria-hidden="true"
          >
            <IconSparkle :size="12" />
          </span>
          <div class="min-w-0 flex-1">
            <p
              class="text-small text-ink-body"
              :class="{
                'font-semibold text-ink':
                  entry.reply?.kind === 'no_results' || entry.reply?.kind === 'out_of_catalog'
              }"
            >
              {{ entry.content }}
            </p>

            <template v-if="entry.reply?.kind === 'clarify'">
              <p v-if="entry.reply.question" class="mt-sm text-small font-semibold text-ink">
                {{ entry.reply.question }}
              </p>
              <ul v-if="entry.reply.suggestions?.length" class="mt-md flex flex-wrap gap-sm">
                <li v-for="suggestion in entry.reply.suggestions" :key="suggestion">
                  <Button
                    variant="outline"
                    class="rounded-full border-rule px-md py-sm text-meta font-medium text-ink-muted hover:border-primary hover:text-primary"
                    @click="$emit('send', suggestion)"
                  >
                    {{ suggestion }}
                  </Button>
                </li>
              </ul>
            </template>

            <template v-else-if="entry.reply?.kind === 'recommend'">
              <p class="mt-sm text-small font-semibold text-ink">Nous vous recommandons</p>
              <div class="mt-md space-y-md">
                <AssistantRecommendationCard
                  v-for="rec in primaryRecs(entry)"
                  :key="rec.slug"
                  :recommendation="rec"
                  :demande-to="demandeTo(rec)"
                  :advisor-to="advisorTo"
                />
                <div v-if="alternativeRecs(entry).length" class="grid gap-md sm:grid-cols-2">
                  <AssistantRecommendationCard
                    v-for="rec in alternativeRecs(entry)"
                    :key="rec.slug"
                    :recommendation="rec"
                    :demande-to="demandeTo(rec)"
                    compact
                  />
                </div>
              </div>
              <p v-if="(entry.reply.recommendations?.length ?? 0) > 1" class="mt-md text-meta">
                <Button
                  variant="link"
                  class="h-auto p-0 font-semibold text-primary underline underline-offset-2 hover:text-accent-text"
                  @click="toggleCompare(i)"
                >
                  Comparer ces {{ entry.reply.recommendations?.length }} formations
                </Button>
                ·
                <NuxtLink
                  :to="advisorTo"
                  class="font-semibold text-primary underline underline-offset-2 transition-colors hover:text-accent-text"
                >
                  Être accompagné par un conseiller
                </NuxtLink>
              </p>
              <AssistantCompareTable
                v-if="compareOpen.has(i) && (entry.reply.recommendations?.length ?? 0) > 1"
                :recommendations="entry.reply.recommendations ?? []"
                :need-summary="needSummary"
                :advisor-to="advisorTo"
                class="mt-md"
              />
              <p class="mt-md text-meta text-ink-subtle">{{ provenanceNote(entry) }}</p>
            </template>

            <template v-else-if="entry.reply?.kind === 'no_results'">
              <ul class="mt-md grid gap-sm sm:grid-cols-2">
                <li>
                  <Button
                    variant="outline"
                    class="w-full gap-sm rounded-full border-rule px-md py-sm text-meta font-semibold text-ink hover:border-primary"
                    @click="focusInput"
                  >
                    <IconRefresh :size="14" class="shrink-0 text-primary" aria-hidden="true" />
                    Reformuler mon besoin
                  </Button>
                </li>
                <li>
                  <Button
                    as-child
                    variant="outline"
                    class="w-full gap-sm rounded-full border-rule px-md py-sm text-meta font-semibold text-ink hover:border-primary"
                  >
                    <NuxtLink to="/formations">
                      <IconBook :size="14" class="shrink-0 text-primary" aria-hidden="true" />
                      Consulter le catalogue
                    </NuxtLink>
                  </Button>
                </li>
                <li>
                  <Button
                    as-child
                    variant="outline"
                    class="w-full gap-sm rounded-full border-rule px-md py-sm text-meta font-semibold text-ink hover:border-primary"
                  >
                    <NuxtLink :to="advisorTo">
                      <IconMessages :size="14" class="shrink-0 text-primary" aria-hidden="true" />
                      Parler à un conseiller
                    </NuxtLink>
                  </Button>
                </li>
                <li>
                  <Button
                    as-child
                    class="w-full gap-sm rounded-full bg-accent px-md py-sm text-meta font-semibold text-ink hover:bg-accent-text hover:text-paper"
                  >
                    <NuxtLink :to="demandeBaseTo">
                      <IconPlus :size="14" class="shrink-0" aria-hidden="true" />
                      Faire une demande personnalisée
                    </NuxtLink>
                  </Button>
                </li>
              </ul>
            </template>

            <template v-else-if="entry.reply?.kind === 'out_of_catalog'">
              <div class="mt-md flex flex-wrap gap-md">
                <Button
                  as-child
                  class="rounded-full bg-accent px-md py-sm text-meta font-semibold text-ink hover:bg-accent-text hover:text-paper"
                >
                  <NuxtLink :to="advisorTo">Décrire mon besoin à un conseiller</NuxtLink>
                </Button>
                <Button
                  as-child
                  variant="outline"
                  class="rounded-full border-rule px-md py-sm text-meta font-semibold text-ink hover:border-primary"
                >
                  <NuxtLink to="/formations">Voir le catalogue</NuxtLink>
                </Button>
              </div>
            </template>
          </div>
        </div>
      </template>

      <!-- Analyse en cours (E2) — squelette type catalogue -->
      <output v-if="pending" class="flex gap-sm" aria-live="polite">
        <span
          class="mt-xs flex h-lg w-lg shrink-0 items-center justify-center rounded-full bg-primary text-accent"
          aria-hidden="true"
        >
          <IconSparkle :size="12" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-small font-medium text-ink-muted">Analyse de votre besoin…</p>
          <div class="mt-md flex flex-col gap-sm" aria-hidden="true">
            <span class="h-xs w-full animate-pulse rounded-full bg-surface" />
            <span class="h-xs w-3/4 animate-pulse rounded-full bg-surface" />
            <span class="h-xs w-1/2 animate-pulse rounded-full bg-accent/30" />
          </div>
          <Button
            variant="outline"
            class="mt-md w-fit rounded-full border-rule px-md py-xs text-meta font-semibold text-ink hover:border-primary hover:text-primary"
            @click="$emit('stop')"
          >
            Arrêter la réponse
          </Button>
        </div>
      </output>

      <!-- Indisponible (E9) -->
      <div
        v-if="unavailable"
        class="flex flex-col items-center gap-md rounded-md border border-rule bg-surface-soft p-xl text-center"
      >
        <span
          class="flex h-2xl w-2xl items-center justify-center rounded-full bg-accent-soft text-accent-text"
          aria-hidden="true"
        >
          <IconAlertTriangle :size="20" />
        </span>
        <div>
          <h3 class="text-small font-bold text-ink">
            La recherche assistée est momentanément indisponible.
          </h3>
          <p class="mt-sm text-meta text-ink-muted">
            Vous pouvez réessayer dans quelques instants. Le catalogue reste accessible pour
            rechercher une formation.
          </p>
        </div>
        <div class="flex w-full flex-col gap-sm sm:flex-row">
          <Button
            class="h-control flex-1 gap-sm rounded-full bg-primary px-md text-meta font-semibold text-paper hover:bg-primary-dark"
            @click="$emit('retry')"
          >
            <IconRefresh :size="14" aria-hidden="true" />
            Réessayer
          </Button>
          <Button
            as-child
            variant="outline"
            class="h-control flex-1 rounded-full border-rule px-md text-meta font-semibold text-ink hover:border-primary"
          >
            <NuxtLink :to="advisorTo">Parler à un conseiller</NuxtLink>
          </Button>
        </div>
      </div>
      <div ref="threadEnd" aria-hidden="true" />
    </div>

    <!-- Saisie : champ pilule + bouton envoyer détaché, filet en haut -->
    <div class="border-t border-rule px-lg py-md">
      <form
        class="mx-auto flex w-full max-w-[calc(var(--spacing-container)*0.8)] items-center gap-sm"
        @submit.prevent="submit"
      >
        <label :for="inputId" class="sr-only">Répondre ou décrire votre besoin</label>
        <Input
          :id="inputId"
          v-model="draft"
          type="text"
          :placeholder="entries.length ? 'Ou répondez librement…' : 'Décrivez votre besoin…'"
          :disabled="pending"
          class="h-control flex-1 rounded-full border-rule bg-paper px-md text-small text-ink shadow-none placeholder:text-ink-placeholder focus-visible:ring-2 focus-visible:ring-outline-soft disabled:cursor-not-allowed disabled:opacity-80"
        />
        <Button
          type="submit"
          size="icon"
          :disabled="pending"
          aria-label="Envoyer"
          class="h-control w-control shrink-0 rounded-full bg-primary text-paper hover:bg-primary-dark disabled:opacity-60"
        >
          <IconChevronRight :size="16" />
        </Button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue'
import type { AssistantRecommendation } from '@learnup/types'
import type { AssistantEntry } from '~/composables/useAssistant'
import AssistantCompareTable from '~/components/Assistant/CompareTable.vue'
import AssistantRecommendationCard from '~/components/Assistant/RecommendationCard.vue'

const props = defineProps<{
  entries: AssistantEntry[]
  pending: boolean
  unavailable: boolean
  contextChips: string[]
  /** Besoin agrégé (messages utilisateur) — transmis à la demande. */
  needSummary: string
  /** Créneaux extraits (effectif, lieu) pour pré-remplir la demande. */
  headcount?: number
  location?: string
}>()

const emit = defineEmits<{
  send: [value: string]
  edit: [id: string, value: string]
  stop: []
  retry: []
  reset: []
  close: []
}>()

const inputId = useId()
const draft = ref('')
const editingId = ref<string>()
const editDraft = ref('')
const compareOpen = ref(new Set<number>())
const threadEnd = ref<HTMLElement>()

// Chaque nouveau message ou état d'analyse ramène la vue en fin de fil.
watch(
  () => [props.entries.length, props.pending],
  async () => {
    await nextTick()
    threadEnd.value?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }
)

const advisorTo = '/centres/demande-de-formation?sujet=conseiller'
const demandeBaseTo = '/centres/demande-de-formation'

function toggleCompare(index: number) {
  const next = new Set(compareOpen.value)
  if (next.has(index)) next.delete(index)
  else next.add(index)
  compareOpen.value = next
}

// E4 : la principale pleine largeur, les alternatives compactes en 2 colonnes.
function primaryRecs(entry: AssistantEntry): AssistantRecommendation[] {
  const recs = entry.reply?.recommendations ?? []
  return recs.filter((r) => r.rank === 'primary').length
    ? recs.filter((r) => r.rank === 'primary')
    : recs.slice(0, 1)
}

function alternativeRecs(entry: AssistantEntry): AssistantRecommendation[] {
  const recs = entry.reply?.recommendations ?? []
  return recs.filter((r) => !primaryRecs(entry).includes(r))
}

// E4/E5 — note de provenance sous le bloc recommandation.
function provenanceNote(entry: AssistantEntry): string {
  const hasSession = (entry.reply?.recommendations ?? []).some((r) => r.availability)
  return hasSession
    ? 'Session et disponibilité issues du référentiel — aucune disponibilité estimée.'
    : 'Recommandations issues des formations publiées du catalogue LEARN UP.'
}

function demandeTo(rec: AssistantRecommendation): string {
  const params = new URLSearchParams()
  if (rec.familySlug) params.set('famille', rec.familySlug)
  params.set('formation', rec.slug)
  if (rec.availability?.sessionId) params.set('session', rec.availability.sessionId)
  if (props.needSummary) params.set('besoin', props.needSummary)
  if (props.headcount) params.set('salaries', String(props.headcount))
  if (props.location) params.set('lieu', props.location)
  return `/centres/demande-de-formation?${params.toString()}`
}

function submit() {
  const text = draft.value.trim()
  if (!text || props.pending) return
  draft.value = ''
  emit('send', text)
}

function startEdit(entry: AssistantEntry) {
  if (!entry.id) return
  editingId.value = entry.id
  editDraft.value = entry.content
}

function cancelEdit() {
  editingId.value = undefined
  editDraft.value = ''
}

function submitEdit(entry: AssistantEntry) {
  const text = editDraft.value.trim()
  if (!entry.id || !text) return
  emit('edit', entry.id, text)
  compareOpen.value = new Set()
  cancelEdit()
}

function focusInput() {
  document.getElementById(inputId)?.focus()
}
</script>
