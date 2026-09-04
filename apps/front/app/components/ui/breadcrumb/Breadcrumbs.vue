<template>
  <Breadcrumb>
    <BreadcrumbList>
      <template v-for="(item, index) in items" :key="item.label">
        <BreadcrumbItem>
          <template v-if="index === items.length - 1">
            <BreadcrumbPage>{{ item.label }}</BreadcrumbPage>
          </template>
          <BreadcrumbLink v-else as-child>
            <NuxtLink :to="item.to">{{ item.label }}</NuxtLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator v-if="index < items.length - 1" />
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>

<script setup lang="ts">
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

interface BreadcrumbRouteItem {
  label: string
  to?: string
}

defineProps<{
  items: BreadcrumbRouteItem[]
}>()
</script>
