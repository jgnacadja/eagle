// test/pages/entreprise-reseau.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, Suspense } from 'vue'
import ReseauPage from '~/pages/entreprise-reseau.vue'

beforeEach(() => {
  vi.stubGlobal('useContentSeo', vi.fn())
  vi.stubGlobal('definePageMeta', vi.fn())
})

const stubs = {
  global: {
    stubs: {
      NuxtLink: {
        props: ['to'],
        template: '<a :href="to"><slot /></a>'
      },
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

describe('pages/entreprise-reseau.vue', () => {
  it('affiche le titre h1 attendu', async () => {
    const wrapper = await mountReseau()
    const h1 = wrapper.find('h1')

    expect(h1.exists()).toBe(true)
    expect(h1.text()).toContain('Les entreprises qui forment avec')
    expect(h1.text()).toContain('le réseau')
  })

  it('affiche les trois statistiques du réseau', async () => {
    const wrapper = await mountReseau()

    expect(wrapper.text()).toContain('+250')
    expect(wrapper.text()).toContain('formations')
    expect(wrapper.text()).toContain('France entière')
    expect(wrapper.text()).toContain('couverte par le réseau')
    expect(wrapper.text()).toContain('312')
    expect(wrapper.text()).toContain('sessions ouvertes')
  })

  it('liste les secteurs soumis à obligations réglementaires', async () => {
    const wrapper = await mountReseau()

    expect(wrapper.text()).toContain('Des secteurs soumis à obligations réglementaires')
    expect(wrapper.text()).toContain('BTP & construction')
    expect(wrapper.text()).toContain('Travail temporaire')
    expect(wrapper.text()).toContain('Industrie & énergie')
    expect(wrapper.text()).toContain('Collectivités & services techniques')
    expect(wrapper.text()).toContain('Grande distribution')
    expect(wrapper.text()).toContain('Tertiaire & immobilier')
    expect(wrapper.text()).toContain('Transport & logistique')
    expect(wrapper.text()).toContain("Votre secteur n'est pas listé ?")
    expect(wrapper.text()).toContain('Voir le catalogue complet')
  })

  it('présente les segments d’entreprises de la PME au groupe multi-sites', async () => {
    const wrapper = await mountReseau()

    expect(wrapper.text()).toContain('De la PME au groupe multi-sites')
    expect(wrapper.text()).toContain('PME & ARTISANS')
    expect(wrapper.text()).toContain('Un centre à proximité')
    expect(wrapper.text()).toContain('ENTREPRISES MULTI-SITES')
    expect(wrapper.text()).toContain('Un interlocuteur, plusieurs territoires')
    expect(wrapper.text()).toContain('GRANDS COMPTES')
    expect(wrapper.text()).toContain('Des besoins récurrents planifiés')
  })

  it('présente ce que les entreprises trouvent dans le réseau', async () => {
    const wrapper = await mountReseau()

    expect(wrapper.text()).toContain('Ce que les entreprises trouvent dans le réseau')
    expect(wrapper.text()).toContain('Une réponse locale partout en France')
    expect(wrapper.text()).toContain('Des sessions réelles, publiées en temps réel')
    expect(wrapper.text()).toContain('Un interlocuteur unique')
    expect(wrapper.text()).toContain('Le suivi des échéances réglementaires')
  })

  it('propose les CTA catalogue et « Être guidé dans mon choix » (moteur IA)', async () => {
    const wrapper = await mountReseau()
    const hrefs = wrapper.findAll('a').map((link) => link.attributes('href'))

    expect(hrefs).toContain('/formations')
    expect(wrapper.find('#assistant-trigger-entreprise-reseau').text()).toContain(
      'Être guidé dans mon choix'
    )
  })
})
