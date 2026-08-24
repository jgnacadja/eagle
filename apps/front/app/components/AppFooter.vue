<template>
  <footer class="border-t border-rule bg-surface">
    <div class="mx-auto max-w-5xl px-6 py-8 text-center font-sans text-sm text-ink-muted">
      © {{ year }} LEARN UP ACADEMY
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>
