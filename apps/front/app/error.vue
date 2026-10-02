<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center"
  >
    <h1 class="font-display text-5xl font-bold text-ink">{{ error?.statusCode ?? 404 }}</h1>
    <p class="font-sans text-ink-muted">
      {{ error?.statusMessage || 'Page introuvable.' }}
    </p>
    <Button size="pill-sm" @click="handleClear">Retour à l'accueil</Button>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error?: NuxtError }>()

function handleClear() {
  clearError({ redirect: '/' })
}
</script>
