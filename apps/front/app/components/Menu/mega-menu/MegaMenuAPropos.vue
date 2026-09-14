<template>
  <div class="grid w-full grid-cols-2 gap-lg px-gutter-mobile py-lg md:px-gutter">
    <div>
      <h3 class="text-small font-semibold text-ink-muted">Learn Up Academy</h3>
      <ul class="mt-sm space-y-2">
        <li v-for="lien in aproposLiens" :key="lien.slug">
          <NuxtLink
            :to="`/${lien.slug}`"
            class="block rounded-md px-2 py-1.5 text-primary transition-colors hover:text-accent-text"
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
            :to="`/${lien.slug}`"
            class="block rounded-md px-2 py-1.5 text-body text-primary transition-colors hover:text-accent-text"
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
import { aproposLiens } from '~/data/navigation'
import { useMenuLegalPages } from '~/composables/useMenuData'

defineEmits<{ close: [] }>()

const legalLiens = useMenuLegalPages()
</script>
