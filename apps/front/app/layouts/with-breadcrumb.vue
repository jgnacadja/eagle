<template>
  <div class="flex min-h-screen flex-col bg-paper">
    <AppHeader />
    <main class="flex flex-1 flex-col">
      <section v-if="items?.length" class="border-b border-rule" :class="color">
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

// layoutProps de definePageMeta n'est pas câblé à <NuxtLayout> : on lit la
// couleur directement dans route.meta pour que la bande suive la page.
const color = computed(() => {
  const layoutProps = route.meta.layoutProps as { color?: string } | undefined
  return layoutProps?.color ?? 'bg-surface'
})

const items = computed<BreadcrumbItem[] | undefined>(() =>
  Array.isArray(route.meta.breadcrumb) ? (route.meta.breadcrumb as BreadcrumbItem[]) : undefined
)
</script>
