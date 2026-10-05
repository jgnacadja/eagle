<template>
  <Card class="motion-surface relative flex h-full flex-col hover:border-primary/40">
    <CardHeader class="space-y-sm p-md pb-0">
      <p v-if="eyebrow" class="mb-md text-overline text-ink-subtle font-bold">{{ eyebrow }}</p>
      <p v-if="overline" class="text-overline text-accent-text uppercase">{{ overline }}</p>
      <CardTitle class="font-sans text-h4 font-extrabold leading-tight tracking-normal text-ink">
        {{ title }}
      </CardTitle>
    </CardHeader>
    <CardContent class="flex-1 px-md py-sm">
      <p v-if="description" class="flex-1 text-small text-ink-body">
        {{ description }}
      </p>
      <CardDescription>{{ meta }}</CardDescription>
    </CardContent>
    <CardFooter class="mt-auto flex flex-col items-start px-md pb-md pt-sm">
      <Badge v-if="status" :variant="status.type" class="w-fit flex justify-center items-center">
        <span
          v-if="status.type !== 'warning'"
          class="h-sm w-sm rounded-full bg-current p-1"
          aria-hidden="true"
        />
        <span v-else aria-hidden="true">▲</span>
        <span class="hidden md:inline">{{ status.label }}</span>
        <span class="md:hidden">{{ status.labelShort ?? status.label }}</span>
      </Badge>
      <Button
        v-if="to && variant === 'button'"
        as-child
        size="pill-sm"
        class="mt-md w-full px-lg font-bold"
      >
        <NuxtLink :to="to" class="after:absolute after:inset-0" @click="onClick"
          >Voir la formation</NuxtLink
        >
      </Button>
      <Button
        v-else-if="to"
        as-child
        variant="link"
        size="inline"
        class="gap-xs font-bold"
        :class="variant === 'similar' ? 'mt-0 self-start' : 'mt-md self-end'"
      >
        <NuxtLink :to="to" class="after:absolute after:inset-0" @click="onClick"
          >Consulter <span class="link-arrow">→</span></NuxtLink
        >
      </Button>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDataLayer } from '~/composables/useDataLayer'

const props = withDefaults(
  defineProps<{
    /** Sous-famille affichée en surtitre — sauf variante `similar` (famille). */
    subFamily: string | null
    title: string
    description?: string
    meta: string
    status?: { type: 'success' | 'warning' | 'neutral'; label: string; labelShort?: string }
    to?: string
    eyebrow?: string
    /** `similar` : carte « formations similaires » — surtitre = famille. */
    variant?: 'default' | 'button' | 'similar'
    /** Famille affichée en surtitre pour la variante `similar`. */
    family?: string
    centerId?: string
    centerName?: string
    centerCity?: string
    listName?: string
    position?: number
  }>(),
  {
    to: undefined,
    description: '',
    status: undefined,
    eyebrow: '',
    variant: 'default',
    family: '',
    centerId: undefined,
    centerName: undefined,
    centerCity: undefined,
    listName: undefined,
    position: undefined
  }
)

const { pushEvent } = useDataLayer()

function onClick() {
  const formationId = props.to ? props.to.split('/').pop() || props.title : props.title
  const formationFamily = props.family || props.subFamily || ''

  if (props.centerId && props.centerName) {
    pushEvent({
      event: 'select_formation_centre',
      center_id: props.centerId,
      center_name: props.centerName,
      center_city: props.centerCity,
      formation_id: formationId,
      formation_name: props.title,
      formation_family: formationFamily,
      list_name: props.listName || 'formations_centre',
      position: props.position
    })
  } else {
    pushEvent({
      event: 'select_formation_card',
      formation_id: formationId,
      formation_name: props.title,
      formation_family: formationFamily,
      list_name:
        props.variant === 'similar'
          ? 'formations_similaires'
          : props.listName || 'formations_centre',
      position: props.position
    })
  }
}

const overline = computed(() => (props.variant === 'similar' ? props.family : props.subFamily))
</script>
