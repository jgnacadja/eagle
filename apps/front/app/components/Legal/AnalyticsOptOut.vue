<template>
  <!-- droit d'opposition à la mesure d'audience (exemption CNIL) :
       bloc interactif injecté dans la politique de confidentialité, section
       « mesure-audience ». Le suivi Matomo est sans cookie ; l'opt-out pose
       le marqueur first-party du tracker. -->
  <div
    class="mt-md rounded-md border border-rule bg-surface p-lg"
    role="group"
    aria-labelledby="analytics-optout-status"
  >
    <p id="analytics-optout-status" class="text-small font-semibold text-ink" aria-live="polite">
      {{ statusLabel }}
    </p>
    <p class="mt-xs text-small text-ink-muted">
      La mesure d'audience est réalisée sans cookie et avec anonymisation de l'adresse IP. Vous
      pouvez vous y opposer à tout moment&nbsp;; votre choix est conservé par un marqueur sur votre
      navigateur.
    </p>
    <Button
      v-if="available"
      type="button"
      variant="outline"
      size="pill-sm"
      class="mt-md px-xl"
      :aria-pressed="optedOut"
      @click="toggle"
    >
      {{ optedOut ? 'Réactiver la mesure d’audience' : 'Refuser la mesure d’audience' }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAnalytics } from '~/composables/useAnalytics'

type OptOutState = 'loading' | 'tracked' | 'optedOut' | 'unavailable'

const { isOptedOut, optOut, optIn, enabled } = useAnalytics()

const state = ref<OptOutState>('loading')

const available = computed(() => state.value === 'tracked' || state.value === 'optedOut')
const optedOut = computed(() => state.value === 'optedOut')
const statusLabel = computed(() => {
  switch (state.value) {
    case 'tracked':
      return 'Vous êtes actuellement suivi·e par la mesure d’audience anonymisée.'
    case 'optedOut':
      return 'Vous êtes actuellement exclu·e de la mesure d’audience.'
    case 'unavailable':
      return 'La mesure d’audience n’est pas active dans cet environnement.'
    default:
      return 'Vérification du statut de mesure d’audience…'
  }
})

async function toggle() {
  if (optedOut.value) {
    optIn()
    state.value = 'tracked'
  } else {
    optOut()
    state.value = 'optedOut'
  }
}

onMounted(() => {
  // Tracker absent (script bloqué, environnement sans Matomo) : il n'y a
  // rien à désactiver — le mécanisme d'opposition n'est pas affiché.
  if (!enabled || typeof window._paq?.push !== 'function') {
    state.value = 'unavailable'
    return
  }
  // Le tracker lit le marqueur d'opt-out ; si matomo.js n'a pas fini de
  // charger, la commande fonction est rejouée dans l'ordre de la file.
  // Script bloqué (bloqueur de contenu, réseau) : jamais rejouée — sans
  // échéance, le statut resterait « Vérification… » indéfiniment.
  const timeout = window.setTimeout(() => {
    if (state.value === 'loading') state.value = 'unavailable'
  }, 4000)
  isOptedOut((opted) => {
    window.clearTimeout(timeout)
    state.value = opted ? 'optedOut' : 'tracked'
  })
})
</script>
