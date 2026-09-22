import { DOMWrapper, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, onMounted, ref } from 'vue'
import ShareMenu from '~/components/Article/ShareMenu.vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('onMounted', onMounted)

const stubs = {
  Button: { template: '<button><slot /></button>' },
  IconShare: true,
  IconMoreHorizontal: true
}

const props = {
  url: 'https://learnup.test/actualites/mon-article',
  title: 'Mon article',
  text: 'Résumé de l’article'
}

let wrapper: VueWrapper | undefined

async function waitUntil(ok: () => boolean) {
  for (let i = 0; i < 200 && !ok(); i++) {
    await new Promise((resolve) => setTimeout(resolve, 5))
    await flushPromises()
  }
}

async function openMenu() {
  wrapper = mount(ShareMenu, { props, global: { stubs } })
  await flushPromises()

  const trigger = wrapper
    .findAll('button')
    .find((b) => b.attributes('aria-label') === "Partager l'article")!
  await trigger.trigger('pointerdown', { button: 0 })
  await trigger.trigger('click')
  await waitUntil(() => Boolean(document.body.querySelector('[role="menu"]')))
  return wrapper
}

function menuItems(): HTMLElement[] {
  return Array.from(document.body.querySelectorAll<HTMLElement>('[role="menuitem"]'))
}

function menuLinks(): HTMLAnchorElement[] {
  return Array.from(document.body.querySelectorAll<HTMLAnchorElement>('[role="menu"] a'))
}

beforeEach(() => {
  Object.defineProperty(window.navigator, 'share', { value: undefined, configurable: true })
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

describe('Article/ShareMenu', () => {
  it('expose un déclencheur accessible « Partager l’article »', async () => {
    wrapper = mount(ShareMenu, { props, global: { stubs } })

    const trigger = wrapper
      .findAll('button')
      .find((b) => b.attributes('aria-label') === "Partager l'article")
    expect(trigger?.exists()).toBe(true)
  })

  it('ouvre un menu avec les canaux sociaux pointant vers l’URL de l’article', async () => {
    await openMenu()

    const hrefs = menuLinks().map((a) => a.href)
    const encoded = encodeURIComponent(props.url)

    expect(
      hrefs.some((h) => h.includes(`linkedin.com/sharing/share-offsite/?url=${encoded}`))
    ).toBe(true)
    expect(hrefs.some((h) => h.includes(`twitter.com/intent/tweet?url=${encoded}`))).toBe(true)
    expect(hrefs.some((h) => h.includes(`facebook.com/sharer/sharer.php?u=${encoded}`))).toBe(true)
    expect(hrefs.some((h) => h.includes('wa.me/?text='))).toBe(true)
    expect(hrefs.some((h) => h.startsWith('mailto:?subject='))).toBe(true)

    const labels = menuItems().map((i) => i.textContent ?? '')
    expect(labels.join(' ')).toContain('LinkedIn')
    expect(labels.join(' ')).toContain('WhatsApp')
    expect(labels.join(' ')).toContain('E-mail')
  })

  it('n’affiche pas « Plus d’options… » sans Web Share API', async () => {
    await openMenu()

    expect(document.body.textContent).not.toContain("Plus d'options")
  })

  it('« Plus d’options… » appelle navigator.share quand l’API est disponible', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'share', { value: share, configurable: true })
    await openMenu()

    const nativeItem = menuItems().find((i) => i.textContent?.includes("Plus d'options"))!
    await new DOMWrapper(nativeItem).trigger('click')
    await flushPromises()

    expect(share).toHaveBeenCalledWith({
      title: props.title,
      text: props.text,
      url: props.url
    })
  })
})
