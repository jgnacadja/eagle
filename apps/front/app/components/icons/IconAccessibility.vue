<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 17 17"
    fill="none"
    stroke="currentColor"
    stroke-width="1.41667"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M8.50016 4.95833C9.28257 4.95833 9.91683 4.32407 9.91683 3.54167C9.91683 2.75926 9.28257 2.125 8.50016 2.125C7.71776 2.125 7.0835 2.75926 7.0835 3.54167C7.0835 4.32407 7.71776 4.95833 8.50016 4.95833Z"
    />
    <path
      d="M8.5 4.9585V8.50016M8.5 8.50016L5.66667 12.7502M8.5 8.50016L11.3333 12.7502M4.25 7.0835H12.75"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 24 })
</script>
