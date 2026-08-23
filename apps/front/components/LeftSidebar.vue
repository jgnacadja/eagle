<template>
  <aside
    class="flex flex-shrink-0 flex-col border-r border-[#e4e3dd] bg-white transition-[width] duration-200"
    :class="collapsed ? 'w-14' : 'w-[260px]'"
    style="min-height: 100vh"
  >
    <div class="flex items-center border-b border-[#e4e3dd] px-3 pt-2">
      <AppBrand v-if="!collapsed" class="min-w-0 flex-1" />
    </div>

    <template v-if="!collapsed">
      <div class="p-3">
        <form class="flex gap-2" @submit.prevent="submitCreate">
          <input
            v-model="newName"
            class="tf-input h-[38px] flex-1 text-sm"
            placeholder="Nouvelle liste…"
            maxlength="100"
            :disabled="creating"
          />
          <button
            type="submit"
            class="flex h-[38px] w-[38px] flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-primary text-xl font-bold text-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!newName.trim() || creating"
          >
            +
          </button>
        </form>
        <p v-if="createError" class="mt-1.5 text-xs text-danger" data-testid="list-error">
          {{ createError }}
        </p>
      </div>

      <nav class="flex-1 overflow-y-auto px-2 pb-4">
        <ul class="flex flex-col gap-0.5 list-none m-0 p-0">
          <li
            v-for="list in lists"
            :key="list.id"
            class="group flex items-center rounded-lg transition-colors hover:bg-primary-soft"
            :class="{ 'bg-primary-soft': list.id === selectedListId }"
          >
            <button
              class="min-w-0 flex-1 truncate border-0 bg-transparent px-2.5 py-2 text-left font-sans text-sm text-ink cursor-pointer"
              :class="list.id === selectedListId ? 'font-semibold text-[#007a52]' : ''"
              @click="listsStore.selectList(list.id)"
            >
              {{ list.name }}
            </button>
            <button
              class="mr-1 h-7 w-7 flex-shrink-0 cursor-pointer rounded-md border-0 bg-transparent text-[11px] text-ink-muted opacity-0 transition-[opacity,background] duration-[120ms] group-hover:opacity-100 hover:bg-[#fff1f1] hover:text-danger"
              aria-label="Supprimer la liste"
              @click.stop="openDeleteModal(list)"
            >
              ✕
            </button>
          </li>
        </ul>

        <p v-if="!lists.length" class="m-0 px-1 py-3 text-sm text-ink-muted">
          Aucune liste pour l'instant.
        </p>
      </nav>
    </template>

    <div
      class="mt-auto flex items-center gap-2 border-t border-[#e4e3dd] px-3 py-3"
      :class="collapsed ? 'justify-center' : 'justify-between'"
    >
      <button
        class="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#e4e3dd] bg-transparent transition-colors hover:bg-surface"
        :aria-label="collapsed ? 'Ouvrir le menu' : 'Fermer le menu'"
        @click="collapsed = !collapsed"
      >
        <span class="text-xs text-ink-muted">{{ collapsed ? '→' : '←' }}</span>
      </button>
      <div v-if="!collapsed" class="flex min-w-0 flex-1 flex-col gap-1">
        <span class="truncate text-xs text-ink-muted">{{ authStore.userEmail ?? '' }}</span>
        <span
          class="cursor-pointer text-xs font-semibold text-danger transition-opacity hover:opacity-80"
          @click="authStore.logout()"
        >
          Se déconnecter
        </span>
      </div>
    </div>
    <ConfirmModal
      v-if="pendingDelete"
      title="Supprimer la liste ?"
      :message="`« ${pendingDelete.name} » et toutes ses tâches seront supprimées définitivement.`"
      confirm-label="Supprimer"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    />
  </aside>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import type { List } from '~/stores/lists'
import { useListsStore } from '~/stores/lists'

const authStore = useAuthStore()

const listsStore = useListsStore()
const { lists, selectedListId } = storeToRefs(listsStore)

const collapsed = ref(false)
const newName = ref('')
const creating = ref(false)
const createError = ref<string | null>(null)
const pendingDelete = ref<List | null>(null)
const deleting = ref(false)

async function submitCreate(): Promise<void> {
  const name = newName.value.trim()
  if (!name) return
  creating.value = true
  createError.value = null
  try {
    await listsStore.createList(name)
    newName.value = ''
  } catch (e: unknown) {
    createError.value =
      (e as { data?: { message?: string } })?.data?.message ?? 'Erreur lors de la création'
  } finally {
    creating.value = false
  }
}

function openDeleteModal(list: List): void {
  pendingDelete.value = list
}

async function confirmDelete(): Promise<void> {
  if (!pendingDelete.value) return
  deleting.value = true
  try {
    await listsStore.deleteList(pendingDelete.value.id)
    pendingDelete.value = null
  } finally {
    deleting.value = false
  }
}
</script>
