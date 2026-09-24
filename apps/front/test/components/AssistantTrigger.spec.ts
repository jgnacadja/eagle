import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import AssistantTrigger from '~/components/Assistant/AssistantTrigger.vue'

const navigateMock = vi.fn()
const states = new Map<string, Ref<unknown>>()

vi.stubGlobal('navigateTo', navigateMock)
vi.stubGlobal('useRoute', () => ({ path: '/formations', fullPath: '/formations?q=sst' }))
vi.stubGlobal('useState', (key: string, init?: () => unknown) => {
  if (!states.has(key)) states.set(key, ref(init?.()))
  return states.get(key)
})

describe('AssistantTrigger', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    states.clear()
  })

  it('rend un bouton avec le libellé par défaut et l’id de retour du focus', () => {
    const wrapper = mount(AssistantTrigger, { props: { id: 'assistant-trigger-test' } })
    const button = wrapper.find('button#assistant-trigger-test')

    expect(button.exists()).toBe(true)
    expect(button.attributes('type')).toBe('button')
    expect(button.text()).toBe('Être guidé dans mon choix')
  })

  it('ouvre le moteur avec la requête, mémorise l’origine + le déclencheur et émet open', async () => {
    const wrapper = mount(AssistantTrigger, {
      props: { id: 'assistant-trigger-test', query: 'sst', variant: 'accent', size: 'pill' },
      slots: { default: 'Décrire mon besoin' }
    })

    expect(wrapper.text()).toBe('Décrire mon besoin')
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('open')).toHaveLength(1)
    expect(navigateMock).toHaveBeenCalledWith({
      path: '/recherche-assistee',
      query: { q: 'sst' }
    })
    expect(states.get('assistant-origin')!.value).toEqual({
      path: '/formations?q=sst',
      triggerId: 'assistant-trigger-test'
    })
  })
})
