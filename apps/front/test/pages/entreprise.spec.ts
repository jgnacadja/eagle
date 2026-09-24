import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref, Suspense } from 'vue'
import EntreprisePage from '~/pages/entreprise.vue'

const navigateToMock = vi.fn()
const seoMock = vi.fn()

vi.stubGlobal('ref', ref)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useContentSeo', seoMock)
vi.stubGlobal('navigateTo', navigateToMock)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))

vi.mock('~/composables/useCatalog', () => ({
  mapCourse: (c: {
    slug: string
    title: string
    familySlug?: string | null
    description?: string
  }) => ({
    slug: c.slug,
    title: c.title,
    description: c.description ?? '',
    family: c.familySlug ?? 'Autre',
    meta: '',
    to: c.familySlug ? `/formations/${c.familySlug}/${c.slug}` : `/formations/${c.slug}`
  }),
  useCatalog: vi.fn(async () => ({
    data: ref({
      items: [
        {
          slug: 'caces-r489-chariots-elevateurs',
          title: 'CACES® R489 Chariots élévateurs',
          familySlug: 'caces-conduite-engins',
          description: 'Catégories 1A, 1B, 3 et 5 — Initiale et recyclage.'
        },
        {
          slug: 'habilitation-electrique-b1v-b2v',
          title: 'Habilitation électrique B1V / B2V',
          familySlug: 'habilitation-electrique',
          description: 'Travaux électriques basse tension et interventions.'
        }
      ],
      total: 2,
      page: 1,
      pages: 1
    }),
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn()
  }))
}))

vi.stubGlobal('useDirectusList', (collection: string) => {
  if (collection === 'avis') {
    return ref([
      {
        slug: 'avis-1',
        author: 'Responsable QHSE — logistique',
        quote:
          'Douze habilitations à renouveler sur trois sites, tout était planifié en une semaine.',
        stars: 5,
        published_at: '2024-03-01'
      }
    ])
  }
  return ref([
    {
      slug: 'centre-lyon',
      name: 'Centre Lyon Est',
      address: '10 Rue de la République',
      postal_code: '69001',
      city: 'Lyon',
      department: 'Rhône',
      region: 'Auvergne-Rhône-Alpes',
      specialties: ['CACES', 'SST'],
      latitude: 45.764,
      longitude: 4.8357
    }
  ])
})

function mountPage() {
  const TestWrapper = defineComponent({
    render() {
      return h(Suspense, null, {
        default: () => h(EntreprisePage)
      })
    }
  })

  return mount(TestWrapper, {
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        CenterMap: {
          props: ['centers'],
          template: '<div class="center-map-mock" :data-count="centers?.length" />'
        },
        SearchInput: {
          props: ['modelValue', 'placeholder', 'inputId'],
          emits: ['update:modelValue', 'submit'],
          template: `
             <div class="search-input-mock">
               <slot name="icon" />
               <input
                 :id="inputId"
                 :value="modelValue"
                 :placeholder="placeholder"
                 @input="$emit('update:modelValue', $event.target.value)"
                 @keydown.enter="$emit('submit', modelValue)"
               />
               <button type="button" @click="$emit('submit', modelValue)">Rechercher</button>
             </div>
           `
        },
        Form: { template: '<form @submit.prevent><slot /></form>' },
        Button: { template: '<button><slot /></button>' },
        TestimonialCard: {
          props: ['quote', 'author', 'stars'],
          template: '<div class="testimonial-card">{{ quote }} {{ author }}</div>'
        },
        ProcessSteps: {
          props: ['steps'],
          template: `<ol class="process-steps-mock">
            <li v-for="step in steps" :key="step.title">{{ step.number }} {{ step.title }} {{ step.body }}</li>
          </ol>`
        },
        Badge: { template: '<span class="badge-mock"><slot /></span>' }
      }
    }
  })
}

describe('EntreprisePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le hero et la carte flottante de performance durable', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Simplifiez la gestion de')
    expect(wrapper.text()).toContain('vos')
    expect(wrapper.text()).toContain('formations.')
    expect(wrapper.text()).toContain('La formation, un levier')
    expect(wrapper.text()).toContain('de performance durable')
    expect(wrapper.text()).toContain('Un interlocuteur unique pour vos besoins de formation')
  })

  it('affiche les 5 bénéfices du hero avec les bons libellés', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Un interlocuteur unique')
    expect(wrapper.text()).toContain('Des solutions adaptées à vos métiers')
    expect(wrapper.text()).toContain('Une couverture nationale')
    expect(wrapper.text()).toContain('Des sessions rapidement disponibles')
    expect(wrapper.text()).toContain('Un suivi simplifié de vos formations')
  })

  it('présente les 6 segments d’entreprises', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('TPE / PME')
    expect(wrapper.text()).toContain('ETI')
    expect(wrapper.text()).toContain('Grands comptes')
    expect(wrapper.text()).toContain('BTP')
    expect(wrapper.text()).toContain('Industrie')
    expect(wrapper.text()).toContain('Travail temporaire')
  })

  it('présente les 5 étapes multisites et les 4 étapes comment ça marche', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Centralisation des demandes')
    expect(wrapper.text()).toContain('Identification des besoins')
    expect(wrapper.text()).toContain('Recherche des solutions locales')
    expect(wrapper.text()).toContain('Coordination des sessions')
    expect(wrapper.text()).toContain('Suivi consolidé')

    expect(wrapper.text()).toContain('Vous exprimez votre besoin')
    expect(wrapper.text()).toContain('Nous identifions les solutions adaptées')
    expect(wrapper.text()).toContain('Nous organisons vos formations')
    expect(wrapper.text()).toContain("Vous bénéficiez d'un suivi centralisé")
  })

  it('affiche les avis clients, logos partenaires et mentions', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Ils nous font confiance')
    expect(wrapper.find('img[alt="Logo Capgemini"]').exists()).toBe(true)
    expect(wrapper.find('img[alt="Logo Amazon"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Douze habilitations à renouveler')
    expect(wrapper.text()).toContain('Avis réels et références publiées')
  })

  it('affiche les blocs "Pour aller plus loin"', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain("Le réseau d'entreprises clientes")
    expect(wrapper.text()).toContain('Les partenaires du réseau')
  })

  it('affiche les formations dynamiques issues du catalogue', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Les formations réglementaires dont vos équipes ont besoin')
    expect(wrapper.text()).toContain('CACES® R489 Chariots élévateurs')
    expect(wrapper.text()).toContain('Catégories 1A, 1B, 3 et 5 — Initiale et recyclage.')
    expect(wrapper.text()).toContain('Habilitation électrique B1V / B2V')
    expect(
      wrapper
        .find('a[href="/formations/caces-conduite-engins/caces-r489-chariots-elevateurs"]')
        .exists()
    ).toBe(true)
  })

  it('affiche les tags de formation avec liens de recherche', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('AIPR')
    expect(wrapper.text()).toContain('CATEC®')
    expect(wrapper.text()).toContain('Amiante SS4')
    expect(wrapper.text()).toContain('SECUFER')
    expect(wrapper.text()).toContain('Gestes & postures')
    expect(wrapper.find('a[href="/formations?q=AIPR"]').exists()).toBe(true)
    expect(wrapper.find(`a[href="/formations?q=${encodeURIComponent('CATEC®')}"]`).exists()).toBe(
      true
    )
  })

  it('redirige vers /parler-a-votre-conseiller lors de la soumission de la recherche hero', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const heroInput = wrapper.find('#entreprises-hero-search')
    await heroInput.setValue('   Besoin CACES pour 10 personnes   ')
    await wrapper.findAll('.search-input-mock')[0]!.find('button').trigger('click')

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/parler-a-votre-conseiller',
      query: { q: 'Besoin CACES pour 10 personnes' }
    })

    navigateToMock.mockClear()
    await heroInput.setValue('   ')
    await wrapper.findAll('.search-input-mock')[0]!.find('button').trigger('click')

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/parler-a-votre-conseiller',
      query: {}
    })
  })

  it('redirige vers /parler-a-votre-conseiller lors de la soumission de la recherche finale', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const finalInput = wrapper.find('#entreprises-final-search')
    await finalInput.setValue('Renouveler 12 habilitations')
    await wrapper.findAll('.search-input-mock')[1]!.find('button').trigger('click')

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/parler-a-votre-conseiller',
      query: { q: 'Renouveler 12 habilitations' }
    })
  })

  it('vérifie que les liens des segments et de "Pour aller plus loin" pointent vers des routes existantes', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('a[href="#multisites"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/entreprise-reseau"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/rejoindre-le-reseau"]').exists()).toBe(true)
  })
})
