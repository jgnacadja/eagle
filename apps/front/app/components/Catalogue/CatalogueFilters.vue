<template>
  <div>
    <div v-if="familyOptions.length">
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
        class="mt-md inline-block text-small font-semibold text-primary transition-colors hover:text-accent-text"
      >
        Toutes les familles <span class="link-arrow">→</span>
      </NuxtLink>
    </div>

    <div
      v-if="modalities !== undefined && modalityOptions.length"
      class="mt-lg border-t border-rule pt-lg"
    >
      <h3 class="text-meta font-bold tracking-wide text-ink-muted">Modalité</h3>
      <div class="mt-md flex flex-wrap gap-sm">
        <Button
          v-for="modality in modalityOptions"
          :key="modality.key"
          type="button"
          variant="outline"
          :aria-pressed="modalities.includes(modality.key)"
          :disabled="modality.disabled"
          class="h-auto rounded-full px-md py-xs text-small font-normal transition"
          :class="
            modalities.includes(modality.key)
              ? 'border-primary-dark bg-primary-dark font-semibold text-paper hover:bg-primary-dark hover:text-paper'
              : modality.disabled
                ? 'cursor-not-allowed border-rule bg-paper text-ink-subtle opacity-60 hover:border-rule hover:bg-paper hover:text-ink-subtle'
                : 'border-outline bg-paper text-ink-body hover:border-primary hover:bg-paper hover:text-ink-body'
          "
          @click="toggle(modalities, modality.key, (v) => (modalities = v))"
        >
          {{ modality.label }}
          <IconClose v-if="modalities.includes(modality.key)" :size="12" aria-hidden="true" />
        </Button>
      </div>
    </div>

    <div v-if="location !== undefined" class="mt-lg border-t border-rule pt-lg">
      <h3 class="text-meta font-bold tracking-wide text-ink-muted">Localisation</h3>
      <label :for="locationInputId" class="sr-only">Ville, département, région</label>
      <LocationSuggest v-model="location" :input-id="locationInputId" class="mt-md" />
    </div>

    <div v-if="durationOptions.length" class="mt-lg border-t border-rule pt-lg">
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

    <div
      v-if="certifications !== undefined && certificationOptions.length"
      class="mt-lg border-t border-rule pt-lg"
    >
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
import IconClose from '~/components/icons/IconClose.vue'
import type { FilterOption } from '~/utils/catalog-filters'
import { CERTIFICATION_OPTIONS, DURATION_OPTIONS, MODALITY_OPTIONS } from '~/utils/catalog-filters'

const props = withDefaults(
  defineProps<{
    familyOptions: FilterOption[]
    locationInputId?: string
    modalityOptions?: FilterOption[]
    durationOptions?: FilterOption[]
    certificationOptions?: FilterOption[]
  }>(),
  {
    locationInputId: undefined,
    modalityOptions: () => MODALITY_OPTIONS,
    durationOptions: () => DURATION_OPTIONS,
    certificationOptions: () => CERTIFICATION_OPTIONS
  }
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

const modalityOptions = computed(() => props.modalityOptions)
const durationOptions = computed(() => props.durationOptions)
const certificationOptions = computed(() => props.certificationOptions)

function toggle(list: string[], key: string, apply: (next: string[]) => void) {
  apply(list.includes(key) ? list.filter((item) => item !== key) : [...list, key])
}

function toggleFamily(key: string) {
  families.value = families.value.includes(key) ? [] : [key]
}
</script>
