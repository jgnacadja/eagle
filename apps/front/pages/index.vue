<template>
  <div class="flex h-screen">
    <LeftSidebar />
    <main
      class="flex min-w-0 flex-1 flex-col overflow-y-auto px-12 py-10"
      @click.self="selectedTask = null"
    >
      <template v-if="selectedList">
        <div class="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 class="font-display text-2xl font-bold text-ink">{{ selectedList.name }}</h1>
            <p class="mt-1 text-sm text-ink-muted">
              {{ tasks.length }} tâche{{ tasks.length !== 1 ? 's' : '' }} active{{
                tasks.length !== 1 ? 's' : ''
              }}
            </p>
          </div>
          <button
            class="h-10 flex-shrink-0 cursor-pointer rounded-full bg-black px-5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-85"
            @click="showForm = !showForm"
          >
            {{ showForm ? 'Annuler' : 'Nouvelle tâche' }}
          </button>
        </div>

        <TaskForm
          v-if="showForm"
          :list-id="selectedList.id"
          class="mb-6"
          @created="showForm = false"
        />

        <div v-if="tasks.length" class="flex flex-col gap-3">
          <TaskCard
            v-for="task in tasks"
            :key="task.id"
            :task="task"
            @complete="tasksStore.completeTask(task.id)"
            @reactivate="tasksStore.reactivateTask(task.id)"
            @select="selectedTask = task"
          />
        </div>
        <p v-else-if="!showForm" class="py-8 text-center text-sm text-ink-muted">
          Aucune tâche active. Créez-en une !
        </p>

        <div v-if="completedTasks.length" class="mt-8">
          <button
            class="flex items-center gap-2 font-sans text-sm font-semibold text-ink-muted hover:text-ink"
            @click="showCompleted = !showCompleted"
          >
            <span class="text-xs transition-transform" :class="showCompleted ? 'rotate-90' : ''"
              >▶</span
            >
            Mes tâches terminées ({{ completedTasks.length }})
          </button>
          <div v-if="showCompleted" class="mt-3 flex flex-col gap-3">
            <TaskCard
              v-for="task in completedTasks"
              :key="task.id"
              :task="task"
              @complete="tasksStore.completeTask(task.id)"
              @reactivate="tasksStore.reactivateTask(task.id)"
              @select="selectedTask = task"
            />
          </div>
        </div>
      </template>

      <p v-else class="flex flex-1 items-center justify-center text-center text-sm text-ink-muted">
        Sélectionnez ou créez une liste pour commencer.
      </p>
    </main>

    <TaskDetail
      :task="selectedTask"
      :deleting="deleting"
      :error="deleteError"
      @close="closeDetail"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useListsStore } from '~/stores/lists'
import { useTasksStore } from '~/stores/tasks'
import type { Task } from '~/stores/tasks'
import { useTaskSocket } from '~/composables/useTaskSocket'

const listsStore = useListsStore()
const tasksStore = useTasksStore()
const { selectedList } = storeToRefs(listsStore)
const { tasks, completedTasks } = storeToRefs(tasksStore)

const showForm = ref(false)
const showCompleted = ref(false)
const selectedTask = ref<Task | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

watch(selectedList, () => {
  showForm.value = false
  selectedTask.value = null
})

watch([tasks, completedTasks], () => {
  if (selectedTask.value) {
    const id = selectedTask.value.id
    const stillExists =
      tasks.value.some((t) => t.id === id) || completedTasks.value.some((t) => t.id === id)
    if (!stillExists) selectedTask.value = null
  }
})

function closeDetail(): void {
  selectedTask.value = null
  deleteError.value = null
}

async function handleDelete(taskId: string): Promise<void> {
  deleting.value = true
  deleteError.value = null
  try {
    await tasksStore.deleteTask(taskId)
    selectedTask.value = null
  } catch {
    deleteError.value = 'Impossible de supprimer la tâche. Veuillez réessayer.'
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await listsStore.fetchLists()
  if (!listsStore.selectedListId && listsStore.lists.length) {
    listsStore.selectList(listsStore.lists[0].id)
  }
})

useTaskSocket()
</script>
