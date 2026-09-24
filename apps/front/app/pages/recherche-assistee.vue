<template>
  <div class="flex flex-1 flex-col">
    <AssistantShell @close="navigation.close()" @reset="startNewSearch" />

    <section class="relative flex-1 overflow-hidden bg-linear-to-b from-paper to-surface">
      <div
        class="pointer-events-none absolute -bottom-44 -left-32 h-96 w-96 rounded-full bg-primary/5"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -right-36 -top-32 h-96 w-96 rounded-full bg-accent/5"
        aria-hidden="true"
      />

      <div
        class="relative mx-auto max-w-prose px-gutter-mobile py-3xl text-center md:px-gutter md:py-4xl"
      >
        <span
          class="inline-block rounded-full border border-primary/25 bg-paper px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary shadow-xs md:text-small"
        >
          Recherche assistée
        </span>

        <h1
          class="mt-4 font-display text-h2 font-extrabold leading-tight text-ink md:mt-5 md:text-h1"
        >
          Vous décrivez votre besoin. LEARN UP vous aide à trouver la bonne formation.
        </h1>

        <p class="mx-auto mt-3 max-w-prose text-small text-ink-muted md:mt-4 md:text-body">
          Formulez votre besoin librement : métier, population, obligation réglementaire, ville,
          effectif… Les recommandations proviennent uniquement des formations publiées du catalogue.
        </p>

        <AssistantSearchBar
          :key="sessionKey"
          v-model="query"
          class="mt-6 md:mt-8"
          input-id="assistant-search"
          size="hero"
          @submit="onSubmit"
        />

        <!-- Les deux parcours coexistent : le lien catalogue reste visible
             sans concurrencer le champ (§2). -->
        <p class="mt-lg text-small text-ink-muted">
          Vous savez déjà ce que vous cherchez&nbsp;?
          <NuxtLink
            to="/formations"
            class="font-bold text-primary underline underline-offset-4 transition-colors hover:text-accent-text"
          >
            Consulter le catalogue
          </NuxtLink>
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAssistantNavigation } from '~/composables/useAssistantNavigation'
import { assistantRoute, readAssistantQuery } from '~/utils/assistant-route'

definePageMeta({ layout: 'assistant' })

// Page dynamique et paramétrée, sans valeur SEO propre : noindex + follow
// (les fiches formations recommandées restent indexées), pas de canonical,
// exclue du sitemap (ticket [SEO] sitemap). La Home garde le champ d'entrée
// et son indexation.
useSeoMeta({
  title: 'Recherche assistée — LEARN UP ACADEMY',
  description:
    'Décrivez votre besoin de formation en langage naturel : LEARN UP vous recommande les formations du catalogue adaptées à votre situation.',
  robots: 'noindex, follow'
})

const route = useRoute()
const navigation = useAssistantNavigation()

const query = ref(readAssistantQuery(route.query))
const sessionKey = ref(0)

// Deep-link / retour arrière : la requête de l'URL reste la source de vérité
// de l'entrée.
watch(
  () => readAssistantQuery(route.query),
  (value) => {
    query.value = value
  }
)

// L'entrée validée est reflétée dans l'URL (deep-link partageable) en
// remplaçant l'entrée courante : les échanges suivants n'y toucheront plus.
async function onSubmit(value: string): Promise<void> {
  query.value = value
  if (value === readAssistantQuery(route.query)) return
  await navigateTo(assistantRoute(value), { replace: true })
}

async function startNewSearch(): Promise<void> {
  query.value = ''
  sessionKey.value += 1
  await navigation.reset()
}
</script>
