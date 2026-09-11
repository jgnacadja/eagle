import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import NotFound from '~/components/ErrorState/NotFound.vue'

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  Button: { template: '<button><slot /></button>' },
  IconSparkle: { template: '<svg />' },
  SearchInput: {
    props: ['modelValue', 'inputId', 'srLabel', 'placeholder'],
    emits: ['update:modelValue', 'submit'],
    template:
      '<input :id="inputId" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown.enter="$emit(\'submit\', modelValue)" />'
  }
}

function mountNotFound(props: Record<string, unknown> = {}) {
  return mount(NotFound, {
    props: {
      title: 'Introuvable',
      primaryTo: '/formations',
      primaryLabel: 'Voir le catalogue',
      secondaryTo: '/centres',
      secondaryLabel: 'Voir les centres',
      ...props
    },
    slots: { default: "Cette page n'existe pas." },
    global: { stubs }
  })
}

describe('NotFound', () => {
  it('renders title, default slot and both links', () => {
    const wrapper = mountNotFound()

    expect(wrapper.find('h1').text()).toBe('Introuvable')
    expect(wrapper.text()).toContain("Cette page n'existe pas.")
    expect(wrapper.find('a[href="/formations"]').text()).toBe('Voir le catalogue')
    expect(wrapper.find('a[href="/centres"]').text()).toBe('Voir les centres')
  })

  it('links the title via aria-labelledby', () => {
    const wrapper = mountNotFound()

    const id = wrapper.find('h1').attributes('id')
    expect(id).toBeTruthy()
    expect(wrapper.find('section').attributes('aria-labelledby')).toBe(id)
  })

  it('hides the search form without searchPlaceholder', () => {
    expect(mountNotFound().find('form[role="search"]').exists()).toBe(false)
  })

  it('shows the search form and emits search with the query', async () => {
    const wrapper = mountNotFound({ searchPlaceholder: 'Décrivez votre besoin' })
    const input = wrapper.find('form[role="search"] input')

    await input.setValue('caces')
    await input.trigger('keydown.enter')

    expect(wrapper.emitted('search')).toEqual([['caces']])
  })

  it('uses searchInputId when provided and generates one otherwise', () => {
    const withId = mountNotFound({
      searchPlaceholder: 'Rechercher',
      searchInputId: 'custom-search'
    })
    expect(withId.find('input').attributes('id')).toBe('custom-search')

    const generated = mountNotFound({ searchPlaceholder: 'Rechercher' })
    expect(generated.find('input').attributes('id')).toMatch(/^error-search-/)
  })

  it('renders the visible search label linked to the input', () => {
    const wrapper = mountNotFound({
      searchPlaceholder: 'Rechercher',
      searchLabel: 'Rechercher une formation',
      searchInputId: 'formation-search'
    })

    const label = wrapper.find('label')
    expect(label.text()).toBe('Rechercher une formation')
    expect(label.attributes('for')).toBe('formation-search')
  })
})
