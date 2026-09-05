<template>
  <Card class="flex flex-col rounded-md">
    <CardHeader class="space-y-sm p-md pb-0">
      <p class="text-overline text-accent-text uppercase">{{ family }}</p>
      <CardTitle class="font-sans text-h4 font-semibold leading-tight tracking-normal text-ink">
        {{ title }}
      </CardTitle>
    </CardHeader>
    <CardContent class="flex-1 px-md py-sm">
      <p v-if="description" class="hidden flex-1 text-small text-ink-body lg:block">
        {{ description }}
      </p>
      <CardDescription class="mt-sm">{{ meta }}</CardDescription>
    </CardContent>
    <CardFooter class="flex items-center justify-between px-md pb-md pt-sm">
      <Badge v-if="status" :variant="status.type">
        <span
          v-if="status.type !== 'warning'"
          class="h-sm w-sm rounded-full bg-current"
          aria-hidden="true"
        />
        <span v-else aria-hidden="true">▲</span>
        {{ status.label }}
      </Badge>
      <Button
        as-child
        variant="link"
        class="h-auto p-0 text-small font-bold text-primary hover:text-ink hover:no-underline"
      >
        <NuxtLink :to="to">Voir la formation →</NuxtLink>
      </Button>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    family: string
    title: string
    description?: string
    meta: string
    status?: { type: 'success' | 'warning' | 'neutral'; label: string }
    to?: string
  }>(),
  { to: '#', description: '', status: undefined }
)
</script>
