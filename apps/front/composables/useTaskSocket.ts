import { storeToRefs } from 'pinia'
import { useListsStore } from '~/stores/lists'
import type { Task } from '~/stores/tasks'
import { useTasksStore } from '~/stores/tasks'

export function useTaskSocket(): void {
  const { $socket } = useNuxtApp()
  const listsStore = useListsStore()
  const tasksStore = useTasksStore()
  const { selectedListId } = storeToRefs(listsStore)

  let currentListId: string | null = null
  let stopWatch: (() => void) | undefined

  function joinList(listId: string): void {
    if (currentListId && currentListId !== listId) {
      $socket.emit('leave-list', { listId: currentListId })
    }
    $socket.emit('join-list', { listId })
    currentListId = listId
  }

  const onCreated = (task: Task) => {
    if (task.listId === currentListId) tasksStore.onTaskCreated(task)
  }
  const onUpdated = (task: Task) => tasksStore.onTaskUpdated(task)
  const onDeleted = (payload: { id: string }) => tasksStore.onTaskDeleted(payload)
  const onConnect = () => {
    if (currentListId) {
      $socket.emit('join-list', { listId: currentListId })
      void tasksStore.fetchTasks(currentListId)
    }
  }

  onMounted(() => {
    $socket.connect()

    $socket.on('task:created', onCreated)
    $socket.on('task:updated', onUpdated)
    $socket.on('task:deleted', onDeleted)
    $socket.on('connect', onConnect)

    stopWatch = watch(
      selectedListId,
      (newId) => {
        if (newId) {
          joinList(newId)
          void tasksStore.fetchTasks(newId)
        } else {
          if (currentListId) {
            $socket.emit('leave-list', { listId: currentListId })
            currentListId = null
          }
          tasksStore.$reset()
        }
      },
      { immediate: true }
    )
  })

  onUnmounted(() => {
    stopWatch?.()
    $socket.off('task:created', onCreated)
    $socket.off('task:updated', onUpdated)
    $socket.off('task:deleted', onDeleted)
    $socket.off('connect', onConnect)
    if (currentListId) {
      $socket.emit('leave-list', { listId: currentListId })
    }
    $socket.disconnect()
  })
}
