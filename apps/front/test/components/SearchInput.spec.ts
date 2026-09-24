import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SearchInput from '~/components/ui/search-input/SearchInput.vue'

const InputStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template:
    '<input class="search-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
}

function mountInput(props: Record<string, unknown> = {}) {
  return mount(SearchInput, {
    props: { inputId: 'test-search', srLabel: 'Rechercher', ...props },
    global: {
      stubs: {
        Input: InputStub,
        Button: { template: '<button><slot /></button>' },
        IconClose: { template: '<span />' },
        IconSearch: { template: '<span />' }
      }
    }
  })
}

describe('SearchInput', () => {
  it('n’émet pas update:modelValue pendant la saisie', async () => {
    const wrapper = mountInput()

    await wrapper.find('.search-input').setValue('caces')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('émet input à chaque frappe sans toucher modelValue (autocomplétion)', async () => {
    const wrapper = mountInput()

    await wrapper.find('.search-input').setValue('ly')
    await wrapper.find('.search-input').setValue('lyo')

    expect(wrapper.emitted('input')).toEqual([['ly'], ['lyo']])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('ouvre la liste de suggestions à la frappe (combobox)', async () => {
    const wrapper = mountInput({ suggestions: ['Lyon (69)', 'Rhône (69)'] })
    const input = wrapper.find('.search-input')

    await input.setValue('ly')

    expect(wrapper.find('ul#test-search-suggestions').exists()).toBe(true)
    expect(wrapper.findAll('li button').map((o) => o.text())).toEqual(['Lyon (69)', 'Rhône (69)'])
    expect(input.attributes('role')).toBe('combobox')
    expect(input.attributes('aria-expanded')).toBe('true')
    // Pas d'attribut `list` natif : l'indicateur ▼ du navigateur ne s'affiche pas.
    expect(input.attributes('list')).toBeUndefined()
  })

  it('choisit une suggestion au clic : remplit le champ et soumet', async () => {
    const wrapper = mountInput({ suggestions: ['Lyon (69)', 'Rhône (69)'] })
    const input = wrapper.find('.search-input')

    await input.setValue('ly')
    await wrapper.findAll('li button')[1]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['Rhône (69)'])
    expect(wrapper.emitted('submit')).toEqual([['Rhône (69)']])
    expect(wrapper.find('ul#test-search-suggestions').exists()).toBe(false)
  })

  it('navigue au clavier : flèches puis Entrée choisissent la suggestion', async () => {
    const wrapper = mountInput({ suggestions: ['Lyon (69)', 'Rhône (69)'] })
    const input = wrapper.find('.search-input')

    await input.setValue('ly')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('submit')).toEqual([['Rhône (69)']])
  })

  it('Échap ferme la liste, Entrée soumet alors le texte brut', async () => {
    const wrapper = mountInput({ suggestions: ['Lyon (69)'] })
    const input = wrapper.find('.search-input')

    await input.setValue('lyo')
    await input.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('ul#test-search-suggestions').exists()).toBe(false)

    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('submit')).toEqual([['lyo']])
  })

  it('ne rend pas de listbox sans suggestions', async () => {
    const wrapper = mountInput()
    const input = wrapper.find('.search-input')

    await input.setValue('ly')

    expect(wrapper.find('ul#test-search-suggestions').exists()).toBe(false)
    expect(input.attributes('role')).toBeUndefined()
  })

  it('émet update:modelValue et submit à la touche Entrée', async () => {
    const wrapper = mountInput()

    await wrapper.find('.search-input').setValue('caces')
    await wrapper.find('.search-input').trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:modelValue')).toEqual([['caces']])
    expect(wrapper.emitted('submit')).toEqual([['caces']])
  })

  it('émet submit au clic sur le bouton de recherche', async () => {
    const wrapper = mountInput({ modelValue: 'sst' })

    const buttons = wrapper.findAll('button')
    await buttons[buttons.length - 1]!.trigger('click')

    expect(wrapper.emitted('submit')).toEqual([['sst']])
  })

  it('vide la recherche et émet submit vide au clic sur effacer', async () => {
    const wrapper = mountInput({ modelValue: 'sst' })

    const clearButton = wrapper.find('button[aria-label="Effacer la recherche"]')
    expect(clearButton.exists()).toBe(true)
    await clearButton.trigger('click')

    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(wrapper.emitted('submit')).toEqual([['']])
  })

  it('décline la pilule en taille hero (48px, bordure marine) sans perdre l’anneau de focus', () => {
    const wrapper = mountInput({ size: 'hero' })
    const pill = wrapper.find('.rounded-full')

    expect(pill.classes()).toContain('md:h-16')
    expect(pill.classes()).toContain('border-2')
    expect(pill.classes()).toContain('border-primary/75')
    expect(pill.classes()).not.toContain('h-control')
    expect(pill.classes()).toContain('focus-within:ring-primary/20')
  })

  it('se resynchronise quand modelValue change de l’extérieur', async () => {
    const wrapper = mountInput({ modelValue: 'sst' })

    await wrapper.setProps({ modelValue: '' })

    expect((wrapper.find('.search-input').element as HTMLInputElement).value).toBe('')
  })

  it('affiche l’anneau de focus au repos', () => {
    const wrapper = mountInput()

    expect(wrapper.find('.h-control').classes()).toContain('focus-within:ring-2')
    expect(wrapper.find('.h-control').classes()).toContain('border-outline')
  })

  describe('état loading', () => {
    it('désactive le champ et le bouton, masque le bouton effacer', () => {
      const wrapper = mountInput({ modelValue: 'sst', loading: true })

      expect(wrapper.find('.search-input').attributes('disabled')).toBeDefined()
      expect(
        wrapper.find('button[aria-label="Analyse de votre besoin en cours"]').attributes('disabled')
      ).toBeDefined()
      expect(wrapper.find('button[aria-label="Effacer la recherche"]').exists()).toBe(false)
    })

    it('affiche un spinner à la place de l’icône recherche', () => {
      const wrapper = mountInput({ loading: true })

      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })

    it('annonce le chargement via aria-live et retire l’anneau de focus', () => {
      const wrapper = mountInput({ loading: true })

      expect(wrapper.find('output').text()).toContain('Analyse de votre besoin en cours')
      expect(wrapper.find('.h-control').classes()).not.toContain('focus-within:ring-2')
    })

    it('n’émet rien si submit est déclenché pendant le chargement', async () => {
      const wrapper = mountInput({ modelValue: 'sst', loading: true })

      await wrapper.find('.search-input').trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('submit')).toBeUndefined()
    })
  })

  describe('état erreur de saisie', () => {
    it('affiche le message, la bordure danger et les attributs aria liés', () => {
      const wrapper = mountInput({
        errorMessage: 'Décrivez votre besoin pour lancer la recherche.'
      })

      const input = wrapper.find('.search-input')
      const error = wrapper.find('#test-search-error')

      expect(wrapper.find('.h-control').classes()).toContain('border-danger')
      expect(input.attributes('aria-invalid')).toBe('true')
      expect(input.attributes('aria-describedby')).toBe('test-search-error')
      expect(error.exists()).toBe(true)
      expect(error.text()).toBe('Décrivez votre besoin pour lancer la recherche.')
      expect(error.classes()).toContain('text-danger')
    })

    it('retire l’anneau de focus en erreur', () => {
      const wrapper = mountInput({ errorMessage: 'Champ requis' })

      expect(wrapper.find('.h-control').classes()).not.toContain('focus-within:ring-2')
    })
  })
})
