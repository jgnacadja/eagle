<template>
  <section class="relative overflow-hidden bg-surface">
    <div
      class="pointer-events-none absolute -top-24 -left-32 h-96 w-96 rounded-full bg-info-soft blur-3xl"
    />
    <div
      class="pointer-events-none absolute -top-10 -right-24 h-80 w-80 rounded-full bg-warning-soft blur-3xl"
    />

    <div class="relative mx-auto max-w-5xl px-6 pb-20 pt-16 text-center md:pt-16">
      <span
        class="inline-block rounded-full border border-rule bg-paper px-4 py-1.5 text-xs font-semibold tracking-wide text-ink-muted"
      >
        Plateforme de conseil en formation professionnelle
      </span>

      <h1 class="mt-6 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
        Vos besoins de formation,<br />
        <span class="text-accent-text">orchestrés</span> de bout en bout.
      </h1>

      <p class="mt-4 font-sans text-base text-ink-muted md:text-lg">
        La bonne formation. Au bon endroit. Au bon moment.
      </p>

      <form class="mx-auto mt-8 max-w-2xl" @submit.prevent>
        <div
          class="flex items-center gap-3 rounded-full border border-rule bg-paper px-5 py-3 shadow-sm focus-within:ring-2 focus-within:ring-outline"
        >
          <svg class="h-4 w-4 shrink-0 text-accent" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M9 2a1 1 0 0 1 1 1v.5a5.5 5.5 0 0 1 4.9 4.9H16a1 1 0 1 1 0 2h-.5a1 1 0 0 1-1-1A4.5 4.5 0 0 0 10 4.5a1 1 0 0 1-1-1V2z"
            />
          </svg>
          <input
            type="text"
            placeholder="« Je dois former 8 salariés au CACES près de Lyon avant septembre »"
            class="flex-1 bg-transparent font-sans text-sm text-ink placeholder:text-ink-placeholder focus:outline-none"
          />
          <button
            type="submit"
            class="shrink-0 rounded-full bg-ink p-2.5 text-paper hover:bg-primary transition"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </form>

      <p class="mx-auto mt-8 max-w-xl text-sm text-ink-muted">
        <span class="font-semibold text-ink">LEARN UP</span>, organisme de formation et de
        recommandation, vous accompagne pour identifier et organiser la formation la plus adaptée à
        vos équipes.
      </p>

      <a
        href="#confier"
        class="mt-3 inline-block text-sm font-semibold text-accent-text hover:text-accent"
      >
        Confier ma formation →
      </a>
    </div>
  </section>
</template>
