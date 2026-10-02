import { ref, onMounted, onUnmounted, watch, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

export interface UseAnimatedPlaceholderOptions {
  /**
   * Durée d'affichage du texte complet avant d'entamer l'effacement (en ms).
   * @default 2600
   */
  holdDuration?: number

  /**
   * Vitesse de frappe de chaque caractère (en ms).
   * @default 20
   */
  typingSpeed?: number

  /**
   * Vitesse d'effacement de chaque caractère (en ms).
   * @default 12
   */
  deletingSpeed?: number

  /**
   * Pause entre l'effacement et le début de frappe du texte suivant (en ms).
   * @default 400
   */
  pauseDuration?: number

  /**
   * Préserve un préfixe commun (ex. "Ex. : ") pour ne pas l'effacer et le réécrire à chaque cycle.
   * - `true` (défaut) : calcule automatiquement le préfixe partagé par tous les textes
   * - `string` : utilise explicitement le préfixe fourni
   * - `false` : efface l'intégralité du texte
   * @default true
   */
  preservePrefix?: boolean | string
}

/**
 * Calcule le plus long préfixe commun à une liste de chaînes.
 */
export function findCommonPrefix(strings: readonly string[]): string {
  if (strings.length === 0) return ''
  let prefix = strings[0] ?? ''
  for (let i = 1; i < strings.length; i++) {
    const current = strings[i] ?? ''
    while (!current.startsWith(prefix)) {
      prefix = prefix.slice(0, -1)
      if (!prefix) return ''
    }
  }
  return prefix
}

/**
 * Composable qui anime le placeholder d'un champ de recherche avec un effet
 * "machine à écrire" (typewriter) cyclant sur une liste de textes d'exemples.
 *
 * - SSR-safe : initialise la valeur avec le premier texte complet (aucun décalage d'hydratation).
 * - Réactif : se synchronise avec les changements de textsInput si passé en ref ou getter.
 * - Respecte prefers-reduced-motion en conservant le premier texte statique.
 * - Met en pause l'animation quand l'onglet passe en arrière-plan (Page Visibility API).
 * - Nettoie proprement les timers au démontage du composant.
 */
export function useAnimatedPlaceholder(
  textsInput: MaybeRefOrGetter<readonly string[]>,
  options: UseAnimatedPlaceholderOptions = {}
): Ref<string> {
  const {
    holdDuration = 2600,
    typingSpeed = 20,
    deletingSpeed = 12,
    pauseDuration = 400,
    preservePrefix = true
  } = options

  let texts = toValue(textsInput)
  const initialText = texts[0] ?? ''
  const placeholder = ref(initialText)

  let timer: ReturnType<typeof setTimeout> | null = null
  let textIndex = 0
  let isDeleting = true
  let isMounted = false

  function hasMultipleDistinctTexts(list: readonly string[]): boolean {
    if (list.length <= 1) return false
    const first = list[0]
    return list.some((t) => t !== first)
  }

  function computePrefix(list: readonly string[]): string {
    let p = ''
    if (typeof preservePrefix === 'string') {
      p = preservePrefix
    } else if (preservePrefix === true) {
      p = findCommonPrefix(list)
    }

    // Si un préfixe n'est pas partagé par tous les textes, repli sur une suppression complète.
    if (p && !list.every((t) => t.startsWith(p))) {
      p = ''
    }
    return p
  }

  let prefix = computePrefix(texts)

  function getTargetText(): string {
    return texts[textIndex] ?? ''
  }

  function step() {
    const target = getTargetText()
    const current = placeholder.value

    if (isDeleting) {
      if (current.length > prefix.length) {
        placeholder.value = current.slice(0, -1)
        timer = setTimeout(step, deletingSpeed)
      } else {
        isDeleting = false
        textIndex = (textIndex + 1) % texts.length
        timer = setTimeout(step, pauseDuration)
      }
    } else {
      if (current.length < target.length) {
        placeholder.value = target.slice(0, current.length + 1)
        timer = setTimeout(step, typingSpeed)
      } else {
        isDeleting = true
        timer = setTimeout(step, holdDuration)
      }
    }
  }

  function start() {
    stop()
    if (!hasMultipleDistinctTexts(texts)) {
      return
    }
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    ) {
      return
    }
    timer = setTimeout(step, holdDuration)
  }

  function stop() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function reset(newTexts: readonly string[]) {
    texts = newTexts
    textIndex = 0
    isDeleting = true
    prefix = computePrefix(texts)
    placeholder.value = texts[0] ?? ''
    stop()
    if (isMounted) {
      start()
    }
  }

  watch(
    () => toValue(textsInput),
    (newTexts) => {
      reset(newTexts)
    },
    { deep: true }
  )

  function onVisibilityChange() {
    if (typeof document === 'undefined') return
    if (document.hidden) {
      stop()
    } else {
      start()
    }
  }

  onMounted(() => {
    isMounted = true
    start()
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange)
    }
  })

  onUnmounted(() => {
    isMounted = false
    stop()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  })

  return placeholder
}
