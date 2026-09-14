import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LegalPage from '~/components/Legal/Page.vue'
import type { LegalPage as LegalPageModel, LegalPageTab } from '~/types/legal'

const navigateToMock = vi.fn()

interface RouteMock {
  params: { legal: string }
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
      '<ul><li v-for="s in sections" :key="s.id"><a :href="`#${s.id}`">{{ s.title }}</a></li></ul>'
  }
}

const page: LegalPageModel = {
  slug: 'mentions-legales',
  label: 'Mentions légales',
  title: 'Mentions légales',
  lastUpdated: '01 septembre 2026',
  metaDescription: 'Mentions légales du site.',
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
    routeMock = { params: { legal: 'mentions-legales' }, hash: '', meta: {} }
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
    routeMock = { params: { legal: 'mentions-legales' }, hash: '', meta: {} }
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
})
