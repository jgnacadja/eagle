import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CatalogueFilters from '~/components/Catalogue/CatalogueFilters.vue'

const stubs = {
  NuxtLink: { template: '<a><slot /></a>' },
  IconMapPin: { template: '<svg />' },
  IconClose: { template: '<svg />' },
  Button: { template: '<button type="button"><slot /></button>' },
  Label: { template: '<label><slot /></label>' },
  Checkbox: {
    props: ['modelValue', 'id'],
    emits: ['update:modelValue'],
    template:
      '<button type="button" role="checkbox" :id="id" :aria-checked="modelValue" @click="$emit(\'update:modelValue\', !modelValue)" />'
  }
}

const familyOptions = [
  { key: 'caces', label: "CACES & conduite d'engins", count: 3 },
  { key: 'securite', label: 'Sécurité & prévention', count: 2 }
]

function mountFilters(models: Record<string, unknown> = {}) {
  return mount(CatalogueFilters, {
    props: {
      familyOptions,
      families: [],
      modalities: [],
      location: '',
      durations: [],
      certifications: [],
      ...models
    },
    global: { stubs }
  })
}

describe('CatalogueFilters', () => {
  it('renders family options with counts', () => {
    const wrapper = mountFilters()

    expect(wrapper.text()).toContain("CACES & conduite d'engins")
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('Sécurité & prévention')
  })

  it('emits updated families when a checkbox is toggled', async () => {
    const wrapper = mountFilters()

    await wrapper.find('[role="checkbox"]').trigger('click')

    expect(wrapper.emitted('update:families')?.[0]).toEqual([['caces']])
  })

  it('emits updated families when a checkbox is toggled off', async () => {
    const wrapper = mountFilters({ families: ['caces'] })

    await wrapper.find('[role="checkbox"]').trigger('click')

    expect(wrapper.emitted('update:families')?.[0]).toEqual([[]])
  })

  it('emits updated modalities when a pill is clicked', async () => {
    const wrapper = mountFilters()

    const presentiel = wrapper.findAll('button').find((b) => b.text() === 'Présentiel')
    await presentiel?.trigger('click')

    expect(wrapper.emitted('update:modalities')?.[0]).toEqual([['presentiel']])
  })

  it('emits updated durations when a checkbox is toggled', async () => {
    const wrapper = mountFilters()

    const courte = wrapper.findAll('[role="checkbox"]').find((b) => {
      const label = b.attributes('id')?.replace('duration-', '')
      return label === 'courte'
    })

    await courte?.trigger('click')

    expect(wrapper.emitted('update:durations')?.[0]).toEqual([['courte']])
  })

  it('emits updated certifications when a checkbox is toggled', async () => {
    const wrapper = mountFilters()

    const habilitation = wrapper.findAll('[role="checkbox"]').find((b) => {
      const label = b.attributes('id')?.replace('certification-', '')
      return label === 'habilitation'
    })

    await habilitation?.trigger('click')

    expect(wrapper.emitted('update:certifications')?.[0]).toEqual([['habilitation']])
  })

  it('binds the location input to the location model', async () => {
    const wrapper = mountFilters()

    await wrapper.find('input[type="text"]').setValue('Île-de-France')

    expect(wrapper.emitted('update:location')?.[0]).toEqual(['Île-de-France'])
  })

  it('clears the location when the clear button is clicked', async () => {
    const wrapper = mountFilters({ location: 'Île-de-France' })

    const clearButton = wrapper.find('[aria-label="Effacer la localisation"]')
    await clearButton.trigger('click')

    expect(wrapper.emitted('update:location')?.[0]).toEqual([''])
  })
})
