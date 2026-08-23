<template>
  <div
    class="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e4e3dd] bg-white p-4 transition-opacity"
    :class="task.completedAt ? 'opacity-70' : ''"
    data-testid="task-card"
    @click="$emit('select', task)"
  >
    <button
      class="mt-0.5 flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors"
      :class="
        task.completedAt
          ? 'border-primary bg-primary text-white'
          : 'border-ink-muted hover:border-primary'
      "
      :aria-label="task.completedAt ? 'Réactiver' : 'Terminer'"
      @click.stop="task.completedAt ? $emit('reactivate', task.id) : $emit('complete', task.id)"
    >
      <span v-if="task.completedAt" class="text-[10px] font-bold leading-none">✓</span>
    </button>

    <div class="min-w-0 flex-1">
      <p
        class="font-sans text-sm font-medium text-ink"
        :class="task.completedAt ? 'line-through text-ink-muted' : ''"
      >
        {{ task.shortDescription }}
      </p>
      <p v-if="task.longDescription" class="mt-1 text-xs text-ink-muted">
        {{ task.longDescription }}
      </p>
      <p class="mt-1 text-xs" :class="isOverdue ? 'text-danger font-semibold' : 'text-ink-muted'">
        {{ formatDate(task.dueDate) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '~/utils/date'
import type { Task } from '~/stores/tasks'

const props = defineProps<{ task: Task }>()
defineEmits<{
  complete: [id: string]
  reactivate: [id: string]
  select: [task: Task]
}>()

const isOverdue = computed(() => {
  if (props.task.completedAt) return false
  const dueDay = new Date(props.task.dueDate).toLocaleDateString('en-CA')
  const todayStr = new Date().toLocaleDateString('en-CA')
  return dueDay < todayStr
})
</script>
