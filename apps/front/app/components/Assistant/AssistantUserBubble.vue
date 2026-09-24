<template>
  <div class="flex justify-end">
    <p
      class="max-w-[85%] rounded-md rounded-tr-sm bg-surface px-md py-sm text-small text-ink md:max-w-[70%] md:text-body"
    >
      <span class="sr-only">Vous : </span>{{ text }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text: string }>()
</script>
