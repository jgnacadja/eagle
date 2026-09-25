<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="max-w-prose">
      <Transition name="candidature-step" mode="out-in">
        <!-- Confirmation d'envoi -->
        <Confirmation v-if="submitted" :projet="projet" />

        <!-- Formulaire de candidature -->
        <div v-else class="grid gap-md">
          <DialogHeader>
            <DialogTitle class="text-h3">Candidater pour rejoindre le réseau</DialogTitle>
            <DialogDescription>
              Votre candidature est étudiée par l'équipe de développement du réseau. Nous vous
              répondrons sous 5 jours ouvrés.
            </DialogDescription>
          </DialogHeader>

          <CandidatureForm v-model:voie="voie" :sending="sending" @submit="onSubmit" />
          <p v-if="submitError" class="text-small font-semibold text-danger" role="alert">
            {{ submitError }}
          </p>
        </div>
      </Transition>
    </DialogScrollContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import CandidatureForm from './Form.vue'
import Confirmation from './Confirmation.vue'
import { VOIE_LABELS, type CandidaturePayload, type CandidatureVoie } from '~/types/candidature'

const props = withDefaults(
  defineProps<{
    open: boolean
    voie?: CandidatureVoie
  }>(),
  { voie: 'centre' }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const voie = ref<CandidatureVoie>(props.voie)
const submitted = ref(false)
const projet = ref('')
const { submit: submitLead, sending, error: submitError, reset: resetLeadError } = useLeadSubmit()

// Chaque ouverture repart sur la voie demandée et le formulaire (pas l'écran succès).
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    voie.value = props.voie
    submitted.value = false
    resetLeadError()
  }
)

async function onSubmit(payload: CandidaturePayload) {
  const ok = await submitLead('candidature', {
    ...payload,
    consentement: true,
    pageUri: window.location.href,
    pageName: 'Candidater pour rejoindre le réseau'
  })
  if (!ok) return
  const lieu = payload.ville ? ` — ${payload.ville}` : ''
  projet.value = `${VOIE_LABELS[payload.voie]}${lieu}`
  submitted.value = true
}
</script>
