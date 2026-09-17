<template>
  <div class="flex shrink-0 items-center">
    <button
      type="button"
      :aria-pressed="isActive"
      :aria-label="ariaLabel"
      :title="ariaLabel"
      :disabled="status === 'locating'"
      :class="[
        'flex h-control-sm items-center gap-xs rounded-full px-sm text-small font-semibold transition-colors disabled:cursor-wait',
        isActive
          ? 'bg-accent text-ink hover:bg-accent-text hover:text-paper'
          : 'bg-surface text-ink-body hover:bg-primary-faint hover:text-accent-text'
      ]"
      @click="onToggle"
    >
      <span
        v-if="status === 'locating'"
        class="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/25 border-t-ink"
        aria-hidden="true"
      />
      <IconLocate v-else :size="14" :class="isActive ? 'text-ink' : 'text-accent'" />
      <span :class="isActive ? 'inline' : 'hidden lg:inline'">{{
        isActive ? activeLabel : label
      }}</span>
    </button>

    <Dialog :open="dialogVariant !== null" @update:open="onOpenChange">
      <DialogContent>
        <p class="flex h-touch w-touch items-center justify-center rounded-full bg-primary-faint">
          <IconLocate :size="20" class="text-accent-text" />
        </p>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription>{{ dialogText }}</DialogDescription>
        <DialogFooter>
          <Button
            v-if="dialogVariant === 'consent'"
            type="button"
            size="control"
            @click="confirmConsent"
          >
            Utiliser ma position
          </Button>
          <Button type="button" variant="ghost" size="control" @click="closeDialog">
            {{ dialogVariant === 'blocked' ? "J'ai compris" : 'Plus tard' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGeolocation } from '~/composables/useGeolocation'

withDefaults(
  defineProps<{
    label?: string
    activeLabel?: string
  }>(),
  { label: 'Autour de moi', activeLabel: 'Autour de moi' }
)

const { status, position, permission, request, clear } = useGeolocation()

const isActive = computed(() => position.value != null)
const dialogVariant = ref<'consent' | 'blocked' | null>(null)

const ariaLabel = computed(() =>
  isActive.value ? 'Désactiver la géolocalisation' : 'Activer la géolocalisation'
)
const dialogTitle = computed(() =>
  dialogVariant.value === 'blocked' ? 'Localisation bloquée' : 'Voir les centres autour de vous'
)
const dialogText = computed(() =>
  dialogVariant.value === 'blocked'
    ? 'Votre navigateur a mémorisé le refus de géolocalisation. Pour la réactiver : icône cadenas dans la barre d’adresse → Paramètres du site → Localisation → Autoriser, puis rechargez la page.'
    : 'Votre position sert uniquement à afficher les centres les plus proches et à pré-remplir le filtre département. Votre navigateur vous demandera confirmation — rien n’est utilisé sans votre accord.'
)

function closeDialog() {
  dialogVariant.value = null
}

function onOpenChange(open: boolean) {
  if (!open) closeDialog()
}

// Point d'entrée unique — clic badge ou « Autour de moi » du menu mobile.
// Position déjà connue : rien à re-demander, la popup ne se rouvre pas.
function activate() {
  if (status.value === 'locating' || isActive.value) return
  dialogVariant.value =
    permission.value === 'denied' || status.value === 'denied' ? 'blocked' : 'consent'
}

function onToggle() {
  if (isActive.value) {
    clear()
    return
  }
  activate()
}

function confirmConsent() {
  closeDialog()
  request()
}

defineExpose({ activate })
</script>
