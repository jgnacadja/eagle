import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref, Suspense } from 'vue'
import CentresPage from '~/pages/centres/index.vue'

const seoMock = vi.fn()

const directusCentres = [
  {
    id: 1,
    status: 'published',
    slug: 'creteil',
    name: 'Centre de Créteil',
    address: '14 rue des Refuzniks',
    city: 'Créteil',
    postal_code: '94000',
    department: 'Val-de-Marne',
    region: 'Île-de-France',
    specialties: ['CACES', 'SST'],
    departments_covered: ['94', '93']
  },
  {
    id: 2,
    status: 'published',
    slug: 'vitry',
    name: 'Centre de Vitry-sur-Seine',
    address: '2 avenue de Vitry',
    city: 'Vitry-sur-Seine',
    postal_code: '94400',
    department: 'Val-de-Marne',
    region: 'Île-de-France',
    specialties: ['CACES'],
    departments_covered: ['94']
  },
  {
    id: 3,
    status: 'published',
    slug: 'lyon',
    name: 'Centre de Lyon',
    address: '12 cours Lafayette',
    city: 'Lyon',
    postal_code: '69003',
    department: 'Rhône',
    region: 'Auvergne-Rhône-Alpes',
    specialties: ['Informatique'],
    departments_covered: ['69']
  }
]

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useContentSeo', seoMock)
vi.stubGlobal('useRoute', () => ({ query: {} }))
vi.stubGlobal('useDirectusList', async () => ref(directusCentres))

const stubs = {
  NuxtLink: { template: '<a><slot /></a>' },
  Label: { template: '<label><slot /></label>' },
  Select: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<select class="dept-select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>'
  },
  SelectTrigger: { template: '<span><slot /></span>' },
  SelectContent: { template: '<span><slot /></span>' },
  SelectItem: {
    props: ['value'],
    template: '<option :value="value"><slot /></option>'
  },
  SearchInput: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'submit'],
    template:
      '<input class="city-search" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  Button: { template: '<button><slot /></button>' },
  CenterResultCard: {
    props: ['center', 'active'],
    emits: ['select'],
    template:
      '<div class="center-card" :data-active="active" @click="$emit(\'select\', center.id)">{{ center.name }}</div>'
  }
}

async function mountPage() {
  const Host = defineComponent({
    render() {
      return h(Suspense, () => h(CentresPage))
    }
  })
  const wrapper = mount(Host, { global: { stubs } })
  await flushPromises()
  return wrapper
}

describe('pages/centres/index', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche les centres issus de Directus', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Réseau de centres')
    expect(wrapper.findAll('.center-card')).toHaveLength(3)
    expect(wrapper.text()).toContain('3 centres')
    // Le premier centre est actif par défaut (watch immediate).
    expect(wrapper.find('.center-card').attributes('data-active')).toBe('true')
  })

  it('construit le filtre département depuis les données', async () => {
    const wrapper = await mountPage()

    const options = wrapper.findAll('option').map((o) => o.text())
    expect(options).toContain('Tous les départements')
    expect(options).toContain('Val-de-Marne')
    expect(options).toContain('Rhône')
    expect(options).toContain('94')
  })

  it('filtre les centres par département', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.dept-select').setValue('Val-de-Marne')
    expect(wrapper.findAll('.center-card')).toHaveLength(2)

    await wrapper.find('.dept-select').setValue('Rhône')
    expect(wrapper.findAll('.center-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('Centre de Lyon')
  })

  it('filtre les centres par la recherche ville/code postal', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.city-search').setValue('vitry')

    const cards = wrapper.findAll('.center-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.text()).toContain('Vitry-sur-Seine')
  })

  it('affiche l’état vide quand aucun centre ne correspond', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.city-search').setValue('zzz-inexistant')

    expect(wrapper.findAll('.center-card')).toHaveLength(0)
    expect(wrapper.text()).toContain('Aucun centre ne correspond à cette sélection')
  })

  it('un clic sur une carte active/désactive le centre', async () => {
    const wrapper = await mountPage()

    const first = wrapper.find('.center-card')
    expect(first.attributes('data-active')).toBe('true')

    await first.trigger('click')
    expect(first.attributes('data-active')).toBe('false')

    await first.trigger('click')
    expect(first.attributes('data-active')).toBe('true')
  })

  it('définit le SEO de la page réseau', async () => {
    await mountPage()

    expect(seoMock).toHaveBeenCalledWith(
      expect.objectContaining({ seo_title: 'Réseau de centres — LEARN UP ACADEMY' }),
      'Réseau de centres — LEARN UP ACADEMY'
    )
  })
})
