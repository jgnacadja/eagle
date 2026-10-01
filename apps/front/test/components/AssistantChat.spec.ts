import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import AssistantChat from '~/components/Assistant/Chat.vue'
import { useAssistantLauncher } from '~/composables/useAssistantLauncher'

const routeMock = (globalThis as Record<string, unknown>).useRoute as () => {
  path: string
  fullPath: string
}

const fetchMock = vi.fn()

vi.stubGlobal('$fetch', fetchMock)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.stubGlobal('logServerError', vi.fn())
vi.stubGlobal('internalSsrHeaders', () => undefined)

const conversationStub = {
  name: 'AssistantConversation',
  props: ['entries', 'pending', 'unavailable', 'contextChips', 'degraded', 'notice'],
  emits: ['send', 'edit', 'stop', 'retry', 'reset', 'close', 'select', 'compare'],
  template:
    '<div class="conversation">' +
    '<button class="stop" @click="$emit(\'stop\')" />' +
    '<button class="reset" @click="$emit(\'reset\')" />' +
    '<button class="close" @click="$emit(\'close\')" />' +
    '<a class="link" href="/centres/demande-de-formation?formation=sst">Demander</a>' +
    '<a class="advisor" href="/parler-a-votre-conseiller" data-advisor-escalation="out_of_catalog">Conseiller</a>' +
    '<a class="advisor-unavailable" href="/parler-a-votre-conseiller" data-advisor-escalation="unavailable">Conseiller</a>' +
    '</div>'
}

// Le widget est unique dans l'application : chaque instance montée observe
// l'état global du lanceur, un widget d'un test précédent réagirait encore.
const mounted: VueWrapper[] = []

function mountChat() {
  const wrapper = mount(AssistantChat, {
    global: { stubs: { AssistantConversation: conversationStub } }
  })
  mounted.push(wrapper)
  return wrapper
}

function conversation(wrapper: ReturnType<typeof mountChat>) {
  return wrapper.findComponent(conversationStub)
}

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount())
})

/** Événements analytics poussés depuis le montage, sans leurs paramètres. */
function events(): string[] {
  return (window.dataLayer as { event: string }[]).map((e) => e.event)
}

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue({ kind: 'clarify', text: 'ok' })
  window.dataLayer = []
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

  it('closes the panel when navigation occurs behind it', async () => {
    const launcher = useAssistantLauncher()
    launcher.open()
    const wrapper = mountChat()
    expect(wrapper.find('dialog').exists()).toBe(true)

    routeMock().fullPath = '/formations/sante/sst-sauveteur-secouriste-du-travail'
    await nextTick()
    expect(wrapper.find('dialog').exists()).toBe(false)
    expect(launcher.isOpen.value).toBe(false)
    routeMock().fullPath = '/'
  })

  it('closes the panel on a panel link click even without route change', async () => {
    const launcher = useAssistantLauncher()
    launcher.open()
    const wrapper = mountChat()
    expect(wrapper.find('dialog').exists()).toBe(true)

    // Même URL que la route courante : fullPath ne change pas, le clic
    // sur le lien doit quand même fermer le panneau.
    await wrapper.find('.conversation .link').trigger('click')
    expect(launcher.isOpen.value).toBe(false)
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

  describe('analytics', () => {
    it('tracks the search start with the entry-point source on open', async () => {
      const wrapper = mountChat()
      expect(events()).toEqual([])

      await wrapper.find('button[aria-label="Ouvrir la recherche assistée"]').trigger('click')
      expect(window.dataLayer).toEqual([{ event: 'ai_search_start' }])

      useAssistantLauncher().close()
      await nextTick()
      useAssistantLauncher().open({ context: { source: 'catalogue' } })
      await nextTick()
      expect(window.dataLayer?.at(-1)).toEqual({ event: 'ai_search_start', source: 'catalogue' })
    })

    it('tracks an entry-point message as a search submit, then the clarification', async () => {
      useAssistantLauncher().open({ context: { source: 'home' }, message: 'former au SST' })
      mountChat()
      await vi.waitFor(() => expect(events()).toContain('ai_clarification_requested'))

      expect(window.dataLayer).toEqual([
        { event: 'ai_search_start', source: 'home' },
        { event: 'ai_search_submit', source: 'home', turn: 1, via: 'entry' },
        { event: 'ai_clarification_requested', source: 'home', turn: 1 }
      ])
    })

    it('tracks a message sent after a clarification as its answer', async () => {
      fetchMock
        .mockResolvedValueOnce({ kind: 'clarify', text: 'Pour combien de personnes ?' })
        .mockResolvedValueOnce({
          kind: 'recommend',
          text: 'Nous vous recommandons',
          mode: 'ai',
          recommendations: [{ slug: 'sst' }, { slug: 'mac-sst' }]
        })
      useAssistantLauncher().open({ context: { source: 'home' } })
      const wrapper = mountChat()

      conversation(wrapper).vm.$emit('send', 'former au SST', 'text')
      await vi.waitFor(() => expect(events()).toContain('ai_clarification_requested'))
      conversation(wrapper).vm.$emit('send', '8 salariés', 'suggestion')
      await vi.waitFor(() => expect(events()).toContain('ai_recommendation_display'))

      expect(window.dataLayer).toEqual([
        { event: 'ai_search_start', source: 'home' },
        { event: 'ai_search_submit', source: 'home', turn: 1, via: 'text' },
        { event: 'ai_clarification_requested', source: 'home', turn: 1 },
        { event: 'ai_clarification_answer', source: 'home', turn: 2, via: 'suggestion' },
        { event: 'ai_recommendation_display', source: 'home', turn: 2, count: 2, mode: 'ai' }
      ])
    })

    it('tracks an edited message as a new search submit at its turn', async () => {
      useAssistantLauncher().open()
      const wrapper = mountChat()
      conversation(wrapper).vm.$emit('send', 'premier', 'text')
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
      const id = conversation(wrapper).props('entries')[1].id

      conversation(wrapper).vm.$emit('edit', id, 'premier modifié')
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

      expect(window.dataLayer).toContainEqual({ event: 'ai_search_submit', turn: 1, via: 'edit' })
    })

    it('tracks a recommendation CTA with the entry-point source', async () => {
      useAssistantLauncher().open({ context: { source: 'formation', formationSlug: 'caces' } })
      const wrapper = mountChat()

      conversation(wrapper).vm.$emit('select', { slug: 'sst', rank: 'primary', action: 'sessions' })

      expect(window.dataLayer?.at(-1)).toEqual({
        event: 'ai_recommendation_select',
        slug: 'sst',
        rank: 'primary',
        action: 'sessions',
        source: 'formation'
      })
    })

    it('ignores blank submissions', () => {
      useAssistantLauncher().open()
      const wrapper = mountChat()

      conversation(wrapper).vm.$emit('send', '   ', 'text')

      expect(fetchMock).not.toHaveBeenCalled()
      expect(events()).toEqual(['ai_search_start'])
    })

    it('does not count reopening an ongoing conversation as a new search', async () => {
      const launcher = useAssistantLauncher()
      launcher.open({ context: { source: 'home' } })
      const wrapper = mountChat()
      conversation(wrapper).vm.$emit('send', 'former au SST', 'text')
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

      launcher.close()
      await nextTick()
      launcher.open({ context: { source: 'header' } })
      await nextTick()

      expect(events().filter((e) => e === 'ai_search_start')).toHaveLength(1)
    })

    it('treats an entry-point message during a conversation as a new search', async () => {
      const launcher = useAssistantLauncher()
      launcher.open({ context: { source: 'home' } })
      const wrapper = mountChat()
      conversation(wrapper).vm.$emit('send', 'former au SST', 'text')
      await vi.waitFor(() => expect(events()).toContain('ai_clarification_requested'))

      // Une précision est attendue, mais le message vient d'un point d'entrée.
      launcher.open({ context: { source: 'catalogue' }, message: 'un autre besoin' })
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

      // Nouveau début de recherche puis envoi « entry » au tour 2 — la réponse
      // à ce second tour peut déjà être tracée derrière.
      expect(window.dataLayer).toContainEqual({ event: 'ai_search_start', source: 'catalogue' })
      expect(window.dataLayer).toContainEqual({
        event: 'ai_search_submit',
        source: 'catalogue',
        turn: 2,
        via: 'entry'
      })
      expect(events().filter((e) => e === 'ai_search_start')).toHaveLength(2)
      expect(events()).not.toContain('ai_clarification_answer')
    })

    it('ignores panel submissions while a reply is pending', async () => {
      fetchMock.mockImplementationOnce(() => new Promise(() => {}))
      useAssistantLauncher().open()
      const wrapper = mountChat()

      conversation(wrapper).vm.$emit('send', 'premier', 'text')
      conversation(wrapper).vm.$emit('send', 'pendant l’analyse', 'suggestion')
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

      expect(events()).toEqual(['ai_search_start', 'ai_search_submit'])
      expect(
        conversation(wrapper)
          .props('entries')
          .filter((e: { role: string }) => e.role === 'user')
      ).toHaveLength(1)
    })

    it('does not track nor send an edit whose message is unknown', async () => {
      useAssistantLauncher().open()
      const wrapper = mountChat()

      conversation(wrapper).vm.$emit('edit', 'unknown-id', 'nouveau besoin')
      await nextTick()

      expect(fetchMock).not.toHaveBeenCalled()
      expect(events()).toEqual(['ai_search_start'])
    })
  })

  describe('edge states', () => {
    it('keeps the conversation history when the panel is reopened', async () => {
      const launcher = useAssistantLauncher()
      launcher.open()
      const wrapper = mountChat()
      conversation(wrapper).vm.$emit('send', 'former au SST', 'text')
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

      launcher.close()
      await nextTick()
      launcher.open({ context: { source: 'header' } })
      await nextTick()

      // Accueil, message, réponse : ni ressaisie ni second accueil.
      const roles = conversation(wrapper)
        .props('entries')
        .map((e: { role: string }) => e.role)
      expect(roles).toEqual(['assistant', 'user', 'assistant'])
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('switches the panel to degraded mode on a fallback reply and tracks it', async () => {
      fetchMock.mockResolvedValue({
        kind: 'recommend',
        text: 'Nous vous recommandons',
        mode: 'fallback',
        notice: 'Réponses générées par un assistant automatisé.',
        recommendations: [{ slug: 'sst' }]
      })
      useAssistantLauncher().open({ context: { source: 'home' } })
      const wrapper = mountChat()
      expect(conversation(wrapper).props('degraded')).toBe(false)

      conversation(wrapper).vm.$emit('send', 'former au SST', 'text')
      await vi.waitFor(() => expect(events()).toContain('ai_fallback_mode'))

      expect(conversation(wrapper).props('degraded')).toBe(true)
      expect(conversation(wrapper).props('notice')).toBe(
        'Réponses générées par un assistant automatisé.'
      )
      expect(window.dataLayer).toContainEqual({
        event: 'ai_recommendation_display',
        source: 'home',
        turn: 1,
        count: 1,
        mode: 'fallback'
      })
      expect(window.dataLayer).toContainEqual({
        event: 'ai_fallback_mode',
        source: 'home',
        turn: 1,
        kind: 'recommend'
      })
    })

    it('tracks a dead end, then the advisor escalation with its origin', async () => {
      fetchMock.mockResolvedValue({ kind: 'out_of_catalog', text: 'Hors catalogue.', mode: 'ai' })
      useAssistantLauncher().open({ context: { source: 'catalogue' } })
      const wrapper = mountChat()

      conversation(wrapper).vm.$emit('send', 'piloter un drone', 'text')
      await vi.waitFor(() => expect(events()).toContain('ai_no_results'))
      expect(window.dataLayer).toContainEqual({
        event: 'ai_no_results',
        source: 'catalogue',
        turn: 1,
        kind: 'out_of_catalog',
        mode: 'ai'
      })

      await wrapper.find('.conversation .advisor').trigger('click')
      expect(window.dataLayer?.at(-1)).toEqual({
        event: 'ai_advisor_escalation',
        source: 'catalogue',
        from: 'out_of_catalog',
        mode: 'ai'
      })
      expect(useAssistantLauncher().isOpen.value).toBe(false)
    })

    it('tracks the engine unavailability and an escalation from it', async () => {
      fetchMock.mockRejectedValueOnce(new Error('503'))
      useAssistantLauncher().open()
      const wrapper = mountChat()

      conversation(wrapper).vm.$emit('send', 'former au SST', 'text')
      await vi.waitFor(() => expect(events()).toContain('ai_unavailable'))
      expect(window.dataLayer).toContainEqual({ event: 'ai_unavailable', turn: 1 })
      expect(conversation(wrapper).props('unavailable')).toBe(true)

      await wrapper.find('.conversation .advisor-unavailable').trigger('click')
      expect(window.dataLayer?.at(-1)).toEqual({
        event: 'ai_advisor_escalation',
        from: 'unavailable'
      })
    })

    it('tracks the comparison table opening', () => {
      useAssistantLauncher().open({ context: { source: 'home' } })
      const wrapper = mountChat()

      conversation(wrapper).vm.$emit('compare', 3)

      expect(window.dataLayer?.at(-1)).toEqual({
        event: 'ai_recommendation_compare',
        source: 'home',
        count: 3
      })
    })
  })
})
