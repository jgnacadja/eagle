<template>
  <div class="flex flex-col items-center gap-lg py-lg text-center">
    <p
      class="flex h-4xl w-4xl items-center justify-center rounded-full bg-success-soft text-success"
    >
      <IconCheck :size="32" />
    </p>
    <DialogTitle class="text-h3">Votre candidature est transmise</DialogTitle>
    <DialogDescription class="max-w-prose text-body">
      L'équipe développement du réseau étudie votre projet «&nbsp;<strong
        class="font-semibold text-ink"
        >{{ projet }}</strong
      >&nbsp;» et vous recontacte sous 5 jours ouvrés.
    </DialogDescription>
    <div class="flex flex-wrap justify-center gap-md">
      <Button as-child variant="dark" size="pill-lg">
        <NuxtLink to="/">Retour à l'accueil</NuxtLink>
      </Button>
      <Button as-child variant="outline" size="pill-lg">
        <NuxtLink to="/actualites">Découvrir les actualités du réseau</NuxtLink>
      </Button>
    </div>
    <p class="text-meta text-ink-subtle leading-relaxed">
      Accusé de réception par e-mail avec le récapitulatif de la candidature. Voie, territoire et
      projet transmis à l'équipe développement — circuit interne non exposé.
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** Récapitulatif affiché : « Ouvrir un centre — Créteil (94) ». */
  projet: string
}>()
</script>
