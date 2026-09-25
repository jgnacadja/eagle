import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProcessStepsStep from '~/components/ProcessSteps/Step.vue'

const step = {
  title: 'Candidature',
  body: 'Vous décrivez votre projet et votre territoire.'
}

const mountStep = (props = {}) =>
  mount(ProcessStepsStep, {
    props: {
      step,
      index: 0,
      isLast: false,
      lastStepVariant: 'success',
      titleSize: 'body',
      ...props
    }
  })

describe('ProcessStepsStep', () => {
  it('rend le titre et le corps de l’étape', () => {
    const wrapper = mountStep()

    expect(wrapper.find('li').exists()).toBe(true)
    expect(wrapper.find('h3').text()).toBe('Candidature')
    expect(wrapper.find('p').text()).toBe('Vous décrivez votre projet et votre territoire.')
  })

  it('affiche index + 1 quand step.number est absent', () => {
    const wrapper = mountStep({ index: 2 })

    expect(wrapper.find('span').text()).toBe('3')
  })

  it('affiche step.number quand il est fourni', () => {
    const wrapper = mountStep({ step: { ...step, number: 7 } })

    expect(wrapper.find('span').text()).toBe('7')
  })

  it('badge primary pour une étape non finale', () => {
    const wrapper = mountStep({ isLast: false })

    expect(wrapper.find('span').classes()).toContain('bg-primary')
  })

  it.each([
    ['success', 'bg-success'],
    ['accent', 'bg-accent'],
    ['primary', 'bg-primary']
  ] as const)('badge %s pour la dernière étape', (variant, expected) => {
    const wrapper = mountStep({ isLast: true, lastStepVariant: variant })

    expect(wrapper.find('span').classes()).toContain(expected)
  })

  it('applique la taille h4 au titre', () => {
    const wrapper = mountStep({ titleSize: 'h4' })
    const title = wrapper.find('h3')

    expect(title.classes()).toContain('font-display')
    expect(title.classes()).toContain('text-h4')
    expect(title.classes()).toContain('font-extrabold')
  })

  it('applique la taille body par défaut', () => {
    const wrapper = mountStep({ titleSize: 'body' })
    const title = wrapper.find('h3')

    expect(title.classes()).toContain('font-sans')
    expect(title.classes()).toContain('text-body')
  })
})
