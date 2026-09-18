<template>
  <div class="mega-menu-panel grid w-full grid-cols-4 gap-lg px-gutter-mobile py-lg md:px-gutter">
    <div class="col-span-3">
      <h3 class="text-small font-semibold uppercase text-ink-muted">Learn Up Academy</h3>
      <ul class="mt-md space-y-2">
        <li v-for="lien in aproposLiens" :key="lien.slug">
          <NuxtLink
            :to="`/${lien.slug}`"
            class="group block w-full rounded-md px-md py-3 transition-colors hover:bg-surface"
            @click="$emit('close')"
          >
            <span
              class="block text-body font-bold text-ink transition-colors group-hover:text-primary"
            >
              {{ lien.label }}
            </span>
            <span class="mt-0.5 block text-small text-ink-muted">
              {{ lien.description }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <div class="col-span-1 border-l border-rule pl-lg">
      <h3 class="text-small font-semibold uppercase text-ink-muted">Informations légales</h3>
      <ul class="mt-md space-y-3">
        <li v-for="lien in legalLiens" :key="lien.slug">
          <NuxtLink
            :to="`/${lien.slug}`"
            class="block text-body font-medium text-ink transition-colors hover:text-accent-text"
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
