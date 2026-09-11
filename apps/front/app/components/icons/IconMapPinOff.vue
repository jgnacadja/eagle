<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 28 28"
    fill="none"
    stroke="currentColor"
    stroke-width="2.1"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M23.3337 11.6666C23.3337 18.6666 14.0003 25.6666 14.0003 25.6666C14.0003 25.6666 4.66699 18.6666 4.66699 11.6666C4.66699 9.19123 5.65032 6.81726 7.40066 5.06692C9.151 3.31658 11.525 2.33325 14.0003 2.33325C16.4757 2.33325 18.8496 3.31658 20.6 5.06692C22.3503 6.81726 23.3337 9.19123 23.3337 11.6666Z"
    />
    <path d="M11.083 9.33325L16.9163 13.4166M16.9163 9.33325L11.083 13.4166" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 28 })
</script>
