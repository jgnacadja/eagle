<template>
  <div>
    <div>
      <h3 class="text-meta font-bold tracking-wide text-ink-muted">Famille</h3>
      <ul class="mt-md space-y-sm">
        <li
          v-for="family in familyOptions"
          :key="family.key"
          class="flex items-center justify-between"
        >
          <div class="flex items-center gap-sm">
            <Checkbox
              :id="`family-${family.key}`"
              :model-value="families.includes(family.key)"
              class="h-md w-md rounded border-outline data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-paper"
              @update:model-value="toggleFamily(family.key)"
            />
            <Label :for="`family-${family.key}`" class="text-small font-normal text-ink-body">
              {{ family.label }}
            </Label>
          </div>
          <span class="text-meta text-ink-subtle">{{ family.count }}</span>
        </li>
      </ul>
      <NuxtLink
        to="#"
        class="mt-md inline-block text-small font-semibold text-primary hover:underline"
      >
        Toutes les familles →
      </NuxtLink>
    </div>

    <div v-if="modalities !== undefined" class="mt-lg border-t border-rule pt-lg">
      <h3 class="text-meta font-bold tracking-wide text-ink-muted">Modalité</h3>
      <div class="mt-md flex flex-wrap gap-sm">
        <Button
          v-for="modality in modalityOptions"
          :key="modality.key"
          type="button"
          variant="outline"
          :aria-pressed="modalities.includes(modality.key)"
          class="h-auto rounded-full px-md py-xs text-small font-normal transition"
          :class="
            modalities.includes(modality.key)
              ? 'border-primary bg-primary font-semibold text-paper hover:bg-primary hover:text-paper'
              : 'border-outline bg-paper text-ink-body hover:border-primary hover:bg-paper hover:text-ink-body'
          "
          @click="toggle(modalities, modality.key, (v) => (modalities = v))"
        >
          {{ modality.label }}
        </Button>
      </div>
    </div>

    <div v-if="location !== undefined" class="mt-lg border-t border-rule pt-lg">
      <h3 class="text-meta font-bold tracking-wide text-ink-muted">Localisation</h3>
      <label :for="locationInputId" class="sr-only">Ville, département, région</label>
      <div class="mt-md flex items-center gap-sm rounded-full border border-outline px-md py-sm">
        <IconMapPin :size="16" class="shrink-0 text-ink-subtle" />
        <input
          :id="locationInputId"
          v-model="location"
          type="text"
          placeholder="Ville, département, région"
          class="min-w-0 flex-1 border-0 bg-transparent text-small text-ink-body placeholder:text-ink-placeholder focus:outline-none focus:ring-0"
        />
        <button
          v-if="location"
          type="button"
          class="text-ink-subtle hover:text-ink"
          aria-label="Effacer la localisation"
          @click="location = ''"
        >
          <IconClose :size="14" />
        </button>
      </div>
    </div>

    <div class="mt-lg border-t border-rule pt-lg">
      <h3 class="text-meta font-bold tracking-wide text-ink-muted">Durée</h3>
      <ul class="mt-md space-y-sm">
        <li v-for="duration in durationOptions" :key="duration.key">
          <div class="flex items-center gap-sm">
            <Checkbox
              :id="`duration-${duration.key}`"
              :model-value="durations.includes(duration.key)"
              class="h-md w-md rounded border-outline data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-paper"
              @update:model-value="toggle(durations, duration.key, (v) => (durations = v))"
            />
            <Label :for="`duration-${duration.key}`" class="text-small font-normal text-ink-body">
              {{ duration.label }}
            </Label>
          </div>
        </li>
      </ul>
    </div>

    <div v-if="certifications !== undefined" class="mt-lg border-t border-rule pt-lg">
      <h3 class="text-meta font-bold tracking-wide text-ink-muted">Certification</h3>
      <ul class="mt-md space-y-sm">
        <li v-for="certification in certificationOptions" :key="certification.key">
          <div class="flex items-center gap-sm">
            <Checkbox
              :id="`certification-${certification.key}`"
              :model-value="certifications.includes(certification.key)"
              class="h-md w-md rounded border-outline data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-paper"
              @update:model-value="
                toggle(certifications, certification.key, (v) => (certifications = v))
              "
            />
            <Label
              :for="`certification-${certification.key}`"
              class="text-small font-normal text-ink-body"
            >
              {{ certification.label }}
            </Label>
          </div>
        </li>
      </ul>
    </div>

    <div v-if="cpf !== undefined" class="mt-lg border-t border-rule pt-lg">
      <div class="flex items-center gap-sm">
        <Checkbox
          id="filter-cpf"
          :model-value="cpf"
          class="h-md w-md rounded border-outline data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-paper"
          @update:model-value="(v) => (cpf = v as boolean)"
        />
        <Label for="filter-cpf" class="text-small font-normal text-ink-body"> Éligible CPF </Label>
      </div>
    </div>

    <div v-if="certifying !== undefined" class="mt-lg border-t border-rule pt-lg">
      <div class="flex items-center gap-sm">
        <Checkbox
          id="filter-certifying"
          :model-value="certifying"
          class="h-md w-md rounded border-outline data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-paper"
          @update:model-value="(v) => (certifying = v as boolean)"
        />
        <Label for="filter-certifying" class="text-small font-normal text-ink-body">
          Formation certifiante
        </Label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import type { FilterOption } from '~/utils/catalog-filters'
import { CERTIFICATION_OPTIONS, DURATION_OPTIONS, MODALITY_OPTIONS } from '~/utils/catalog-filters'

const props = withDefaults(
  defineProps<{
    familyOptions: FilterOption[]
    locationInputId?: string
  }>(),
  { locationInputId: undefined }
)

const families = defineModel<string[]>('families', { required: true })
const modalities = defineModel<string[] | undefined>('modalities')
const location = defineModel<string | undefined>('location')
const durations = defineModel<string[]>('durations', { required: true })
const certifications = defineModel<string[] | undefined>('certifications')
const cpf = defineModel<boolean | undefined>('cpf')
const certifying = defineModel<boolean | undefined>('certifying')

const fallbackId = useId()
const locationInputId = computed(() => props.locationInputId ?? `loc-${fallbackId}`)

const modalityOptions = MODALITY_OPTIONS
const durationOptions = DURATION_OPTIONS
const certificationOptions = CERTIFICATION_OPTIONS

function toggle(list: string[], key: string, apply: (next: string[]) => void) {
  apply(list.includes(key) ? list.filter((item) => item !== key) : [...list, key])
}

function toggleFamily(key: string) {
  families.value = families.value.includes(key) ? [] : [key]
}
</script>
