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
vi.stubGlobal('useDirectusList', () =>
  ref([
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
)

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
        Button: { template: '<button><slot /></button>' }
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

  it('affiche les avis clients et mentions', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Ils nous font confiance')
    expect(wrapper.text()).toContain('Logo Client')
    expect(wrapper.text()).toContain('Douze habilitations à renouveler')
    expect(wrapper.text()).toContain('Avis réels et références publiées')
  })

  it('affiche les blocs "Pour aller plus loin"', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain("Le réseau d'entreprises clientes")
    expect(wrapper.text()).toContain('Les partenaires du réseau')
  })
})
