<template>
  <div
    ref="summaryRef"
    :class="
      cn(
        'relative rounded-lg border border-rule bg-surface p-2 md:border-0 md:bg-transparent md:p-0',
        props.class
      )
    "
  >
    <div
      class="pointer-events-none absolute left-0 top-0 bottom-0 w-1 rounded-none bg-rule md:left-0"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute left-0 w-1 rounded-none bg-accent md:left-0"
      :class="hasMeasured ? 'transition-[top,height] duration-300 ease-out' : 'transition-none'"
      :style="indicatorStyle"
      aria-hidden="true"
    />
    <ul class="space-y-sm">
      <li v-for="section in sections" :key="section.id">
        <a
          :ref="(el) => setItemRef(el as HTMLElement | null, section.id)"
          :href="`#${section.id}`"
          :class="
            cn(
              'block rounded-none px-3 py-2 text-small transition',
              section.id === activeId
                ? 'bg-transparent font-medium text-primary'
                : 'text-ink-muted hover:bg-surface-soft hover:text-ink'
            )
          "
        >
          {{ section.title }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { cn } from '@/lib/utils'
import type { LegalPageSection } from '~/data/legal'

interface Props {
  sections: LegalPageSection[]
  activeId: string
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const summaryRef = ref<HTMLElement | null>(null)
const itemRefs = ref<Record<string, HTMLElement | null>>({})
const indicatorStyle = ref<{ top: string; height: string }>({ top: '0px', height: '0px' })
const hasMeasured = ref(false)

let resizeObserver: ResizeObserver | null = null

function setItemRef(el: HTMLElement | null, id: string) {
  itemRefs.value[id] = el
}

function updateIndicator() {
  const activeEl = itemRefs.value[props.activeId]
  const container = summaryRef.value
  if (!activeEl || !container) return

  const containerRect = container.getBoundingClientRect()
  const activeRect = activeEl.getBoundingClientRect()
  indicatorStyle.value = {
    top: `${activeRect.top - containerRect.top}px`,
    height: `${activeRect.height}px`
  }
  hasMeasured.value = true
}

onMounted(() => {
  updateIndicator()
  nextTick(updateIndicator)
  window.addEventListener('resize', updateIndicator)

  if (typeof ResizeObserver !== 'undefined' && summaryRef.value) {
    resizeObserver = new ResizeObserver(updateIndicator)
    resizeObserver.observe(summaryRef.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIndicator)
  resizeObserver?.disconnect()
})

watch(
  () => props.activeId,
  () => nextTick(updateIndicator)
)
</script>
