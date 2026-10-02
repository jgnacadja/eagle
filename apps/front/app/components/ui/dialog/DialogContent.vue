<template>
  <DialogPortal force-mount>
    <DialogOverlay class="dialog-overlay fixed inset-0 z-50 bg-ink/40" />
    <DialogContent
      v-bind="forwarded"
      :class="
        cn(
          'dialog-content fixed left-1/2 top-1/2 z-50 flex max-w-callout -translate-x-1/2 -translate-y-1/2 flex-col gap-md overflow-y-auto rounded-md border border-rule bg-paper p-xl text-ink shadow-lg',
          props.class
        )
      "
    >
      <slot />

      <DialogClose as-child>
        <Button variant="ghost" size="icon-sm" aria-label="Fermer" class="absolute right-md top-md">
          <IconClose :size="16" />
        </Button>
      </DialogClose>
    </DialogContent>
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
