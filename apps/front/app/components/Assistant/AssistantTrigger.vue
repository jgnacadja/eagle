<template>
  <Button :id="id" type="button" :variant="variant" :size="size" :class="props.class" @click="open">
    <slot>Être guidé dans mon choix</slot>
  </Button>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '~/components/ui/button'
import { useAssistantNavigation } from '~/composables/useAssistantNavigation'

/**
 * Bouton « Être guidé dans mon choix » : ouvre la vue pleine page du moteur
 * IA depuis n'importe quelle page. L'id DOM est mémorisé avec la page
 * d'origine — le focus y revient à la fermeture du moteur.
 */
const props = withDefaults(
  defineProps<{
    /** Identifiant DOM stable, unique par emplacement (retour du focus). */
    id: string
    /** Requête initiale transmise au moteur (ex. recherche catalogue en cours). */
    query?: string
    variant?: ButtonVariants['variant']
    size?: ButtonVariants['size']
    class?: HTMLAttributes['class']
  }>(),
  { query: '', variant: 'default', size: 'pill-sm', class: undefined }
)

// `open` permet au conteneur (méga-menu, menu mobile) de se refermer.
const emit = defineEmits<{ open: [] }>()

const navigation = useAssistantNavigation()

function open(): Promise<void> {
  emit('open')
  return navigation.open({ query: props.query, triggerId: props.id })
}
</script>
