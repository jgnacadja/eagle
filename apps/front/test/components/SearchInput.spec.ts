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

  it('émet update:modelValue et submit à la touche Entrée', async () => {
    const wrapper = mountInput()

    await wrapper.find('.search-input').setValue('caces')
    await wrapper.find('.search-input').trigger('keydown.enter')

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

    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(wrapper.emitted('submit')).toEqual([['']])
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

      await wrapper.find('.search-input').trigger('keydown.enter')

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
