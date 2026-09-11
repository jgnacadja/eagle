import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref, watch } from 'vue'
import ActualitesPage from '~/pages/actualites/index.vue'

const seoMock = vi.fn()

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useContentSeo', seoMock)

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  Button: { template: '<button><slot /></button>' },
  Card: { template: '<div><slot /></div>' },
  ArticleCard: {
    props: ['category', 'title', 'date', 'excerpt', 'imageLabel', 'to'],
    template:
      '<article><p>{{ category }} · {{ date }}</p><h3><a :href="to">{{ title }}</a></h3><p>{{ excerpt }}</p></article>'
  },
  Input: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  Label: { template: '<label><slot /></label>' },
  Select: { template: '<div><slot /></div>' },
  SelectTrigger: { template: '<button type="button"><slot /></button>' },
  SelectContent: { template: '<div><slot /></div>' },
  SelectItem: { props: ['value'], template: '<span><slot /></span>' },
  SelectValue: { props: ['placeholder'], template: '<span>{{ placeholder }}</span>' },
  Pagination: { template: '<nav><slot /></nav>' },
  PaginationContent: {
    template: '<ul><slot :items="[]" /></ul>'
  },
  PaginationItem: true,
  PaginationEllipsis: true,
  PaginationPrevious: true,
  PaginationNext: true
}

function mountPage() {
  return mount(ActualitesPage, { global: { stubs } })
}

describe('pages/actualites/index', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le bandeau d’intro avec le titre et les filtres', () => {
    const wrapper = mountPage()

    expect(wrapper.text()).toContain('Actualités du réseau')
    expect(wrapper.text()).toContain('Réglementation, formations et vie du réseau')
    expect(wrapper.text()).toContain('Toutes les régions')
    expect(wrapper.text()).toContain('Réglementation & obligations')
    expect(wrapper.text()).toContain('Nouvelles formations')
    expect(wrapper.text()).toContain('Vie du réseau')
  })

  it('affiche l’article à la une avec son lien', () => {
    const wrapper = mountPage()

    expect(wrapper.text()).toContain('À la une')
    expect(wrapper.text()).toContain('Recyclage CACES')
    const link = wrapper.find('a[href="/actualites/recyclage-caces-echeances-2027"]')
    expect(link.exists()).toBe(true)
  })

  it('affiche la grille d’articles', () => {
    const wrapper = mountPage()

    expect(wrapper.text()).toContain('Nouveau plateau technique nacelles PEMP à Créteil')
    expect(wrapper.text()).toContain('Un nouveau centre ouvre à Cergy-Pontoise')
    expect(wrapper.text()).toContain('Habilitations électriques')
    expect(wrapper.text()).toContain('MAC SST')
    expect(wrapper.text()).toContain('AIPR')
    expect(wrapper.text()).toContain('Portes ouvertes')
  })

  it('filtre les articles par catégorie', async () => {
    const wrapper = mountPage()

    const buttons = wrapper.findAll('nav[aria-label] button')
    const reglementation = buttons.find((b) => b.text() === 'Réglementation & obligations')
    await reglementation!.trigger('click')

    expect(wrapper.text()).toContain('Habilitations électriques')
    expect(wrapper.text()).toContain('AIPR')
    expect(wrapper.text()).not.toContain('Nouveau plateau technique nacelles PEMP')
  })

  it('charge tous les articles au clic sur "Afficher plus"', async () => {
    const wrapper = mountPage()

    const button = wrapper.findAll('button').find((b) => b.text() === "Afficher plus d'articles")
    expect(button).toBeTruthy()

    await button!.trigger('click')

    expect(wrapper.findAll('button').some((b) => b.text() === "Afficher plus d'articles")).toBe(
      false
    )
  })

  it('affiche le bandeau newsletter avec le formulaire', () => {
    const wrapper = mountPage()

    expect(wrapper.text()).toContain('Recevez les échéances réglementaires')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.text()).toContain("S'abonner")
  })

  it('applique le SEO de la page', () => {
    mountPage()

    expect(seoMock).toHaveBeenCalledWith(
      expect.objectContaining({ seo_title: 'Actualités — LEARN UP ACADEMY' }),
      'Actualités — LEARN UP ACADEMY'
    )
  })
})
