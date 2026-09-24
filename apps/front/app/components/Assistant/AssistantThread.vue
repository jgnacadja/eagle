<template>
  <!-- Fil de conversation : zone `aria-live="polite"` (§40), demande
       utilisateur visible pendant l'analyse, réponses progressives. -->
  <div>
    <AssistantContextBar
      v-if="conversation.context?.length"
      :chips="conversation.context"
      @edit="emit('edit')"
    />

    <div class="flex flex-col gap-lg py-lg" role="log" aria-live="polite" aria-relevant="additions">
      <template v-for="(turn, index) in conversation.turns" :key="index">
        <AssistantUserBubble v-if="turn.role === 'user'" :text="turn.text" />
        <AssistantReply v-else>
          <AssistantAnalyzing v-if="turn.kind === 'analyzing'" />
          <p v-else-if="turn.kind === 'text'" class="text-small text-ink-body md:text-body">
            {{ turn.text }}
          </p>
          <AssistantClarification
            v-else-if="turn.kind === 'clarification'"
            :clarification="turn.clarification"
            @pick="emit('answer', $event)"
          />
          <AssistantRecommendations
            v-else-if="turn.kind === 'recommendations'"
            :recommendations="turn.recommendations"
            @compare="emit('compare')"
          />
          <AssistantNoSession v-else-if="turn.kind === 'no-session'" :no-session="turn.noSession" />
          <AssistantNoResult
            v-else-if="turn.kind === 'no-result'"
            @reformulate="emit('reformulate')"
          />
          <AssistantOutOfCatalog
            v-else-if="turn.kind === 'out-of-catalog'"
            :out-of-catalog="turn.outOfCatalog"
          />
          <AssistantSummary v-else-if="turn.kind === 'summary'" :summary="turn.summary" />
        </AssistantReply>
      </template>
    </div>

    <AssistantComposer v-if="conversation.composer" @submit="emit('answer', $event)" />
  </div>
</template>

<script setup lang="ts">
import type { AssistantConversation } from '~/types/assistant'

defineProps<{ conversation: AssistantConversation }>()

const emit = defineEmits<{
  /** Réponse à une clarification (chip ou saisie libre). */
  answer: [value: string]
  compare: []
  reformulate: []
  edit: []
}>()
</script>
