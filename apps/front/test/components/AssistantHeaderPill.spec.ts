import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import AssistantHeaderPill from '~/components/Assistant/AssistantHeaderPill.vue'

const navigateMock = vi.fn()
const states = new Map<string, Ref<unknown>>()
let routePath = '/formations'

vi.stubGlobal('navigateTo', navigateMock)
vi.stubGlobal('useRoute', () => ({ path: routePath, fullPath: routePath }))
vi.stubGlobal('useState', (key: string, init?: () => unknown) => {
  if (!states.has(key)) states.set(key, ref(init?.()))
  return states.get(key)
})

describe('AssistantHeaderPill', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    states.clear()
    routePath = '/formations'
  })

  it('est masqué sur la Home et sur la page du moteur', () => {
    routePath = '/'
    expect(mount(AssistantHeaderPill).find('button').exists()).toBe(false)

    routePath = '/recherche-assistee'
    expect(mount(AssistantHeaderPill).find('button').exists()).toBe(false)
  })

  it('sur une page intérieure, ouvre le moteur au clic et mémorise le déclencheur', async () => {
    const wrapper = mount(AssistantHeaderPill)
    const button = wrapper.find('button#assistant-trigger-header')

    expect(button.text()).toContain('Décrivez votre besoin')
    await button.trigger('click')

    expect(navigateMock).toHaveBeenCalledWith({ path: '/recherche-assistee' })
    expect(states.get('assistant-origin')!.value).toEqual({
      path: '/formations',
      triggerId: 'assistant-trigger-header'
    })
  })
})
