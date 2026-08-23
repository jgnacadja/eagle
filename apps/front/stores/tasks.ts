import { defineStore } from 'pinia'

export interface Task {
  id: string
  shortDescription: string
  longDescription: string | null
  dueDate: string
  completedAt: string | null
  listId: string
  createdAt: string
  updatedAt: string
}

export interface CreateTaskPayload {
  shortDescription: string
  longDescription?: string
  dueDate: string
}

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const completedTasks = ref<Task[]>([])

  let fetchSeq = 0

  function insertSorted(list: Task[], task: Task): void {
    const idx = list.findIndex((t) => t.dueDate > task.dueDate)
    if (idx === -1) list.push(task)
    else list.splice(idx, 0, task)
  }

  async function fetchTasks(listId: string): Promise<void> {
    const { $api } = useNuxtApp()
    const seq = ++fetchSeq
    const all = await $api<Task[]>(`/lists/${listId}/tasks`)
    if (seq !== fetchSeq) return
    tasks.value = all.filter((t) => !t.completedAt)
    completedTasks.value = all.filter((t) => !!t.completedAt)
  }

  async function createTask(listId: string, payload: CreateTaskPayload): Promise<void> {
    const { $api } = useNuxtApp()
    const task = await $api<Task>(`/lists/${listId}/tasks`, { method: 'POST', body: payload })
    onTaskCreated(task)
  }

  function onTaskCreated(task: Task): void {
    if (!tasks.value.find((t) => t.id === task.id)) {
      insertSorted(tasks.value, task)
    }
  }

  async function completeTask(taskId: string): Promise<void> {
    const { $api } = useNuxtApp()
    const updated = await $api<Task>(`/tasks/${taskId}/complete`, { method: 'PATCH' })
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx !== -1) tasks.value.splice(idx, 1)
    if (!completedTasks.value.find((t) => t.id === updated.id)) {
      completedTasks.value.unshift(updated)
    }
  }

  async function reactivateTask(taskId: string): Promise<void> {
    const { $api } = useNuxtApp()
    const updated = await $api<Task>(`/tasks/${taskId}/reactivate`, { method: 'PATCH' })
    const idx = completedTasks.value.findIndex((t) => t.id === taskId)
    if (idx !== -1) completedTasks.value.splice(idx, 1)
    if (!tasks.value.find((t) => t.id === updated.id)) {
      insertSorted(tasks.value, updated)
    }
  }

  function onTaskUpdated(task: Task): void {
    if (task.completedAt) {
      const idx = tasks.value.findIndex((t) => t.id === task.id)
      if (idx !== -1) tasks.value.splice(idx, 1)
      if (!completedTasks.value.find((t) => t.id === task.id)) {
        completedTasks.value.unshift(task)
      }
    } else {
      const completedIdx = completedTasks.value.findIndex((t) => t.id === task.id)
      if (completedIdx !== -1) completedTasks.value.splice(completedIdx, 1)
      const activeIdx = tasks.value.findIndex((t) => t.id === task.id)
      if (activeIdx !== -1) {
        tasks.value.splice(activeIdx, 1, task)
      } else {
        insertSorted(tasks.value, task)
      }
    }
  }

  async function deleteTask(taskId: string): Promise<void> {
    const { $api } = useNuxtApp()
    await $api(`/tasks/${taskId}`, { method: 'DELETE' })
    onTaskDeleted({ id: taskId })
  }

  function onTaskDeleted({ id }: { id: string }): void {
    tasks.value = tasks.value.filter((t) => t.id !== id)
    completedTasks.value = completedTasks.value.filter((t) => t.id !== id)
  }

  function $reset(): void {
    tasks.value = []
    completedTasks.value = []
  }

  return {
    tasks,
    completedTasks,
    fetchTasks,
    createTask,
    onTaskCreated,
    completeTask,
    reactivateTask,
    onTaskUpdated,
    deleteTask,
    onTaskDeleted,
    $reset
  }
})
