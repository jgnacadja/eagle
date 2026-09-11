<template>
  <Card
    class="flex flex-col hover:shadow-md duration-500 hover:z-5 hover:scale-[1.03] transition-all"
  >
    <CardHeader class="space-y-sm p-md pb-0">
      <p v-if="eyebrow" class="mb-md text-overline text-ink-subtle font-bold">{{ eyebrow }}</p>
      <p class="text-overline text-accent-text uppercase">{{ family }}</p>
      <CardTitle class="font-sans text-h4 font-extrabold leading-tight tracking-normal text-ink">
        {{ title }}
      </CardTitle>
    </CardHeader>
    <CardContent class="flex-1 px-md py-sm">
      <p v-if="description" class="hidden flex-1 text-small text-ink-body lg:block font-bold">
        {{ description }}
      </p>
      <CardDescription class="font-bold">{{ meta }}</CardDescription>
    </CardContent>
    <CardFooter class="flex flex-col items-start px-md pb-md pt-sm">
      <Badge v-if="status" :variant="status.type" class="w-fit flex justify-center items-center">
        <span
          v-if="status.type !== 'warning'"
          class="h-sm w-sm rounded-full bg-current p-1"
          aria-hidden="true"
        />
        <span v-else aria-hidden="true">▲</span>
        {{ status.label }}
      </Badge>
      <Button
        v-if="to && variant === 'button'"
        as-child
        class="mt-md h-control w-full rounded-full px-lg text-small font-bold hover:bg-primary-dark"
      >
        <NuxtLink :to="to">Voir la formation</NuxtLink>
      </Button>
      <Button
        v-else-if="to"
        as-child
        variant="link"
        class="mt-md h-auto self-end p-0 text-small font-bold text-primary transition-colors hover:text-accent-text"
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
    eyebrow?: string
    variant?: 'default' | 'button'
  }>(),
  { to: undefined, description: '', status: undefined, eyebrow: '', variant: 'default' }
)
</script>
