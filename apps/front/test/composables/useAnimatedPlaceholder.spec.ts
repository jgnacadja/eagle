import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, ref, nextTick, type MaybeRefOrGetter } from 'vue'
import { mount } from '@vue/test-utils'
import {
  findCommonPrefix,
  useAnimatedPlaceholder,
  type UseAnimatedPlaceholderOptions
} from '~/composables/useAnimatedPlaceholder'

describe('findCommonPrefix', () => {
  it('returns empty string for empty input', () => {
    expect(findCommonPrefix([])).toBe('')
  })

  it('returns the string itself for a single item', () => {
    expect(findCommonPrefix(['Ex. : Test'])).toBe('Ex. : Test')
  })

  it('finds common prefix across multiple strings', () => {
    expect(
      findCommonPrefix([
        'Ex. : Je dois former 8 salariés',
        'Ex. : Nous devons renouveler',
        'Ex. : Session SST pour 6 collaborateurs'
      ])
    ).toBe('Ex. : ')
  })

  it('returns empty string when there is no common prefix', () => {
    expect(findCommonPrefix(['Bonjour', 'Au revoir', 'Exemple'])).toBe('')
  })
})

describe('useAnimatedPlaceholder', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  function mountHarness(
    texts: MaybeRefOrGetter<readonly string[]>,
    options: UseAnimatedPlaceholderOptions = {}
  ) {
    let result: ReturnType<typeof useAnimatedPlaceholder> | null = null

    const Component = defineComponent({
      setup() {
        result = useAnimatedPlaceholder(texts, options)
        return () => h('div', result?.value)
      }
    })

    const wrapper = mount(Component)
    return { wrapper, placeholder: result! }
  }

  it('returns static placeholder if 0 or 1 item is provided', () => {
    const { placeholder: empty } = mountHarness([])
    expect(empty.value).toBe('')

    const { placeholder: single } = mountHarness(['Unique'])
    expect(single.value).toBe('Unique')
    vi.advanceTimersByTime(10000)
    expect(single.value).toBe('Unique')
  })

  it('returns static placeholder if all items are identical (duplicates)', () => {
    const { placeholder } = mountHarness(['Same', 'Same'])
    expect(placeholder.value).toBe('Same')
    vi.advanceTimersByTime(10000)
    expect(placeholder.value).toBe('Same')
  })

  it('reacts dynamically to changes in textsInput when provided as a ref', async () => {
    const textsRef = ref(['Alpha 1', 'Alpha 2'])
    const { placeholder } = mountHarness(textsRef, {
      holdDuration: 1000,
      deletingSpeed: 50,
      preservePrefix: false
    })

    expect(placeholder.value).toBe('Alpha 1')

    textsRef.value = ['Beta 1', 'Beta 2']
    await nextTick()

    expect(placeholder.value).toBe('Beta 1')

    // Advance 1000ms: should start deleting Beta 1
    vi.advanceTimersByTime(1000)
    expect(placeholder.value).toBe('Beta ')
  })

  it('initializes with the first full text immediately for SSR safety', () => {
    const texts = [
      'Ex. : Je dois former 8 salariés au CACES près de Lyon avant septembre.',
      'Ex. : Nous devons renouveler 12 habilitations sur deux sites avant décembre.',
      'Ex. : Session SST pour 6 équipiers à Nantes le mois prochain.'
    ]
    const { placeholder } = mountHarness(texts)
    expect(placeholder.value).toBe(texts[0])
  })

  it('deletes back to the common prefix after holdDuration then types the next text', () => {
    const texts = ['Ex. : Alpha', 'Ex. : Bravo']
    const { placeholder } = mountHarness(texts, {
      holdDuration: 1000,
      deletingSpeed: 50,
      pauseDuration: 200,
      typingSpeed: 50
    })

    expect(placeholder.value).toBe('Ex. : Alpha')

    // At 1000ms: deletion starts. 'Ex. : Alph'
    vi.advanceTimersByTime(1000)
    expect(placeholder.value).toBe('Ex. : Alph')

    // Advance 50ms: 'Ex. : Alp'
    vi.advanceTimersByTime(50)
    expect(placeholder.value).toBe('Ex. : Alp')

    // Advance remaining 3 characters of 'Alp' (3 * 50ms = 150ms) to reach 'Ex. : '
    vi.advanceTimersByTime(150)
    expect(placeholder.value).toBe('Ex. : ')

    // Pause before typing next text (200ms)
    vi.advanceTimersByTime(200)

    // Now it starts typing 'Ex. : Bravo' from prefix ('Ex. : B')
    vi.advanceTimersByTime(50)
    expect(placeholder.value).toBe('Ex. : B')

    // Advance 4 characters ('ravo' -> 4 * 50ms = 200ms)
    vi.advanceTimersByTime(200)
    expect(placeholder.value).toBe('Ex. : Bravo')
  })

  it('cycles through all items in the array and loops back', () => {
    const texts = ['Item 1', 'Item 2', 'Item 3']
    const { placeholder } = mountHarness(texts, {
      holdDuration: 500,
      deletingSpeed: 10,
      pauseDuration: 100,
      typingSpeed: 10,
      preservePrefix: false
    })

    expect(placeholder.value).toBe('Item 1')

    // 1st text hold (500) + delete 6 chars (60) + pause (100) + type 6 chars (60) = 720ms
    vi.advanceTimersByTime(720)
    expect(placeholder.value).toBe('Item 2')

    // 2nd text hold + delete + pause + type = 720ms
    vi.advanceTimersByTime(720)
    expect(placeholder.value).toBe('Item 3')

    // 3rd text hold + delete + pause + type = 720ms -> loops back to Item 1
    vi.advanceTimersByTime(720)
    expect(placeholder.value).toBe('Item 1')
  })

  it('respects prefers-reduced-motion by keeping static initial text', () => {
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
    vi.stubGlobal('matchMedia', matchMediaMock)

    const texts = ['Text 1', 'Text 2']
    const { placeholder } = mountHarness(texts, { holdDuration: 500 })

    expect(placeholder.value).toBe('Text 1')
    vi.advanceTimersByTime(5000)
    expect(placeholder.value).toBe('Text 1')
  })

  it('cleans up timers and event listeners on unmount', () => {
    const texts = ['Text 1', 'Text 2']
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    const { wrapper, placeholder } = mountHarness(texts, { holdDuration: 500 })
    expect(placeholder.value).toBe('Text 1')

    wrapper.unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))

    // Advancing timers should not trigger further changes
    vi.advanceTimersByTime(10000)
    expect(placeholder.value).toBe('Text 1')
  })

  it('pauses on page visibility hidden and resumes on visible', () => {
    const texts = ['Text 1', 'Text 2']
    const { placeholder } = mountHarness(texts, {
      holdDuration: 1000,
      deletingSpeed: 50,
      preservePrefix: false
    })

    // Simulate page hide
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))

    // Advance time while hidden: should stay paused at Text 1
    vi.advanceTimersByTime(5000)
    expect(placeholder.value).toBe('Text 1')

    // Simulate page visible again
    Object.defineProperty(document, 'hidden', { value: false, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))

    // After resuming and waiting holdDuration, it starts deleting
    vi.advanceTimersByTime(1000)
    expect(placeholder.value).toBe('Text ')
  })
})
