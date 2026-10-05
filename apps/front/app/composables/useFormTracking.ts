import { ref, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import { useDataLayer } from '~/composables/useDataLayer'
import type { FormId } from '~/types/analytics'

export interface FormTrackingOptions {
  formId: FormId | (() => FormId)
  formName: string | (() => string)
  totalSteps?: number
  totalFields?: number
}

/**
 * Composable pour orchestrer le cycle de vie de tracking d'un formulaire :
 * - form_view (à l'affichage de chaque étape via trackFormView)
 * - form_start (au premier focus / interaction)
 * - form_error (en cas d'erreur de validation)
 * - form_submit (lors de la soumission réussie)
 * - form_abandon (si l'utilisateur quitte sans soumettre)
 */
export function useFormTracking(options: FormTrackingOptions) {
  const { pushEvent } = useDataLayer()

  const startTime = ref<number | null>(null)
  const isStarted = ref(false)
  const isSubmitted = ref(false)
  const currentStep = ref<number | string>(1)
  const currentStepName = ref<string | undefined>()
  const lastFieldFilled = ref<string | undefined>()
  const completedFields = ref<Set<string>>(new Set())

  const getFormId = (): FormId =>
    typeof options.formId === 'function' ? options.formId() : options.formId

  const getFormName = (): string =>
    typeof options.formName === 'function' ? options.formName() : options.formName

  /**
   * Événement form_view : appelé lors de l'affichage du formulaire ou d'une étape
   */
  function trackFormView(step: number | string = 1, stepName?: string) {
    currentStep.value = step
    currentStepName.value = stepName

    pushEvent({
      event: 'form_view',
      form_id: getFormId(),
      form_name: getFormName(),
      form_step: step,
      form_step_name: stepName,
      page_path: typeof window !== 'undefined' ? window.location.pathname : ''
    })
  }

  /**
   * Événement form_start : déclenché au premier champ touché
   */
  function trackFormStart(fieldName: string, step: number | string = currentStep.value) {
    if (isStarted.value) return

    isStarted.value = true
    startTime.value = Date.now()
    lastFieldFilled.value = fieldName
    completedFields.value.add(fieldName)

    pushEvent({
      event: 'form_start',
      form_id: getFormId(),
      form_name: getFormName(),
      form_step: step,
      field_name: fieldName
    })
  }

  /**
   * Enregistre un champ complété ou modifié
   */
  function trackFieldInteraction(fieldName: string) {
    if (!isStarted.value) {
      trackFormStart(fieldName)
    } else {
      lastFieldFilled.value = fieldName
      completedFields.value.add(fieldName)
    }
  }

  /**
   * Événement form_error : déclenché lors d'un échec de validation
   */
  function trackFormError(fieldName: string, errorMessage: string, errorType = 'validation') {
    pushEvent({
      event: 'form_error',
      form_id: getFormId(),
      form_name: getFormName(),
      form_step: currentStep.value,
      field_name: fieldName,
      error_type: errorType,
      error_message: errorMessage
    })
  }

  /**
   * Événement form_submit : déclenché uniquement lors de la soumission réussie
   */
  function trackFormSubmit(formType?: string) {
    isSubmitted.value = true
    const durationSeconds = startTime.value ? Math.round((Date.now() - startTime.value) / 1000) : 0

    pushEvent({
      event: 'form_submit',
      form_id: getFormId(),
      form_name: getFormName(),
      form_type: formType,
      steps_count: options.totalSteps,
      completion_time_seconds: durationSeconds
    })
  }

  /**
   * Événement form_abandon : si quitté après avoir commencé sans soumission
   */
  function trackFormAbandon() {
    if (!isStarted.value || isSubmitted.value) return

    const durationSeconds = startTime.value ? Math.round((Date.now() - startTime.value) / 1000) : 0

    pushEvent({
      event: 'form_abandon',
      form_id: getFormId(),
      form_name: getFormName(),
      form_step_reached: currentStep.value,
      last_field_filled: lastFieldFilled.value,
      fields_completed_count: completedFields.value.size,
      fields_total_count: options.totalFields ?? completedFields.value.size,
      time_spent_seconds: durationSeconds
    })
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      // Pas de double émission : chaque composant appelant déclenche trackFormView avec son étape et libellé
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', trackFormAbandon)
      }
    })

    onBeforeUnmount(() => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', trackFormAbandon)
      }
      trackFormAbandon()
    })
  }

  return {
    trackFormView,
    trackFormStart,
    trackFieldInteraction,
    trackFormError,
    trackFormSubmit,
    trackFormAbandon
  }
}
