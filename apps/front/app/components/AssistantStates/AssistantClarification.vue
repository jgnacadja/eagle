<template>
  <!-- É3 — une seule question, courte (RG-IA-03) : réponses rapides en
       chips + saisie libre (AssistantComposer, en pied de fil). -->
  <div>
    <p class="text-small text-ink-body md:text-body">{{ clarification.intro }}</p>
    <p :id="questionId" class="mt-xs font-semibold text-ink">{{ clarification.question }}</p>
    <ul class="mt-md flex flex-col gap-sm sm:flex-row sm:flex-wrap" :aria-labelledby="questionId">
      <li v-for="option in clarification.options" :key="option">
        <Button
          type="button"
          variant="outline"
          size="chip"
          class="w-full justify-start font-medium max-md:h-touch sm:w-auto sm:justify-center"
          @click="emit('pick', option)"
        >
          {{ option }}
        </Button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import type { AssistantClarification } from '~/types/assistant'

defineProps<{ clarification: AssistantClarification }>()

const emit = defineEmits<{ pick: [option: string] }>()

const questionId = `assistant-question-${useId()}`
</script>
