<template>
  <!-- É2 — analyse en cours : première réponse rapide puis affichage
       progressif (§41). Le texte est annoncé par la zone aria-live du fil. -->
  <div>
    <p class="text-small text-ink-body md:text-body">Analyse de votre besoin…</p>
    <div class="mt-sm flex max-w-prose flex-col gap-sm" aria-hidden="true">
      <span class="block h-sm w-full animate-pulse rounded-full bg-surface-alt" />
      <span class="block h-sm w-4/5 animate-pulse rounded-full bg-surface-alt" />
      <span class="block h-sm w-1/2 animate-pulse rounded-full bg-accent-soft" />
    </div>
  </div>
</template>
