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
      d="M14.1665 2.8335H2.83317C2.05077 2.8335 1.4165 3.46776 1.4165 4.25016V12.7502C1.4165 13.5326 2.05077 14.1668 2.83317 14.1668H14.1665C14.9489 14.1668 15.5832 13.5326 15.5832 12.7502V4.25016C15.5832 3.46776 14.9489 2.8335 14.1665 2.8335Z"
    />
    <path d="M1.4165 4.9585L8.49984 9.2085L15.5832 4.9585" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 24 })
</script>
