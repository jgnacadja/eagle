<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 15 15"
    fill="none"
    stroke="currentColor"
    stroke-width="1.25"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M2.5 7.5V11.875C2.5 12.0408 2.56585 12.1997 2.68306 12.3169C2.80027 12.4342 2.95924 12.5 3.125 12.5H11.875C12.0408 12.5 12.1997 12.4342 12.3169 12.3169C12.4342 12.1997 12.5 12.0408 12.5 11.875V7.5"
    />
    <path d="M7.5 1.875V10M5 4.375L7.5 1.875L10 4.375" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 15 })
</script>
