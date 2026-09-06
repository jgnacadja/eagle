<template>
  <div class="grid w-full grid-cols-2 gap-lg p-lg">
    <div>
      <h3 class="text-small font-semibold text-ink-muted">Learn Up Academy</h3>
      <ul class="mt-sm space-y-2">
        <li v-for="lien in aproposLiens" :key="lien.slug">
          <NuxtLink
            :to="`/a-propos/${lien.slug}`"
            class="block rounded-md px-2 py-1.5 text-primary transition-colors hover:bg-surface hover:text-ink"
            @click="$emit('close')"
          >
            <span class="block text-body font-medium">{{ lien.label }}</span>
            <span class="block text-small text-ink-muted">{{ lien.description }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <div class="border-l border-rule pl-lg">
      <h3 class="text-small font-semibold text-ink-muted">Informations légales</h3>
      <ul class="mt-sm space-y-1">
        <li v-for="lien in legalLiens" :key="lien.slug">
          <NuxtLink
            :to="`/legal/${lien.slug}`"
            class="block rounded-md px-2 py-1.5 text-body text-primary transition-colors hover:bg-surface hover:text-ink"
            @click="$emit('close')"
          >
            {{ lien.label }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { aproposLiens, legalLiens } from '~/data/navigation'

defineEmits<{ close: [] }>()
</script>
