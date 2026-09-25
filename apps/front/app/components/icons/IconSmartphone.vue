<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M10.1191 1.5H7.86913C6.10138 1.5 5.21749 1.5 4.66831 2.04917C4.11914 2.59834 4.11914 3.48224 4.11914 5.25V12.75C4.11914 14.5178 4.11914 15.4016 4.66831 15.9509C5.21749 16.5 6.10138 16.5 7.86913 16.5H10.1191C11.8869 16.5 12.7708 16.5 13.32 15.9509C13.8691 15.4016 13.8691 14.5178 13.8691 12.75V5.25C13.8691 3.48224 13.8691 2.59834 13.32 2.04917C12.7708 1.5 11.8869 1.5 10.1191 1.5Z"
    />
    <path
      d="M10.4941 1.5H7.49414L7.66183 1.83541C7.78888 2.0895 8.0486 2.25 8.3327 2.25H9.65563C9.93973 2.25 10.1994 2.0895 10.3264 1.83541L10.4941 1.5Z"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 24 })
</script>
