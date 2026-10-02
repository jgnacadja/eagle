<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 30 30"
    fill="none"
    stroke="currentColor"
    stroke-width="2.25"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M13.75 22.5C18.5825 22.5 22.5 18.5825 22.5 13.75C22.5 8.91751 18.5825 5 13.75 5C8.91751 5 5 8.91751 5 13.75C5 18.5825 8.91751 22.5 13.75 22.5Z"
    />
    <path d="M25 25L20.25 20.25" />
    <path d="M10 13.75H17.5" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 30 })
</script>
