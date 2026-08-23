<template>
  <Transition name="slide">
    <aside
      v-if="task"
      class="flex h-full w-80 flex-shrink-0 flex-col border-l border-[#e4e3dd] bg-white"
      data-testid="detail-panel"
    >
      <div class="flex items-center justify-between border-b border-[#e4e3dd] px-5 py-4">
        <h2 class="font-display text-sm font-bold text-ink">Détail</h2>
        <button
          class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          aria-label="Fermer"
          data-testid="close-btn"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div>
          <p class="font-sans text-sm font-semibold text-ink">{{ task.shortDescription }}</p>
        </div>

        <div v-if="task.longDescription">
          <p class="text-xs font-medium uppercase tracking-wide text-ink-muted mb-1">Description</p>
          <p class="text-sm text-ink">{{ task.longDescription }}</p>
        </div>

        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-ink-muted mb-1">Échéance</p>
          <p class="text-sm text-ink">{{ formatDate(task.dueDate) }}</p>
        </div>

        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-ink-muted mb-1">Créée le</p>
          <p class="text-sm text-ink">{{ formatDate(task.createdAt) }}</p>
        </div>
      </div>

      <div class="border-t border-[#e4e3dd] px-5 py-4 space-y-2">
        <p v-if="error" class="text-xs text-danger" data-testid="delete-error">{{ error }}</p>
        <button
          class="w-full h-9 cursor-pointer rounded-full bg-danger/10 font-sans text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-white"
          data-testid="delete-btn"
          @click="showConfirm = true"
        >
          Supprimer
        </button>
      </div>

      <ConfirmModal
        v-if="showConfirm"
        title="Supprimer la tâche ?"
        message="Cette action est irréversible."
        confirm-label="Supprimer"
        :loading="deleting"
        @confirm="onConfirm"
        @cancel="showConfirm = false"
      />
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { formatDate } from '~/utils/date'
import type { Task } from '~/stores/tasks'

const props = defineProps<{
  task: Task | null
  deleting?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  close: []
  delete: [taskId: string]
}>()

const showConfirm = ref(false)

watch(
  () => props.task?.id,
  () => {
    showConfirm.value = false
  }
)

function onConfirm(): void {
  if (props.task) emit('delete', props.task.id)
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
