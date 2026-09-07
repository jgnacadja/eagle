import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onMounted,
  reactive,
  ref,
  Suspense,
  watchEffect
} from 'vue'
import DemandePage from '~/pages/centres/demande-de-formation.vue'

const seoMock = vi.fn()
const fetchMock = vi.fn()

vi.stubGlobal('reactive', reactive)
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watchEffect', watchEffect)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useContentSeo', seoMock)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.stubGlobal('logServerError', vi.fn())
vi.stubGlobal('$fetch', fetchMock)
vi.stubGlobal('useAsyncData', async (_key: string, handler: () => Promise<unknown>) => ({
  data: ref(await handler())
}))

const centreCreteil = {
  slug: 'creteil',
  name: 'Centre LEARN UP de Créteil',
  city: 'Créteil',
  department: 'Val-de-Marne',
  postal_code: '94000'
}

vi.stubGlobal(
  'useDirectusList',
  vi.fn(async () => ref([centreCreteil]))
)

const routeStub = {
  query: {} as Record<string, string>,
  meta: {} as { breadcrumb?: unknown }
}
vi.stubGlobal('useRoute', () => routeStub)

const courseSst = {
  slug: 'sst-initial',
  title: 'SST — Sauveteur secouriste du travail',
  durationDays: 2,
  certification: 'Certificat SST',
  certifierName: 'INRS',
  sessions: [
    {
      id: 'sess-1',
      startDate: '2026-10-12',
      endDate: '2026-10-13',
      modality: 'presentiel',
      seatsRemaining: 5,
      location: {
        name: 'Centre de Créteil',
        city: 'Créteil',
        postalCode: '94000',
        department: 'Val-de-Marne',
        region: 'Île-de-France',
        centreSlug: 'creteil'
      }
    }
  ]
}

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  Button: { template: '<button><slot /></button>' },
  Card: { template: '<div><slot /></div>' },
  Input: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  Textarea: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  Label: { template: '<label><slot /></label>' },
  Select: { template: '<div><slot /></div>' },
  SelectTrigger: { template: '<button type="button"><slot /></button>' },
  SelectContent: { template: '<div><slot /></div>' },
  SelectItem: { props: ['value'], template: '<span><slot /></span>' },
  SelectValue: { props: ['placeholder'], template: '<span>{{ placeholder }}</span>' },
  Checkbox: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<button type="button" role="checkbox" @click="$emit(\'update:modelValue\', !modelValue)" />'
  },
  IconCheck: true,
  IconMapPin: true,
  IconBook: true,
  IconCalendar: true,
  IconSparkle: true
}

const Host = defineComponent({
  setup: () => () => h(Suspense, () => h(DemandePage))
})

async function mountPage() {
  const wrapper = mount(Host, { global: { stubs } })
  await flushPromises()
  return wrapper
}

describe('pages/centres/demande-de-formation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeStub.query = {}
    routeStub.meta = {}
    window.sessionStorage.clear()
    fetchMock.mockImplementation(async () => courseSst)
  })

  it('affiche le titre, le stepper et les trois sections du formulaire', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Demande de formation')
    expect(wrapper.text()).toContain('Votre besoin')
    expect(wrapper.text()).toContain('Votre entreprise')
    expect(wrapper.text()).toContain('Vos coordonnées')
    expect(wrapper.find('ol[aria-label="Progression"]').exists()).toBe(true)
  })

  it('affiche les champs du formulaire avec leurs labels', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Salariés à former')
    expect(wrapper.text()).toContain('Échéance souhaitée')
    expect(wrapper.text()).toContain('Précisions')
    expect(wrapper.text()).toContain('Raison sociale')
    expect(wrapper.text()).toContain('SIRET')
    expect(wrapper.text()).toContain('Nom et prénom')
    expect(wrapper.text()).toContain('Fonction')
    expect(wrapper.text()).toContain('E-mail professionnel')
    expect(wrapper.text()).toContain('Téléphone')
    expect(wrapper.text()).toContain('Politique de confidentialité')
  })

  it('affiche le contexte générique sans paramètres (RG04)', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Votre demande concerne')
    expect(wrapper.text()).toContain('Votre projet de formation')
    expect(wrapper.text()).not.toContain('SST — Sauveteur')
    expect(wrapper.text()).not.toContain('Session du')
  })

  it('résout le nom du centre depuis Directus', async () => {
    routeStub.query = { centre: 'creteil' }
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Centre LEARN UP de Créteil')
    expect(wrapper.text()).toContain('Créteil · Val-de-Marne · 94000')
    expect(routeStub.meta.breadcrumb).toEqual([
      { label: 'Accueil', to: '/' },
      { label: 'Centres', to: '/centres' },
      { label: 'Centre LEARN UP de Créteil', to: '/centres/creteil' },
      { label: 'Demande de formation' }
    ])
  })

  it('résout la formation depuis l’API quand famille + formation sont transmis', async () => {
    routeStub.query = { famille: 'sante', formation: 'sst-initial' }
    const wrapper = await mountPage()

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/courses/sante/sst-initial')
    expect(wrapper.text()).toContain('SST — Sauveteur secouriste du travail')
    expect(wrapper.text()).toContain('2 jours · Certificat SST · INRS')
    expect(wrapper.text()).not.toContain('Session du')
  })

  it('affiche les 3 blocs quand centre + formation + session sont transmis', async () => {
    routeStub.query = {
      centre: 'creteil',
      famille: 'sante',
      formation: 'sst-initial',
      session: 'sess-1'
    }
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Centre LEARN UP de Créteil')
    expect(wrapper.text()).toContain('SST — Sauveteur secouriste du travail')
    expect(wrapper.text()).toContain('Session du 12 octobre 2026')
    expect(wrapper.text()).toContain('5 places disponibles')
  })

  it('affiche un libellé générique pour une formation introuvable dans l’API', async () => {
    fetchMock.mockImplementation(async () => null)
    routeStub.query = { famille: 'sante', formation: 'formation-inconnue' }
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Formation du catalogue')
  })

  it("le lien Modifier renvoie au point d'origine selon le niveau transmis", async () => {
    routeStub.query = { centre: 'creteil' }
    let wrapper = await mountPage()
    expect(wrapper.find('aside a').attributes('href')).toBe('/centres/creteil')

    routeStub.query = {
      centre: 'creteil',
      formation: 'sst-initial',
      famille: 'sante'
    }
    wrapper = await mountPage()
    expect(wrapper.find('aside a').attributes('href')).toBe('/formations/sante/sst-initial')

    routeStub.query = {
      centre: 'creteil',
      formation: 'sst-initial',
      session: 'sess-1',
      famille: 'sante'
    }
    wrapper = await mountPage()
    expect(wrapper.find('aside a').attributes('href')).toBe(
      '/formations/sante/sst-initial#sessions'
    )
  })

  it('sauvegarde la saisie au clic sur Modifier et la restaure au retour', async () => {
    const wrapper = await mountPage()
    await wrapper.find('form input').setValue('12')

    await wrapper.find('aside a').trigger('click')
    expect(window.sessionStorage.getItem('demande-formation-draft')).toContain('"salaries":"12"')

    const wrapper2 = await mountPage()
    await nextTick()
    expect((wrapper2.find('form input').element as HTMLInputElement).value).toBe('12')
  })

  it("efface le brouillon à l'envoi du formulaire", async () => {
    window.sessionStorage.setItem('demande-formation-draft', '{"salaries":5,"consentement":true}')
    const wrapper = await mountPage()
    await nextTick()

    await wrapper.find('form').trigger('submit.prevent')
    expect(window.sessionStorage.getItem('demande-formation-draft')).toBeNull()
  })

  it("bloque l'envoi tant que le consentement n'est pas donné", async () => {
    window.sessionStorage.setItem('demande-formation-draft', '{"salaries":5}')
    const wrapper = await mountPage()

    await wrapper.find('form').trigger('submit.prevent')
    expect(window.sessionStorage.getItem('demande-formation-draft')).not.toBeNull()
  })

  it('prend la première valeur quand un query param est répété', async () => {
    routeStub.query = { centre: ['creteil', 'autre'] as unknown as string }
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Centre LEARN UP de Créteil')
    expect(wrapper.find('aside a').attributes('href')).toBe('/centres/creteil')
  })

  it('affiche un breadcrumb générique sans contexte', async () => {
    await mountPage()

    expect(routeStub.meta.breadcrumb).toEqual([
      { label: 'Accueil', to: '/' },
      { label: 'Centres', to: '/centres' },
      { label: 'Demande de formation' }
    ])
  })

  it('applique le SEO de la page', async () => {
    await mountPage()

    expect(seoMock).toHaveBeenCalledWith(
      expect.objectContaining({ seo_title: 'Demande de formation | LEARN UP ACADEMY' }),
      'Demande de formation'
    )
  })

  it('le formulaire se soumet sans recharger la page', async () => {
    const wrapper = await mountPage()

    await wrapper.find('form').trigger('submit.prevent')
    // Pas d'erreur ni de navigation — l'envoi est simulé côté maquette.
    expect(wrapper.find('form').exists()).toBe(true)
  })
})
