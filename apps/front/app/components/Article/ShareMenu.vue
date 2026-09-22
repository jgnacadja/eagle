<template>
  <DropdownMenuRoot :modal="false">
    <DropdownMenuTrigger as-child>
      <Button type="button" variant="icon-outline" size="icon-sm" aria-label="Partager l'article">
        <IconShare :size="18" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        align="end"
        :side-offset="8"
        class="z-50 min-w-52 rounded-md border border-rule bg-paper p-md text-ink shadow-md"
      >
        <DropdownMenuLabel class="px-sm py-xs text-overline font-bold uppercase text-ink-subtle">
          Partager l'article
        </DropdownMenuLabel>

        <DropdownMenuItem
          v-for="channel in channels"
          :key="channel.label"
          as-child
          class="rounded-sm outline-none data-highlighted:bg-surface data-highlighted:text-primary"
        >
          <a
            :href="channel.href"
            :target="channel.external ? '_blank' : undefined"
            :rel="channel.external ? 'noopener noreferrer' : undefined"
            class="flex cursor-pointer items-center gap-sm px-sm py-sm text-small text-ink-body"
          >
            <component :is="channel.icon" :size="16" class="shrink-0 text-ink-subtle" />
            {{ channel.label }}
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator class="my-xs h-px bg-rule" />

        <DropdownMenuItem
          v-if="canNativeShare"
          class="flex cursor-pointer items-center gap-sm rounded-sm px-sm py-sm text-small text-ink-body outline-none data-highlighted:bg-surface"
          @select="onNativeShare"
        >
          <IconMoreHorizontal :size="16" class="shrink-0 text-ink-subtle" />
          Plus d'options…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from 'reka-ui'
import IconFacebook from '~/components/icons/IconFacebook.vue'
import IconLinkedin from '~/components/icons/IconLinkedin.vue'
import IconMail from '~/components/icons/IconMail.vue'
import IconWhatsapp from '~/components/icons/IconWhatsapp.vue'
import IconX from '~/components/icons/IconX.vue'

const props = defineProps<{
  url: string
  title?: string
  text?: string
}>()

// Web Share API : mobile uniquement en pratique — détectée au mount.
const canNativeShare = ref(false)
onMounted(() => {
  canNativeShare.value = typeof navigator !== 'undefined' && !!navigator.share
})

const channels = computed(() => {
  const url = encodeURIComponent(props.url)
  const title = encodeURIComponent(props.title ?? '')
  const summary = encodeURIComponent([props.title, props.url].filter(Boolean).join(' '))
  return [
    {
      label: 'LinkedIn',
      icon: IconLinkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      external: true
    },
    {
      label: 'X (Twitter)',
      icon: IconX,
      href: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      external: true
    },
    {
      label: 'Facebook',
      icon: IconFacebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      external: true
    },
    {
      label: 'WhatsApp',
      icon: IconWhatsapp,
      href: `https://wa.me/?text=${summary}`,
      external: true
    },
    {
      label: 'E-mail',
      icon: IconMail,
      href: `mailto:?subject=${title}&body=${url}`,
      external: false
    }
  ]
})

function onNativeShare() {
  navigator.share({ title: props.title, text: props.text, url: props.url }).catch(() => {})
}
</script>
