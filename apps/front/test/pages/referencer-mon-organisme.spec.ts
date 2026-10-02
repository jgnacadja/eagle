import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, Suspense, ref } from 'vue'
import OrganismePage from '~/pages/referencer-mon-organisme.vue'

beforeEach(() => {
  vi.stubGlobal('useContentSeo', vi.fn())
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
      ProcessSteps: true,
      CenterMap: true,
      StatItem: {
        props: ['value', 'label'],
        template: '<div class="stat">{{ value }} {{ label }}</div>'
      },
      Benefits: { props: ['title'], template: '<section><h2>{{ title }}</h2></section>' },
      Candidature: {
        name: 'Candidature',
        props: ['open', 'voie'],
        emits: ['update:open'],
        template:
          '<div class="candidature-dialog" :data-open="String(open)" :data-voie="voie"><button class="cand-close" @click="$emit(\'update:open\', false)" /></div>'
      }
    }
  }
}

async function mountOrganisme() {
  const wrapper = mount(
    defineComponent({
      render() {
        return h(Suspense, null, {
          default: () => h(OrganismePage),
          fallback: () => h('div', 'loading')
        })
      }
    }),
    stubs
  )
  await flushPromises()
  return wrapper
}

describe('pages/referencer-mon-organisme.vue', () => {
  it('affiche le titre h1 attendu', async () => {
    const wrapper = await mountOrganisme()
    const h1 = wrapper.find('h1')

    expect(h1.exists()).toBe(true)
    expect(h1.text()).toContain('Référencer vos centres')
  })

  it('expose les ancres #modele et #candidater', async () => {
    const wrapper = await mountOrganisme()

    expect(wrapper.find('#modele').exists()).toBe(true)
    expect(wrapper.find('#candidater').exists()).toBe(true)
  })

  it('lie le titre "maillage" à sa section via aria-labelledby', async () => {
    const wrapper = await mountOrganisme()
    const section = wrapper.find('#maillage')
    const title = wrapper.find('#maillage-title')

    expect(section.exists()).toBe(true)
    expect(title.exists()).toBe(true)
    expect(section.attributes('aria-labelledby')).toBe('maillage-title')
  })

  it('affiche les trois chiffres clés du maillage', async () => {
    const wrapper = await mountOrganisme()

    expect(wrapper.findAll('.stat')).toHaveLength(3)
    expect(wrapper.text()).toContain('centres partenaires')
    expect(wrapper.text()).toContain('départements couverts')
    expect(wrapper.text()).toContain('formations au catalogue')
  })

  it("affiche le placeholder carte quand aucun centre n'est retourné", async () => {
    const wrapper = await mountOrganisme()

    expect(wrapper.text()).toContain('Carte de France interactive')
  })

  it('le CTA final ouvre le dialog de candidature voie « organisme »', async () => {
    const wrapper = await mountOrganisme()

    const dialog = () => wrapper.find('.candidature-dialog')
    expect(dialog().attributes('data-voie')).toBe('organisme')
    expect(dialog().attributes('data-open')).toBe('false')

    const cta = wrapper.findAll('button').find((b) => b.text() === 'Déposer une candidature')
    expect(cta).toBeTruthy()
    await cta!.trigger('click')

    expect(dialog().attributes('data-open')).toBe('true')
  })

  it('referme le dialog quand la candidature émet update:open', async () => {
    const wrapper = await mountOrganisme()

    const cta = wrapper.findAll('button').find((b) => b.text() === 'Déposer une candidature')
    await cta!.trigger('click')
    expect(wrapper.find('.candidature-dialog').attributes('data-open')).toBe('true')

    await wrapper.find('.cand-close').trigger('click')
    expect(wrapper.find('.candidature-dialog').attributes('data-open')).toBe('false')
  })

  it('affiche la carte quand des centres sont retournés', async () => {
    vi.stubGlobal(
      'useDirectusList',
      vi.fn(() =>
        Promise.resolve(
          ref([
            {
              slug: 'creteil',
              name: 'Centre de Créteil',
              city: 'Créteil',
              postal_code: '94000',
              department: 'Val-de-Marne',
              latitude: 48.79,
              longitude: 2.45
            }
          ])
        )
      )
    )
    const wrapper = await mountOrganisme()

    expect(wrapper.findComponent({ name: 'CenterMap' }).exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Carte de France interactive')
  })
})
