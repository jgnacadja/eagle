import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ErrorPage from '~/error.vue'

const clearErrorMock = vi.fn()
vi.stubGlobal('clearError', clearErrorMock)

const mountError = (error?: { statusCode: number; statusMessage: string }) =>
  mount(ErrorPage, { props: { error } })

describe('error.vue', () => {
  it('affiche le code et le message de l’erreur', () => {
    const wrapper = mountError({ statusCode: 500, statusMessage: 'Erreur serveur' })
    expect(wrapper.text()).toContain('500')
    expect(wrapper.text()).toContain('Erreur serveur')
  })

  it('retombe sur 404 / Page introuvable sans erreur', () => {
    const wrapper = mountError()
    expect(wrapper.text()).toContain('404')
    expect(wrapper.text()).toContain('Page introuvable.')
  })

  it('retombe sur le message par défaut sans statusMessage', () => {
    const wrapper = mountError({ statusCode: 503, statusMessage: '' })
    expect(wrapper.text()).toContain('503')
    expect(wrapper.text()).toContain('Page introuvable.')
  })

  it('efface l’erreur et redirige vers l’accueil au clic', async () => {
    const wrapper = mountError({ statusCode: 404, statusMessage: 'X' })
    await wrapper.find('button').trigger('click')
    expect(clearErrorMock).toHaveBeenCalledWith({ redirect: '/' })
  })
})
