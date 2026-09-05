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
    <path d="M7.5 1.875V9.375M5 6.875L7.5 9.375L10 6.875" />
    <path
      d="M2.5 10.625V11.875C2.5 12.2065 2.6317 12.5245 2.86612 12.7589C3.10054 12.9933 3.41848 13.125 3.75 13.125H11.25C11.5815 13.125 11.8995 12.9933 12.1339 12.7589C12.3683 12.5245 12.5 12.2065 12.5 11.875V10.625"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 24 })
</script>
