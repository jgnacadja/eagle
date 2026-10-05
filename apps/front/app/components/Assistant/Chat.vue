<template>
  <div>
    <!-- Lanceur flottant -->
    <Motion
      v-if="!isOpen"
      :initial="{ opacity: 0, scale: 0.5 }"
      :animate="{ opacity: 1, scale: 1 }"
      :while-press="{ scale: 0.9 }"
      :transition="{ type: 'spring', stiffness: 300, damping: 22 }"
      class="fixed bottom-lg right-lg z-40"
    >
      <Button
        size="icon"
        aria-label="Ouvrir la recherche assistée"
        class="h-12 w-12 rounded-full bg-primary text-paper shadow-md hover:bg-primary-dark"
        @click="open()"
      >
        <IconSparkle :size="20" aria-hidden="true" />
      </Button>
    </Motion>

    <!-- Panneau conversationnel : plein ecran, mobile comme desktop —
         modal (showModal) : focus trap, Échap natif, fond inerte. -->
    <Transition name="assistant-panel">
      <dialog
        v-if="isOpen"
        ref="panelEl"
        aria-modal="true"
        aria-label="Recherche assistée"
        class="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none flex-col overflow-hidden bg-paper p-0"
        @cancel.prevent="close"
        @click="onPanelClick"
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
          @send="onSend"
          @edit="onEditAndSend"
          @stop="stop"
          @retry="retry"
          @reset="onReset"
          @close="close"
          @suggested-action-click="onSuggestedActionClick"
          @handoff="onHandoff"
        />
      </dialog>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Motion } from 'motion-v'
import { useAssistant, type AssistantEntry } from '~/composables/useAssistant'
import { useAssistantLauncher } from '~/composables/useAssistantLauncher'
import { useDataLayer } from '~/composables/useDataLayer'
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

const { pushEvent } = useDataLayer()
const conversationId = ref('chat_' + Date.now())
const chatStartTime = ref<number | null>(null)
const userMessagesCount = ref(0)

function onSend(message: string) {
  userMessagesCount.value++
  pushEvent({
    event: 'chatbot_message_sent',
    conversation_id: conversationId.value,
    message_index: userMessagesCount.value,
    page_path: typeof window !== 'undefined' ? window.location.pathname : ''
  })
  send(message)
}

function onEditAndSend(message: string, index: number) {
  userMessagesCount.value++
  pushEvent({
    event: 'chatbot_message_sent',
    conversation_id: conversationId.value,
    message_index: userMessagesCount.value,
    page_path: typeof window !== 'undefined' ? window.location.pathname : ''
  })
  editAndSend(message, index)
}

function onSuggestedActionClick(payload: { action_type: string; action_label: string }) {
  pushEvent({
    event: 'chatbot_suggested_action_click',
    conversation_id: conversationId.value,
    action_type: payload.action_type,
    action_label: payload.action_label
  })
}

function onHandoff(payload?: { reason?: string }) {
  pushEvent({
    event: 'chatbot_handoff_to_advisor',
    conversation_id: conversationId.value,
    reason: payload?.reason,
    messages_count: userMessagesCount.value
  })
}

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

const panelEl = ref<HTMLDialogElement>()
let previousFocus: Element | null = null

// Ouverture : le <dialog> devient modal (focus trap + Échap natif) ; à la
// fermeture le focus revient sur l'élément déclencheur.
watch(
  isOpen,
  (open) => {
    if (typeof document === 'undefined') return // SSR
    if (open) {
      chatStartTime.value = Date.now()
      pushEvent({
        event: 'chatbot_open',
        page_path: typeof window !== 'undefined' ? window.location.pathname : '',
        trigger_type: pendingMessage.value ? 'auto' : 'manuel',
        conversation_id: conversationId.value
      })
      previousFocus = document.activeElement
      nextTick(() => {
        if (panelEl.value && !panelEl.value.open) panelEl.value.showModal?.()
      })
    } else {
      if (chatStartTime.value) {
        const duration = Math.round((Date.now() - chatStartTime.value) / 1000)
        const hasResults = entries.value.some(
          (e) => e.reply?.kind === 'recommendations' || e.reply?.kind === 'course_card'
        )
        pushEvent({
          event: 'chatbot_conversation_end',
          conversation_id: conversationId.value,
          messages_count: entries.value.length,
          resolved: hasResults,
          duration_seconds: duration
        })
        chatStartTime.value = null
      }
      nextTick(() => (previousFocus as HTMLElement | null)?.focus?.())
    }
  },
  { immediate: true }
)

// Ouverture : message d'entrée éventuel envoyé directement, sinon accueil.
// `pendingMessage` est aussi écouté : un open({ message }) pendant que le
// panneau est déjà ouvert envoie le message dans la conversation en cours.
// `immediate` couvre le cas où open() a été appelé avant le mount du widget.
watch(
  [isOpen, pendingMessage],
  ([open]) => {
    if (!open) return
    const message = pendingMessage.value
    if (message) {
      pendingMessage.value = null
      onSend(message)
      return
    }
    // Pas de message en file : accueil, sauf si un envoi est déjà en cours
    // (send() est asynchrone — le tour user n'est pas encore dans entries).
    if (entries.value.length === 0 && !pending.value) greet()
  },
  { immediate: true }
)

// Les liens du panneau (fiche formation, demande, conseiller) naviguent
// derrière le <dialog> modal : sans fermeture explicite, le panneau reste
// ouvert par-dessus la page cible. Deux garde-fous : le clic sur un lien
// (couvre la navigation vers la route courante, qui ne change pas fullPath)
// et le watch (retour arrière, navigation programmatique).
const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    if (isOpen.value) close()
  }
)

function onPanelClick(event: MouseEvent) {
  if ((event.target as HTMLElement | null)?.closest?.('a')) close()
}

function onReset() {
  reset()
  conversationId.value = 'chat_' + Date.now()
  userMessagesCount.value = 0
  greet()
}
</script>
