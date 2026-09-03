<template>
  <section class="mx-auto max-w-5xl px-6 pb-20">
    <p class="text-center text-sm font-bold tracking-wide text-accent-text">Comment ça marche</p>

    <ol class="relative mt-10 grid gap-10 md:grid-cols-4">
      <div
        class="absolute top-5 left-[12.5%] right-[12.5%] hidden h-px bg-rule md:block"
        aria-hidden="true"
      />

      <li
        v-for="step in steps"
        :key="step.number"
        class="relative flex flex-col items-center text-center"
      >
        <span
          class="z-10 flex h-10 w-10 items-center justify-center rounded-full font-sans text-sm font-bold text-paper"
          :class="step.number === 4 ? 'bg-success' : 'bg-ink'"
        >
          {{ step.number }}
        </span>
        <h3 class="mt-4 font-sans font-semibold text-ink">{{ step.title }}</h3>
        <p class="mt-1 text-sm text-ink-muted">{{ step.body }}</p>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
const steps = [
  { number: 1, title: 'Décrivez votre besoin', body: 'en une phrase, avec vos mots' },
  {
    number: 2,
    title: 'Recevez la solution',
    body: 'formation, centre et dates identifiés près de vos équipes'
  },
  { number: 3, title: 'Validez la session', body: 'demande envoyée, prise en charge sécurisée' },
  { number: 4, title: 'Formez vos équipes', body: "accompagnement jusqu'aux attestations" }
]
</script>
