import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, Suspense, ref } from 'vue'
import AProposPage from '~/pages/a-propos.vue'

const mockUseContentSeo = vi.fn()

beforeEach(() => {
  mockUseContentSeo.mockClear()
  vi.stubGlobal('definePageMeta', vi.fn())
  vi.stubGlobal('useContentSeo', mockUseContentSeo)
  vi.stubGlobal('useHead', vi.fn())
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { siteUrl: 'https://learnup.fr' } }))
  vi.stubGlobal(
    'useDirectusList',
    vi.fn(() => Promise.resolve(ref([])))
  )
  vi.stubGlobal('useGeolocation', () => ({
    position: ref(null),
    loading: ref(false),
    error: ref(null)
  }))
})

const stubs = {
  global: {
    stubs: {
      NuxtLink: {
        props: ['to'],
        template: '<a :href="to"><slot /></a>'
      },
      CenterMap: {
        name: 'CenterMap',
        props: ['centers', 'activeId', 'caption', 'userPosition'],
        template: '<div class="center-map" :data-count="centers.length" />'
      }
    }
  }
}

async function mountAPropos() {
  const wrapper = mount(
    defineComponent({
      render() {
        return h(Suspense, null, {
          default: () => h(AProposPage),
          fallback: () => h('div', 'loading')
        })
      }
    }),
    stubs
  )
  await flushPromises()
  return wrapper
}

describe('pages/a-propos.vue', () => {
  it('affiche le titre H1 attendu avec la partie accentuée', async () => {
    const wrapper = await mountAPropos()
    const h1 = wrapper.find('h1')

    expect(h1.exists()).toBe(true)
    expect(h1.text()).toContain('Le conseil en formation')
    expect(h1.text()).toContain('au plus près du terrain.')
  })

  it('affiche le badge Qui sommes-nous et le texte d introduction', async () => {
    const wrapper = await mountAPropos()

    expect(wrapper.text()).toContain('Qui sommes-nous')
    expect(wrapper.text()).toContain(
      "Learn Up Academy est une plateforme de conseil et d'orientation"
    )
  })

  it('propose les CTAs de héros vers le conseiller et le réseau', async () => {
    const wrapper = await mountAPropos()
    const links = wrapper.findAll('a')

    const conseillerLink = links.find(
      (l) =>
        l.text().includes('Parler à un conseiller') &&
        l.attributes('href') === '/parler-a-votre-conseiller'
    )
    const reseauLink = links.find(
      (l) => l.text().includes('Découvrir le réseau') && l.attributes('href') === '#reseau'
    )

    expect(conseillerLink).toBeTruthy()
    expect(reseauLink).toBeTruthy()
  })

  it('affiche le bandeau de chiffres clés et indicateurs', async () => {
    const wrapper = await mountAPropos()

    expect(wrapper.text()).toContain('Réseau national')
    expect(wrapper.text()).toContain('Centres partenaires — France entière')
    expect(wrapper.text()).toContain('Formations au catalogue')
    expect(wrapper.text()).toContain('Stagiaires accompagnés par an')
    expect(wrapper.text()).toContain('Qualiopi')
    expect(wrapper.text()).toContain('Certification — périmètre à confirmer')
    expect(wrapper.text()).toContain('DYN.')
  })

  it('présente la section Notre mission avec son titre et son visuel', async () => {
    const wrapper = await mountAPropos()
    const missionSection = wrapper.find('#mission')

    expect(missionSection.exists()).toBe(true)
    expect(missionSection.find('#mission-title').text()).toBe(
      'Rendre la formation réglementaire simple à trouver, à organiser et à suivre'
    )
    const img = missionSection.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/formation1.webp')
  })

  it('affiche les 3 étapes de Notre métier', async () => {
    const wrapper = await mountAPropos()
    const metierSection = wrapper.find('#metier')

    expect(metierSection.exists()).toBe(true)
    expect(metierSection.find('#metier-title').text()).toBe('Trois étapes, un interlocuteur')

    expect(metierSection.text()).toContain('01')
    expect(metierSection.text()).toContain('Comprendre')
    expect(metierSection.text()).toContain('02')
    expect(metierSection.text()).toContain('Localiser')
    expect(metierSection.text()).toContain('03')
    expect(metierSection.text()).toContain('Orchestrer')
  })

  it('détaille les 4 piliers d engagements', async () => {
    const wrapper = await mountAPropos()
    const engagementsSection = wrapper.find('#engagements')

    expect(engagementsSection.exists()).toBe(true)
    expect(engagementsSection.text()).toContain('Des centres sélectionnés')
    expect(engagementsSection.text()).toContain('Un conseil humain')
    expect(engagementsSection.text()).toContain('Une réponse rapide')
    expect(engagementsSection.text()).toContain('Une information claire')
  })

  it('affiche la démarche Qualité et l accessibilité handicap', async () => {
    const wrapper = await mountAPropos()

    expect(wrapper.text()).toContain('Une démarche qualité certifiée')
    expect(wrapper.text()).toContain('Télécharger le certificat (PDF)')
    expect(wrapper.text()).toContain('Des formations accessibles à tous')
    expect(wrapper.text()).toContain('Contacter le référent handicap')
  })

  it('ouvre la modale Qualiopi au clic sur le bouton de téléchargement', async () => {
    const wrapper = await mountAPropos()

    const downloadLink = wrapper
      .findAll('a')
      .find((a) => a.text().includes('Télécharger le certificat (PDF)'))
    expect(downloadLink).toBeTruthy()

    await downloadLink!.trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Certificat Qualiopi')
  })

  it('affiche la section réseau avec la carte interactive', async () => {
    vi.stubGlobal(
      'useDirectusList',
      vi.fn(() =>
        Promise.resolve(
          ref([
            {
              slug: 'paris-centre',
              name: 'Paris Centre',
              city: 'Paris',
              postal_code: '75001',
              latitude: 48.86,
              longitude: 2.34
            }
          ])
        )
      )
    )

    const wrapper = await mountAPropos()
    const reseauSection = wrapper.find('#reseau')

    expect(reseauSection.exists()).toBe(true)
    expect(reseauSection.findComponent({ name: 'CenterMap' }).exists()).toBe(true)
    expect(reseauSection.text()).toContain('Un réseau national de centres, une seule marque')

    const links = reseauSection.findAll('a')
    expect(links.some((l) => l.attributes('href') === '/centres')).toBe(true)
    expect(links.some((l) => l.attributes('href') === '/rejoindre-le-reseau')).toBe(true)
  })

  it('affiche le fallback quand aucun centre n est disponible', async () => {
    const wrapper = await mountAPropos()
    const reseauSection = wrapper.find('#reseau')

    expect(reseauSection.text()).toContain('Carte interactive du réseau')
    expect(reseauSection.text()).toContain('Plus de 400 centres partenaires')
  })

  it('affiche le bandeau de contact final', async () => {
    const wrapper = await mountAPropos()
    const ctaSection = wrapper.find('#contact-cta')

    expect(ctaSection.exists()).toBe(true)
    expect(ctaSection.text()).toContain(
      'Une question sur nos services ou une formation à organiser ?'
    )
    expect(ctaSection.text()).toContain('Un conseiller vous répond et vous oriente.')

    const links = ctaSection.findAll('a')
    expect(links.some((l) => l.attributes('href') === '/parler-a-votre-conseiller')).toBe(true)
    expect(links.some((l) => l.attributes('href') === '/formations')).toBe(true)
  })

  it('configure useContentSeo avec les métadonnées de la page', async () => {
    await mountAPropos()

    expect(mockUseContentSeo).toHaveBeenCalledWith(
      expect.objectContaining({
        seo_title: expect.stringContaining('À propos'),
        seo_description: expect.stringContaining('Learn Up Academy')
      }),
      expect.stringContaining('À propos')
    )
  })
})
