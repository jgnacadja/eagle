<template>
  <div>
    <!-- Lanceur flottant -->
    <Button
      v-if="!isOpen"
      size="icon"
      aria-label="Ouvrir la recherche assistée"
      class="fixed bottom-lg right-lg z-40 h-12 w-12 rounded-full bg-primary text-paper shadow-md hover:bg-primary-dark"
      @click="open()"
    >
      <IconSparkle :size="20" aria-hidden="true" />
    </Button>

    <!-- Panneau conversationnel : plein ecran, mobile comme desktop —
         couvre aussi le header du site (opaque, au-dessus du z-50 du header) -->
    <Transition name="assistant-panel">
      <dialog
        v-if="isOpen"
        open
        aria-modal="false"
        aria-label="Recherche assistée"
        class="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none flex-col overflow-hidden bg-paper p-0"
        @keydown.esc="close"
      >
        <AssistantConversation
          class="h-full"
          :entries="entries"
          :pending="pending"
          :unavailable="unavailable"
          :context-chips="contextChips"
          :need-summary="needSummary"
          :headcount="slots.headcount"
          :location="slots.location"
          @send="send"
          @edit="editAndSend"
          @stop="stop"
          @retry="retry"
          @reset="onReset"
          @close="close"
        />
      </dialog>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useAssistant, type AssistantEntry } from '~/composables/useAssistant'
import { useAssistantLauncher } from '~/composables/useAssistantLauncher'
import AssistantConversation from '~/components/Assistant/Conversation.vue'

const { isOpen, context, pendingMessage, open, close } = useAssistantLauncher()

const {
  entries,
  pending,
  unavailable,
  contextChips,
  slots,
  needSummary,
  append,
  send,
  editAndSend,
  retry,
  reset,
  stop
} = useAssistant(context)

const GREETING: AssistantEntry = {
  role: 'assistant',
  content:
    'Bonjour ! Décrivez votre besoin de formation — métier, population, obligation réglementaire, ville, effectif — et je vous oriente vers les formations du catalogue.',
  reply: {
    kind: 'clarify',
    text: 'Bonjour ! Décrivez votre besoin de formation — métier, population, obligation réglementaire, ville, effectif — et je vous oriente vers les formations du catalogue.',
    suggestions: [
      'Former des salariés au SST',
      'Mettre à jour une habilitation obligatoire',
      'Aider des managers à gérer leur équipe'
    ]
  }
}

function greet() {
  append({ ...GREETING })
}

// Ouverture : message d'entrée éventuel envoyé directement, sinon accueil.
// `immediate` couvre le cas où open() a été appelé avant le mount du widget.
watch(
  isOpen,
  (open) => {
    if (!open) return
    const message = pendingMessage.value
    if (message) {
      pendingMessage.value = null
      send(message)
      return
    }
    if (entries.value.length === 0) greet()
  },
  { immediate: true }
)

function onReset() {
  reset()
  greet()
}
</script>
