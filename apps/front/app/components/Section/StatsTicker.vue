<template>
  <div class="overflow-hidden bg-primary-dark py-3">
    <div class="flex whitespace-nowrap animate-[scroll-left_30s_linear_infinite]">
      <div class="flex items-center gap-10 px-5 text-sm font-medium text-ink-inverse-muted">
        <span v-for="item in items" :key="item.key">
          <strong class="text-ink-inverse">{{ item.value }}</strong> {{ item.label }}
        </span>
      </div>
      <div
        class="flex items-center gap-10 px-5 text-sm font-medium text-ink-inverse-muted"
        aria-hidden="true"
      >
        <span v-for="item in items" :key="`${item.key}-dup`">
          <strong class="text-ink-inverse">{{ item.value }}</strong> {{ item.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const items = [
  { key: 'sessions', value: '312', label: 'sessions ouvertes' },
  { key: 'places', value: '1 480', label: 'places disponibles' },
  { key: 'deps', value: '96', label: 'départements couverts' },
  { key: 'live', value: '•', label: 'données actualisées en continu' }
]
</script>
