import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LoadError from '~/components/ErrorState/LoadError.vue'

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  Button: { template: '<button><slot /></button>' },
  IconRefresh: { template: '<svg />' }
}

function mountError(props: Record<string, unknown> = {}) {
  return mount(LoadError, {
    props: {
      title: 'Erreur de chargement',
      linkTo: '/formations',
      linkLabel: 'Voir le catalogue',
      ...props
    },
    slots: { default: 'Le problème est temporaire.' },
    global: { stubs }
  })
}

describe('LoadError', () => {
  it('renders title, default slot and link', () => {
    const wrapper = mountError()

    expect(wrapper.find('h1').text()).toBe('Erreur de chargement')
    expect(wrapper.text()).toContain('Le problème est temporaire.')
    expect(wrapper.find('a[href="/formations"]').text()).toBe('Voir le catalogue')
  })

  it('links the title via aria-labelledby', () => {
    const wrapper = mountError()

    const id = wrapper.find('h1').attributes('id')
    expect(id).toBeTruthy()
    expect(wrapper.find('section').attributes('aria-labelledby')).toBe(id)
  })

  it('emits retry when the retry button is clicked', async () => {
    const wrapper = mountError()

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('uses the default retry label and supports an override', () => {
    expect(mountError().text()).toContain('Réessayer')
    expect(mountError({ retryLabel: 'Recharger' }).text()).toContain('Recharger')
  })
})
