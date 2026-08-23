import { defineStore } from 'pinia'

export interface List {
  id: string
  name: string
  userId: string
  createdAt: string
}

export const useListsStore = defineStore('lists', () => {
  const lists = ref<List[]>([])
  const selectedListId = ref<string | null>(null)
  const selectedList = computed(
    () => lists.value.find((l) => l.id === selectedListId.value) ?? null
  )

  async function fetchLists(): Promise<void> {
    const { $api } = useNuxtApp()
    lists.value = await $api<List[]>('/lists')
  }

  async function createList(name: string): Promise<void> {
    const { $api } = useNuxtApp()
    const created = await $api<List>('/lists', { method: 'POST', body: { name } })
    lists.value.unshift(created)
    selectedListId.value = created.id
  }

  function selectList(id: string): void {
    selectedListId.value = id
  }

  async function deleteList(id: string): Promise<void> {
    const { $api } = useNuxtApp()
    await $api(`/lists/${id}`, { method: 'DELETE' })
    lists.value = lists.value.filter((l) => l.id !== id)
    if (selectedListId.value === id) {
      selectedListId.value = lists.value[0]?.id ?? null
    }
  }

  function $reset(): void {
    lists.value = []
    selectedListId.value = null
  }

  return {
    lists,
    selectedListId,
    selectedList,
    fetchLists,
    createList,
    selectList,
    deleteList,
    $reset
  }
})
