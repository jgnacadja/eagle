import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AssistantChat from '~/components/Assistant/Chat.vue'
import { useAssistantLauncher } from '~/composables/useAssistantLauncher'

const fetchMock = vi.fn()

vi.stubGlobal('$fetch', fetchMock)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.stubGlobal('logServerError', vi.fn())
vi.stubGlobal('internalSsrHeaders', () => undefined)

const conversationStub = {
  name: 'AssistantConversation',
  props: ['entries', 'pending', 'unavailable', 'contextChips'],
  emits: ['send', 'edit', 'stop', 'retry', 'reset', 'close'],
  template:
    '<div class="conversation">' +
    '<button class="stop" @click="$emit(\'stop\')" />' +
    '<button class="reset" @click="$emit(\'reset\')" />' +
    '<button class="close" @click="$emit(\'close\')" />' +
    '</div>'
}

function mountChat() {
  return mount(AssistantChat, { global: { stubs: { AssistantConversation: conversationStub } } })
}

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue({ kind: 'clarify', text: 'ok' })
  const launcher = useAssistantLauncher()
  launcher.isOpen.value = false
  launcher.pendingMessage.value = null
  launcher.context.value = {}
})

describe('AssistantChat', () => {
  it('shows a floating launcher and opens the panel', async () => {
    const wrapper = mountChat()
    const launcher = wrapper.find('button[aria-label="Ouvrir la recherche assistée"]')
    expect(launcher.exists()).toBe(true)
    expect(wrapper.find('dialog').exists()).toBe(false)

    await launcher.trigger('click')
    expect(wrapper.find('dialog').exists()).toBe(true)
  })

  it('greets the user when opened without a message', () => {
    const launcher = useAssistantLauncher()
    launcher.open()
    const wrapper = mountChat()

    const entries = wrapper.findComponent(conversationStub).props('entries')
    expect(entries).toHaveLength(1)
    expect(entries[0].role).toBe('assistant')
    expect(entries[0].content).toContain('Bonjour')
  })

  it('sends the queued entry-point message on open', async () => {
    const launcher = useAssistantLauncher()
    launcher.open({ context: { source: 'centre', location: 'Créteil' }, message: 'former au SST' })
    const wrapper = mountChat()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())

    const entries = wrapper.findComponent(conversationStub).props('entries')
    expect(entries[0]).toMatchObject({ role: 'user', content: 'former au SST' })
    const body = fetchMock.mock.calls[0]?.[1]?.body
    expect(body.context).toEqual({ source: 'centre', location: 'Créteil' })
  })

  it('sends a message queued while the panel is already open', async () => {
    const launcher = useAssistantLauncher()
    launcher.open()
    const wrapper = mountChat()
    await vi.waitFor(() => expect(wrapper.find('dialog').exists()).toBe(true))

    launcher.open({ context: { source: 'home' }, message: 'un autre besoin' })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())

    const body = fetchMock.mock.calls.at(-1)?.[1]?.body
    expect(body.message).toBe('un autre besoin')
    expect(wrapper.find('dialog').exists()).toBe(true)
  })

  it('closes the panel on close event', async () => {
    const launcher = useAssistantLauncher()
    launcher.open()
    const wrapper = mountChat()

    await wrapper.find('.conversation .close').trigger('click')
    expect(wrapper.find('dialog').exists()).toBe(false)
  })

  it('greets again after a reset', async () => {
    const launcher = useAssistantLauncher()
    launcher.open()
    const wrapper = mountChat()
    wrapper.findComponent(conversationStub).props('entries').push({
      role: 'user',
      content: 'bonjour'
    })

    await wrapper.find('.conversation .reset').trigger('click')
    const entries = wrapper.findComponent(conversationStub).props('entries')
    expect(entries).toHaveLength(1)
    expect(entries[0].role).toBe('assistant')
  })
})
