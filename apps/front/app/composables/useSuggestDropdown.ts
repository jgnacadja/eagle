import { ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

/**
 * État d'une liste de suggestions (pattern combobox) : ouverture, option
 * active au clavier, fermeture. `pick(index)` est appelé sur Entrée quand
 * une option est active — le clic est géré par `SuggestList` elle-même.
 */
export function useSuggestDropdown(
  list: MaybeRefOrGetter<readonly unknown[]>,
  pick: (index: number) => void
) {
  const isOpen = ref(false)
  const activeIndex = ref(-1)

  // Une nouvelle liste de suggestions réinitialise la sélection clavier.
  watch(
    () => toValue(list),
    () => {
      activeIndex.value = -1
    }
  )

  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    activeIndex.value = -1
  }

  /**
   * Navigation clavier de la liste. Retourne `true` quand l'événement est
   * consommé — l'appelant ne doit pas enchaîner sur son propre traitement
   * (submit au Enter, etc.).
   */
  function onKeydown(event: KeyboardEvent): boolean {
    if (!isOpen.value || toValue(list).length === 0) return false
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      activeIndex.value = (activeIndex.value + 1) % toValue(list).length
      return true
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      activeIndex.value = (activeIndex.value - 1 + toValue(list).length) % toValue(list).length
      return true
    }
    if (event.key === 'Enter' && activeIndex.value >= 0) {
      event.preventDefault()
      pick(activeIndex.value)
      return true
    }
    if (event.key === 'Escape') {
      close()
      return true
    }
    return false
  }

  return { isOpen, activeIndex, open, close, onKeydown }
}
