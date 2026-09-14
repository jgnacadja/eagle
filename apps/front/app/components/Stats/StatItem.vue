<template>
  <Motion
    :initial="{ opacity: 0, y: 14, scale: 0.96 }"
    :while-in-view="{ opacity: 1, y: 0, scale: 1 }"
    :in-view-options="{ once: true, margin: '0px 0px -10% 0px' }"
    :transition="{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }"
  >
    <p ref="numberEl" class="font-display text-h2 md:text-h1 font-extrabold text-ink">
      {{ displayed
      }}<span v-if="unit" class="text-h4 align-baseline text-ink-muted">{{ unit }}</span>
    </p>
    <p class="mt-xs text-small md:text-body font-medium text-ink-muted">
      {{ label }}
    </p>
  </Motion>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  animate,
  Motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion
} from 'motion-v'

const props = defineProps<{
  value: string
  unit?: string
  label: string
}>()

const numberEl = ref<HTMLElement>()
const displayed = ref(props.value)
const reduced = useReducedMotion()

// « +10 000 », « 4,7 » → préfixe non numérique + valeur, reformatée fr-FR
const parsed = computed(() => {
  const match = props.value.match(/^(\D*)([\d\s]*(?:[.,]\d+)?)/)
  if (!match?.[2]) return null
  const decimals = match[2].match(/[.,](\d+)$/)?.[1].length ?? 0
  const target = Number(match[2].replace(/\s/g, '').replace(',', '.'))
  if (!Number.isFinite(target)) return null
  const format = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
  return { prefix: match[1] ?? '', target, format }
})

const progress = useMotionValue(0)
useMotionValueEvent(progress, 'change', (v) => {
  if (!parsed.value) return
  displayed.value = `${parsed.value.prefix}${parsed.value.format.format(v)}`
})

const inView = useInView(numberEl, { once: true })
let controls: { stop: () => void } | undefined

watch(inView, (visible) => {
  if (!visible || reduced.value || !parsed.value) return
  controls = animate(progress, parsed.value.target, {
    duration: 1.1,
    ease: [0.16, 1, 0.3, 1]
  })
})

onBeforeUnmount(() => controls?.stop())
</script>
