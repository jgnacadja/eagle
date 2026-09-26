import { DOMWrapper, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import LegalPage from '~/components/Legal/Page.vue'
import type { LegalPage as LegalPageModel, LegalPageTab } from '~/types/legal'

const navigateToMock = vi.fn()

interface RouteMock {
  params: { slug: string }
  hash: string
  meta: Record<string, unknown>
}

let routeMock: RouteMock

vi.stubGlobal('useRoute', () => routeMock)
vi.stubGlobal('navigateTo', navigateToMock)

const stubs = {
  NuxtLink: { template: '<a :href="$attrs.to ?? $attrs.href"><slot /></a>' },
  Button: { template: '<button><slot /></button>' },
  Breadcrumbs: { template: '<nav><slot /></nav>' },
  Label: { template: '<label :for="$attrs.for" :id="$attrs.id"><slot /></label>' },
  Select: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>'
  },
  SelectTrigger: { template: '<span><slot /></span>' },
  SelectContent: { template: '<span><slot /></span>' },
  SelectItem: {
    props: ['value'],
    template: '<option :value="value"><slot /></option>'
  },
  Accordion: { template: '<div><slot /></div>' },
  AccordionItem: { template: '<div><slot /></div>' },
  AccordionTrigger: { template: '<button><slot /></button>' },
  AccordionContent: { template: '<div><slot /></div>' },
  IconChevronUp: { template: '<svg />' },
  LegalSummary: {
    props: ['sections', 'activeId'],
    template:
      '<ul><li v-for="s in sections" :key="s.id"><a :href="`#${s.id}`" :data-active="s.id === activeId">{{ s.title }}</a></li></ul>'
  }
}

const page: LegalPageModel = {
  slug: 'mentions-legales',
  label: 'Mentions légales',
  title: 'Mentions légales',
  lastUpdated: '01 septembre 2026',
  sections: [
    {
      id: 'editeur',
      title: '1. Éditeur du site',
      paragraphs: ['Premier paragraphe.', 'Second paragraphe.']
    },
    {
      id: 'hebergement',
      title: '2. Hébergement',
      paragraphs: ['Paragraphe hébergement.'],
      bullets: ['Puce un', 'Puce deux']
    }
  ],
  cta: { label: 'Contacter LEARN UP ACADEMY', to: 'mailto:contact@learnup.fr' }
}

const tabs: LegalPageTab[] = [
  { slug: 'mentions-legales', label: 'Mentions légales' },
  { slug: 'confidentialite', label: 'Confidentialité' }
]

describe('components/LegalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeMock = { params: { slug: 'mentions-legales' }, hash: '', meta: {} }
  })

  it('affiche le titre, la date de mise à jour et les sections', () => {
    const wrapper = mount(LegalPage, { props: { page, tabs }, global: { stubs } })

    expect(wrapper.text()).toContain(page.title)
    expect(wrapper.text()).toContain(`Dernière mise à jour : ${page.lastUpdated}`)

    for (const section of page.sections) {
      expect(wrapper.text()).toContain(section.title)
      for (const paragraph of section.paragraphs) {
        expect(wrapper.text()).toContain(paragraph)
      }
    }

    expect(wrapper.text()).toContain(page.cta.label)
  })

  it('affiche les liens de navigation vers les autres pages légales', () => {
    const wrapper = mount(LegalPage, { props: { page, tabs }, global: { stubs } })
    const links = wrapper.findAll('a')

    // Au moins un lien vers le sommaire et un lien par section.
    expect(links.length).toBeGreaterThan(page.sections.length)

    expect(links.some((a) => a.attributes('href') === '/confidentialite')).toBe(true)

    const firstSectionHref = `#${page.sections[0]?.id ?? ''}`
    const firstSummaryLink = links.find((a) => a.attributes('href') === firstSectionHref)
    expect(firstSummaryLink).toBeTruthy()
  })

  it('navigue vers une autre page légale via le sélecteur mobile', async () => {
    routeMock = { params: { slug: 'mentions-legales' }, hash: '', meta: {} }
    const wrapper = mount(LegalPage, { props: { page, tabs }, global: { stubs } })

    const select = wrapper.find('select')
    await select.setValue('confidentialite')

    expect(navigateToMock).toHaveBeenCalledWith('/confidentialite')
  })

  it('affiche le sommaire avec la première section active par défaut', () => {
    const wrapper = mount(LegalPage, { props: { page, tabs }, global: { stubs } })

    const firstLink = wrapper.find(`a[href="#${page.sections[0]?.id ?? ''}"]`)
    expect(firstLink.exists()).toBe(true)
  })

  it('active la section du hash initial', () => {
    routeMock.hash = '#hebergement'
    const wrapper = mount(LegalPage, { props: { page, tabs }, global: { stubs } })

    expect(wrapper.find('a[href="#hebergement"]').attributes('data-active')).toBe('true')
  })

  it('un clic dans le sommaire active la section ciblée', async () => {
    const wrapper = mount(LegalPage, { props: { page, tabs }, global: { stubs } })
    // Laisse le computeActiveSection du montage se stabiliser.
    await nextTick()

    await wrapper.find('a[href="#editeur"]').trigger('click')

    expect(wrapper.find('a[href="#editeur"]').attributes('data-active')).toBe('true')
  })

  it('le défilement recalcule la section active après le verrouillage de clic', async () => {
    vi.useFakeTimers()
    const wrapper = mount(LegalPage, { props: { page, tabs }, global: { stubs } })
    await vi.advanceTimersByTimeAsync(0)

    await wrapper.find('a[href="#editeur"]').trigger('click')
    expect(wrapper.find('a[href="#editeur"]').attributes('data-active')).toBe('true')

    // Pendant le verrouillage (1 s) le scroll ne recalcule pas.
    window.dispatchEvent(new Event('scroll'))
    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.find('a[href="#editeur"]').attributes('data-active')).toBe('true')

    // À l'expiration du verrou, computeActiveSection reprend la main.
    await vi.advanceTimersByTimeAsync(1100)
    window.dispatchEvent(new Event('scroll'))
    await vi.advanceTimersByTimeAsync(50)
    expect(wrapper.find('a[href="#hebergement"]').attributes('data-active')).toBe('true')
    vi.useRealTimers()
  })

  it('réinitialise la section active au changement de page', async () => {
    const wrapper = mount(LegalPage, { props: { page, tabs }, global: { stubs } })
    await nextTick()
    await wrapper.find('a[href="#editeur"]').trigger('click')
    expect(wrapper.find('a[href="#editeur"]').attributes('data-active')).toBe('true')

    routeMock.hash = ''
    await wrapper.setProps({ page: { ...page, slug: 'confidentialite' } })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.find('a[href="#hebergement"]').attributes('data-active')).toBe('true')
  })

  it('active la section du hash au changement de page', async () => {
    const wrapper = mount(LegalPage, { props: { page, tabs }, global: { stubs } })
    await nextTick()

    routeMock.hash = '#hebergement'
    await wrapper.setProps({ page: { ...page, slug: 'confidentialite' } })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.find('a[href="#hebergement"]').attributes('data-active')).toBe('true')
    routeMock.hash = ''
  })

  it('calcule la section active depuis la position de défilement', async () => {
    // happy-dom rend une page de hauteur nulle : scrollHeight est surchargé
    // pour sortir du cas « bas de page » et exercer la boucle des sections.
    const original = Object.getOwnPropertyDescriptor(document.documentElement, 'scrollHeight')
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 10000,
      configurable: true
    })
    try {
      // attachTo requis : computeActiveSection utilise getElementById, qui
      // ne voit que les éléments présents dans le document.
      const wrapper = mount(LegalPage, {
        props: { page, tabs },
        global: { stubs },
        attachTo: document.body
      })
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Toutes les positions sont à 0 en happy-dom : la boucle retient la
      // dernière section dont le haut dépasse le seuil.
      expect(wrapper.find('a[href="#hebergement"]').attributes('data-active')).toBe('true')

      // Deuxième dispatch : rafId déjà pris → le handler retourne tôt.
      window.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('scroll'))
      await new Promise((resolve) => requestAnimationFrame(resolve))
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(wrapper.find('a[href="#hebergement"]').attributes('data-active')).toBe('true')
      wrapper.unmount()
    } finally {
      if (original) Object.defineProperty(document.documentElement, 'scrollHeight', original)
      else delete (document.documentElement as { scrollHeight?: number }).scrollHeight
    }
  })

  it('arrête la boucle à la première section sous le seuil de scroll', async () => {
    const originalScroll = Object.getOwnPropertyDescriptor(document.documentElement, 'scrollHeight')
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 10000,
      configurable: true
    })
    const originalRect = Element.prototype.getBoundingClientRect
    Element.prototype.getBoundingClientRect = function (this: Element) {
      return {
        ...originalRect.call(this),
        top: this.id === 'hebergement' ? 500 : 0
      } as DOMRect
    }
    try {
      const wrapper = mount(LegalPage, {
        props: { page, tabs },
        global: { stubs },
        attachTo: document.body
      })
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      // « hebergement » dépasse le seuil : la boucle casse et garde « editeur ».
      expect(wrapper.find('a[href="#editeur"]').attributes('data-active')).toBe('true')
      wrapper.unmount()
    } finally {
      Element.prototype.getBoundingClientRect = originalRect
      if (originalScroll)
        Object.defineProperty(document.documentElement, 'scrollHeight', originalScroll)
      else delete (document.documentElement as { scrollHeight?: number }).scrollHeight
    }
  })

  it('retombe sur une section vide quand la page n’a plus de sommaire', async () => {
    const wrapper = mount(LegalPage, { props: { page, tabs }, global: { stubs } })
    await nextTick()

    await wrapper.setProps({ page: { ...page, slug: 'vide', sections: [] } })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.findAll('[data-active="true"]')).toHaveLength(0)
  })

  it('utilise le slug de la page quand la route n’en a pas', () => {
    routeMock = { params: { slug: '' }, hash: '', meta: {} }
    const wrapper = mount(LegalPage, { props: { page, tabs }, global: { stubs } })

    expect(wrapper.find('h1').text()).toBe(page.title)
  })

  it('retombe sur le libellé de la page quand le slug est hors onglets', () => {
    routeMock = { params: { slug: 'slug-inconnu' }, hash: '', meta: {} }
    const wrapper = mount(LegalPage, { props: { page, tabs }, global: { stubs } })

    expect(wrapper.find('select').exists()).toBe(true)
  })

  it('active la première section pour un hash inconnu', () => {
    routeMock.hash = '#section-inexistante'
    const wrapper = mount(LegalPage, { props: { page, tabs }, global: { stubs } })

    const first = page.sections[0]!
    expect(wrapper.find(`a[href="#${first.id}"]`).attributes('data-active')).toBe('true')
  })

  it('monte une page sans sections', () => {
    const bare = { ...page, sections: [] }
    const wrapper = mount(LegalPage, { props: { page: bare, tabs }, global: { stubs } })

    expect(wrapper.findAll('[data-active="true"]')).toHaveLength(0)
  })

  it('ignore un clic sur un ancrage hors sommaire', async () => {
    const wrapper = mount(LegalPage, {
      props: { page, tabs },
      global: { stubs },
      attachTo: document.body
    })
    await nextTick()

    const nav = wrapper.find('a[href^="#"]').element.closest('nav, aside, div')!
    const rogue = document.createElement('a')
    rogue.setAttribute('href', '#ancre-inconnue')
    rogue.textContent = 'lien étranger'
    nav.appendChild(rogue)

    // Laisse le computeActiveSection du mount se terminer.
    await new Promise((resolve) => setTimeout(resolve, 0))
    const activeBefore = wrapper.find('[data-active="true"]').attributes('href')

    await new DOMWrapper(rogue).trigger('click')

    expect(wrapper.find('[data-active="true"]').attributes('href')).toBe(activeBefore)
    expect(rogue.hasAttribute('data-active')).toBe(false)
    wrapper.unmount()
  })

  it('reprogramme le déverrouillage à un second clic dans le sommaire', async () => {
    vi.useFakeTimers()
    const wrapper = mount(LegalPage, {
      props: { page, tabs },
      global: { stubs },
      attachTo: document.body
    })
    await nextTick()

    await wrapper.find('a[href="#editeur"]').trigger('click')
    await wrapper.find('a[href="#hebergement"]').trigger('click')
    await vi.advanceTimersByTimeAsync(400)

    expect(wrapper.find('a[href="#hebergement"]').attributes('data-active')).toBe('true')
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('se démonte proprement avec un scroll et un verrou en vol', async () => {
    const wrapper = mount(LegalPage, {
      props: { page, tabs },
      global: { stubs },
      attachTo: document.body
    })
    await nextTick()

    await wrapper.find('a[href="#editeur"]').trigger('click')
    window.dispatchEvent(new Event('scroll'))
    expect(() => wrapper.unmount()).not.toThrow()
  })

  it('retire les écouteurs de défilement au démontage', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(LegalPage, { props: { page, tabs }, global: { stubs } })

    wrapper.unmount()

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    removeSpy.mockRestore()
  })
})
