import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProcessSteps from '~/components/ProcessSteps/index.vue'

const steps = [
  {
    title: 'Candidature',
    body: 'Vous décrivez votre projet et votre territoire.'
  },
  {
    title: 'Échange et étude',
    body: 'Entretien, étude du territoire et du potentiel local.'
  },
  {
    title: 'Convention',
    body: 'Cadre contractuel et plan d’ouverture partagé.'
  },
  {
    title: 'Ouverture',
    body: 'Formation aux outils, lancement, accompagnement continu.'
  }
]

describe('ProcessSteps', () => {
  it('rend toutes les étapes', () => {
    const wrapper = mount(ProcessSteps, {
      props: {
        steps
      }
    })

    const items = wrapper.findAll('li')

    expect(items).toHaveLength(4)

    expect(wrapper.text()).toContain('Candidature')
    expect(wrapper.text()).toContain('Échange et étude')
    expect(wrapper.text()).toContain('Convention')
    expect(wrapper.text()).toContain('Ouverture')
  })

  it('applique la classe grid-cols-4 pour quatre étapes', () => {
    const wrapper = mount(ProcessSteps, {
      props: {
        steps
      }
    })

    expect(wrapper.find('ol').classes()).toContain('md:grid-cols-4')
  })

  it('applique la classe grid-cols-3 pour trois étapes', () => {
    const wrapper = mount(ProcessSteps, {
      props: {
        steps: steps.slice(0, 3)
      }
    })

    expect(wrapper.find('ol').classes()).toContain('md:grid-cols-3')
  })

  it('applique la classe grid-cols-5 pour cinq étapes', () => {
    const wrapper = mount(ProcessSteps, {
      props: {
        steps: [
          ...steps,
          {
            title: 'Dernière étape',
            body: 'Description de la dernière étape.'
          }
        ]
      }
    })

    expect(wrapper.find('ol').classes()).toContain('md:grid-cols-5')
  })

  it('utilise grid-cols-4 pour deux étapes', () => {
    const wrapper = mount(ProcessSteps, {
      props: {
        steps: steps.slice(0, 2)
      }
    })

    expect(wrapper.find('ol').classes()).toContain('md:grid-cols-4')
  })

  it('applique la taille h4 aux titres', () => {
    const wrapper = mount(ProcessSteps, {
      props: {
        steps,
        titleSize: 'h4'
      }
    })

    const titles = wrapper.findAll('h3')

    expect(titles).toHaveLength(4)

    titles.forEach((title) => {
      expect(title.classes()).toContain('font-display')
      expect(title.classes()).toContain('text-h4')
      expect(title.classes()).toContain('font-extrabold')
    })
  })

  it('utilise la taille body par défaut', () => {
    const wrapper = mount(ProcessSteps, {
      props: {
        steps
      }
    })

    const titles = wrapper.findAll('h3')

    titles.forEach((title) => {
      expect(title.classes()).toContain('font-sans')
      expect(title.classes()).toContain('text-body')
    })
  })

  it('rend les lignes décoratives avec aria-hidden', () => {
    const wrapper = mount(ProcessSteps, {
      props: {
        steps
      }
    })

    const decorativeLines = wrapper.findAll('[aria-hidden="true"]')

    expect(decorativeLines).toHaveLength(2)
  })

  it('rend une liste ordonnée', () => {
    const wrapper = mount(ProcessSteps, {
      props: {
        steps
      }
    })

    expect(wrapper.find('ol').exists()).toBe(true)
  })

  it('masque la ligne de liaison avec une seule étape', () => {
    const wrapper = mount(ProcessSteps, {
      props: { steps: steps.slice(0, 1) }
    })

    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.find('[style*="display: none"]').exists()).toBe(true)
  })

  it('rend chaque étape comme un élément li', () => {
    const wrapper = mount(ProcessSteps, {
      props: {
        steps
      }
    })

    const items = wrapper.findAll('li')

    items.forEach((item) => {
      expect(item.find('h3').exists()).toBe(true)
      expect(item.find('p').exists()).toBe(true)
      expect(item.find('span').exists()).toBe(true)
    })
  })
})
