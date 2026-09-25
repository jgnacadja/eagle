<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 15 15"
    fill="none"
    stroke="currentColor"
    stroke-width="1.375"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M7.5 13.125C10.6066 13.125 13.125 10.6066 13.125 7.5C13.125 4.3934 10.6066 1.875 7.5 1.875C4.3934 1.875 1.875 4.3934 1.875 7.5C1.875 10.6066 4.3934 13.125 7.5 13.125Z"
    />
    <path
      d="M7.5 9.0625C8.36294 9.0625 9.0625 8.36294 9.0625 7.5C9.0625 6.63706 8.36294 5.9375 7.5 5.9375C6.63706 5.9375 5.9375 6.63706 5.9375 7.5C5.9375 8.36294 6.63706 9.0625 7.5 9.0625Z"
    />
    <path d="M7.5 1.875V3.75M7.5 11.25V13.125M1.875 7.5H3.75M11.25 7.5H13.125" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 24 })
</script>
