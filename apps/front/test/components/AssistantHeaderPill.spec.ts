import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import AssistantHeaderPill from '~/components/Assistant/HeaderPill.vue'
import { useAssistantLauncher } from '~/composables/useAssistantLauncher'

const routeMock = (globalThis as Record<string, unknown>).useRoute as () => { path: string }

describe('AssistantHeaderPill', () => {
  beforeEach(() => {
    routeMock().path = '/formations'
    const launcher = useAssistantLauncher()
    launcher.isOpen.value = false
    launcher.pendingMessage.value = null
    launcher.context.value = {}
  })

  afterEach(() => {
    routeMock().path = '/'
  })

  it('est masqué sur la Home et sur la page du moteur', () => {
    routeMock().path = '/'
    expect(mount(AssistantHeaderPill).find('button').exists()).toBe(false)

    routeMock().path = '/recherche-assistee'
    expect(mount(AssistantHeaderPill).find('button').exists()).toBe(false)
  })

  it('sur une page intérieure, ouvre la recherche assistée depuis le header', async () => {
    const launcher = useAssistantLauncher()
    const wrapper = mount(AssistantHeaderPill)
    const button = wrapper.find('button')

    expect(button.text()).toBe('Décrivez votre besoin…')
    await button.trigger('click')

    expect(launcher.isOpen.value).toBe(true)
    expect(launcher.context.value).toEqual({ source: 'header' })
    expect(launcher.pendingMessage.value).toBeNull()
  })
})
