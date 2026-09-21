// test/pages/reseau.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, Suspense, ref } from 'vue'
import ReseauPage from '~/pages/partenaires.vue'

beforeEach(() => {
  vi.stubGlobal('useContentSeo', vi.fn())
  vi.stubGlobal('definePageMeta', vi.fn())
  vi.stubGlobal('useHead', vi.fn())
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { siteUrl: 'https://learnup.fr' } }))
  vi.stubGlobal(
    'useDirectusList',
    vi.fn(() => Promise.resolve(ref([])))
  )
})

const stubs = {
  global: {
    stubs: {
      NuxtLink: {
        props: ['to'],
        template: '<a :href="to"><slot /></a>'
      },
      CenterMap: true,
      IconBuilding: true,
      IconLayers: true,
      IconCheck: true,
      StatItem: {
        props: ['value', 'label'],
        template: '<div><span>{{ value }}</span><span>{{ label }}</span></div>'
      }
    }
  }
}

async function mountReseau() {
  const wrapper = mount(
    defineComponent({
      render() {
        return h(Suspense, null, {
          default: () => h(ReseauPage),
          fallback: () => h('div', 'loading')
        })
      }
    }),
    stubs
  )
  await flushPromises()
  return wrapper
}

describe('pages/a-propos/reseau.vue', () => {
  it('affiche le titre h1 attendu', async () => {
    const wrapper = await mountReseau()
    const h1 = wrapper.find('h1')

    expect(h1.exists()).toBe(true)
    expect(h1.text()).toContain('Le réseau et ses partenaires')
  })

  it('affiche les trois statistiques du réseau', async () => {
    const wrapper = await mountReseau()

    expect(wrapper.text()).toContain('+400')
    expect(wrapper.text()).toContain('centres partenaires')
    expect(wrapper.text()).toContain('96')
    expect(wrapper.text()).toContain('départements couverts')
    expect(wrapper.text()).toContain('+250')
    expect(wrapper.text()).toContain('formations au catalogue')
  })

  it('présente les deux types de membres du réseau', async () => {
    const wrapper = await mountReseau()

    expect(wrapper.text()).toContain('Des centres de formation partout en France')
    expect(wrapper.text()).toContain('Des organismes de formation référencés')
  })

  it('liste les quatre engagements qualité', async () => {
    const wrapper = await mountReseau()

    expect(wrapper.text()).toContain('Certifications et habilitations à jour')
    expect(wrapper.text()).toContain('Des formateurs habilités')
    expect(wrapper.text()).toContain('Des sessions réelles, publiées en temps réel')
    expect(wrapper.text()).toContain('Un interlocuteur unique')
  })

  it("affiche le placeholder carte quand aucun centre n'est retourné", async () => {
    const wrapper = await mountReseau()

    expect(wrapper.text()).toContain('Carte de France interactive')
  })

  it('propose les CTA catalogue, conseiller et rejoindre le réseau', async () => {
    const wrapper = await mountReseau()
    const hrefs = wrapper.findAll('a').map((link) => link.attributes('href'))

    expect(hrefs).toContain('/formations')
    expect(hrefs).toContain('/centres/demande-de-formation?sujet=conseiller')
    expect(hrefs).toContain('/rejoindre-le-reseau')
  })
})
