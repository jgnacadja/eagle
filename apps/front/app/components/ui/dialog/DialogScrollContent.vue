<template>
  <DialogPortal force-mount>
    <DialogOverlay
      class="dialog-overlay fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/40"
    >
      <DialogContent
        :class="
          cn(
            'dialog-scroll-content relative z-50 my-8 grid w-full max-w-callout gap-md border border-rule bg-paper p-xl text-ink shadow-lg rounded-md md:w-full',
            props.class
          )
        "
        v-bind="forwarded"
        @pointer-down-outside="
          (event) => {
            const originalEvent = event.detail.originalEvent
            const target = originalEvent.target as HTMLElement
            if (
              originalEvent.offsetX > target.clientWidth ||
              originalEvent.offsetY > target.clientHeight
            ) {
              event.preventDefault()
            }
          }
        "
      >
        <slot />

        <DialogClose as-child>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Fermer"
            class="absolute right-md top-md"
          >
            <IconClose :size="16" />
          </Button>
        </DialogClose>
      </DialogContent>
    </DialogOverlay>
  </DialogPortal>
</template>

<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<DialogContentProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>
