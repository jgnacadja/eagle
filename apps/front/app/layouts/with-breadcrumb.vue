<template>
  <div class="flex min-h-screen flex-col bg-paper">
    <AppHeader />
    <main class="flex flex-1 flex-col">
      <section v-if="items?.length" class="border-b border-rule bg-surface">
        <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter py-md">
          <Breadcrumbs :items="items" />
        </div>
      </section>
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface BreadcrumbItem {
  label: string
  to?: string
}

const route = useRoute()

const items = computed<BreadcrumbItem[] | undefined>(() =>
  Array.isArray(route.meta.breadcrumb) ? (route.meta.breadcrumb as BreadcrumbItem[]) : undefined
)
</script>
