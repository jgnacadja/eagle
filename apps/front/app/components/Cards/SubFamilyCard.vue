<template>
  <Card
    variant="panel"
    class="flex h-full flex-col gap-md p-lg transition hover:border-primary/40 hover:shadow-md"
  >
    <div>
      <h3 class="font-semibold text-ink">{{ name }}</h3>
      <p v-if="caption" class="mt-xs text-small text-ink-muted">{{ caption }}</p>
    </div>
    <Button
      variant="link"
      size="inline"
      class="mt-auto gap-xs self-start font-bold"
      @click="$emit('select')"
    >
      {{ actionLabel }} <span class="link-arrow">→</span>
    </Button>
  </Card>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string
    caption?: string | null
    actionLabel?: string
  }>(),
  { caption: null, actionLabel: 'Voir la sous-famille' }
)

defineEmits<{ select: [] }>()
</script>
