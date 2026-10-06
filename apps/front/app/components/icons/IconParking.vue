<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 17 19"
    fill="none"
    stroke="currentColor"
    stroke-width="1.41667"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M12.75 4.125H4.25C3.07639 4.125 2.125 5.07639 2.125 6.25V14.75C2.125 15.9236 3.07639 16.875 4.25 16.875H12.75C13.9236 16.875 14.875 15.9236 14.875 14.75V6.25C14.875 5.07639 13.9236 4.125 12.75 4.125Z"
    />
    <path
      d="M6.375 14.0418V6.9585H9.20833C9.77192 6.9585 10.3124 7.18238 10.7109 7.58089C11.1095 7.97941 11.3333 8.51991 11.3333 9.0835C11.3333 9.64708 11.1095 10.1876 10.7109 10.5861C10.3124 10.9846 9.77192 11.2085 9.20833 11.2085H6.375"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 24 })
</script>
