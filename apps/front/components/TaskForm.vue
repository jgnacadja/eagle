<template>
  <form
    class="overflow-hidden rounded-xl border border-[#e4e3dd] bg-white"
    @submit.prevent
    @focusout="handleFormBlur"
  >
    <input
      v-model="shortDescription"
      class="w-full bg-transparent px-4 pt-3 pb-1 font-sans text-sm text-ink outline-none placeholder:text-ink-muted disabled:opacity-50"
      placeholder="Titre de la tâche *"
      maxlength="200"
      :disabled="submitting"
      @keydown.enter.prevent="handleSubmit"
    />

    <textarea
      v-model="longDescription"
      class="w-full resize-none bg-transparent px-4 py-1 font-sans text-sm text-ink outline-none placeholder:text-ink-muted disabled:opacity-50"
      placeholder="Description détaillée (optionnel)"
      maxlength="2000"
      rows="2"
      :disabled="submitting"
    />

    <div class="border-t border-[#e4e3dd] px-4 py-2.5">
      <input
        v-model="dueDate"
        type="date"
        class="bg-transparent font-sans text-sm text-ink outline-none disabled:opacity-50"
        :disabled="submitting"
        @keydown.enter.prevent="handleSubmit"
      />
    </div>

    <p v-if="error" class="px-4 pb-2 text-xs text-danger" data-testid="task-form-error">
      {{ error }}
    </p>
  </form>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { useTasksStore } from '~/stores/tasks'

const props = defineProps<{ listId: string }>()
const emit = defineEmits<{ created: [] }>()

const tasksStore = useTasksStore()

const shortDescription = ref('')
const longDescription = ref('')
const dueDate = ref(format(new Date(), 'yyyy-MM-dd'))
const submitting = ref(false)
const error = ref<string | null>(null)

function isValid(): boolean {
  return !!shortDescription.value.trim() && !!dueDate.value
}

async function handleSubmit(): Promise<void> {
  if (submitting.value) return
  if (!isValid()) {
    error.value = 'Le titre est obligatoire'
    return
  }
  submitting.value = true
  error.value = null
  try {
    await tasksStore.createTask(props.listId, {
      shortDescription: shortDescription.value.trim(),
      longDescription: longDescription.value.trim() || undefined,
      dueDate: new Date(dueDate.value + 'T00:00:00').toISOString()
    })
    shortDescription.value = ''
    longDescription.value = ''
    dueDate.value = format(new Date(), 'yyyy-MM-dd')
    emit('created')
  } catch (e: unknown) {
    error.value =
      (e as { data?: { message?: string } })?.data?.message ?? 'Erreur lors de la création'
  } finally {
    submitting.value = false
  }
}

function handleFormBlur(e: FocusEvent): void {
  const form = e.currentTarget as HTMLElement
  if (e.relatedTarget && !form.contains(e.relatedTarget as Node)) {
    if (isValid()) void handleSubmit()
  }
}
</script>
