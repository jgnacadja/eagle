<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/45"
      @click.self="$emit('cancel')"
    >
      <div
        class="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <h2 id="confirm-modal-title" class="mb-2.5 font-display text-lg font-bold text-ink">
          {{ title }}
        </h2>
        <p class="mb-6 text-sm leading-relaxed text-ink-muted">{{ message }}</p>
        <div class="flex justify-end gap-2.5">
          <button
            class="h-10 cursor-pointer rounded-full bg-surface px-5 font-sans text-sm font-semibold text-ink transition-opacity hover:opacity-80"
            @click="$emit('cancel')"
          >
            Annuler
          </button>
          <button
            class="h-10 cursor-pointer rounded-full bg-danger px-5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="loading"
            @click="$emit('confirm')"
          >
            {{ loading ? 'Suppression…' : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    message: string
    confirmLabel?: string
    loading?: boolean
  }>(),
  { confirmLabel: 'Confirmer', loading: false }
)

defineEmits<{ confirm: []; cancel: [] }>()
</script>
