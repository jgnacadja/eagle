<template>
  <!-- Exemples de besoins (É1) : pré-remplissent le champ sans soumettre. -->
  <ul class="flex flex-wrap justify-center gap-sm" aria-label="Exemples de besoins">
    <li v-for="example in examples" :key="example">
      <Button
        type="button"
        variant="outline"
        size="chip"
        class="max-md:h-touch font-medium"
        @click="emit('pick', example)"
      >
        {{ example }}
      </Button>
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{ examples: string[] }>()

const emit = defineEmits<{ pick: [example: string] }>()
</script>
