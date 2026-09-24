<template>
  <!-- Réponse du moteur : avatar étincelle (jamais robot/cerveau) + contenu. -->
  <div class="flex items-start gap-sm md:gap-md">
    <span
      class="flex h-xl w-xl shrink-0 items-center justify-center rounded-full bg-primary text-paper"
      aria-hidden="true"
    >
      <IconSparkle :size="16" />
    </span>
    <div class="min-w-0 flex-1 pt-xs">
      <span class="sr-only">Recherche assistée : </span>
      <slot />
    </div>
  </div>
</template>
