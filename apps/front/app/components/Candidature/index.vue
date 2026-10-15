<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="max-w-prose">
      <div class="grid gap-md">
        <DialogHeader>
          <DialogTitle class="text-h3">Candidater pour rejoindre le réseau</DialogTitle>
          <DialogDescription>
            Votre candidature est étudiée par l'équipe de développement du réseau. Nous vous
            répondrons sous 5 jours ouvrés.
          </DialogDescription>
        </DialogHeader>

        <CandidatureForm ref="formRef" v-model:voie="voie" :sending="sending" @submit="onSubmit" />
        <p v-if="submitError" class="text-small font-semibold text-danger" role="alert">
          {{ submitError }}
        </p>
      </div>
    </DialogScrollContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import CandidatureForm from './Form.vue'
import { type CandidaturePayload, type CandidatureVoie } from '~/types/candidature'
import type { FormId, NetworkProfileType } from '~/types/analytics'

import { useDataLayer } from '~/composables/useDataLayer'

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

const formRef = ref<InstanceType<typeof CandidatureForm> | null>(null)
const voie = ref<CandidatureVoie>(props.voie)
const { submit: submitLead, sending, error: submitError, reset: resetLeadError } = useLeadSubmit()
const { confirmConversion } = useConfirmationRedirect()
const { pushEvent } = useDataLayer()

// Chaque ouverture repart sur la voie demandée et le formulaire (pas l'écran succès).
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    voie.value = props.voie
    resetLeadError()
  }
)

async function onSubmit(payload: CandidaturePayload) {
  const ok = await submitLead('candidature', {
    ...payload,
    consentement: true,
    // Pas de query : elle peut porter du texte libre et dépasser la borne API.
    pageUri: window.location.origin + window.location.pathname,
    pageName: 'Candidater pour rejoindre le réseau'
  })
  if (!ok) return
  formRef.value?.trackFormSubmit()

  const profileType: NetworkProfileType = payload.voie === 'centre' ? 'franchise' : payload.voie
  const formId: FormId =
    payload.voie === 'centre'
      ? 'demande_franchise'
      : payload.voie === 'organisme'
        ? 'demande_organisme'
        : 'demande_formateur'

  pushEvent({
    event: 'submit_network_interest',
    profile_type: profileType,
    form_id: formId
  })

  // Confirmation mesurable (ST-30) : la conversion quitte le dialog.
  await confirmConversion('candidature')
}
</script>
