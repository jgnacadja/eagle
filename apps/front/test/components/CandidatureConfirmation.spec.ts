import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Confirmation from '~/components/Candidature/Confirmation.vue'

function mountConfirmation(projet = 'Ouvrir un centre — Créteil (94)') {
  return mount(Confirmation, {
    props: { projet },
    global: {
      // reka-ui DialogTitle/DialogDescription exigent un DialogRoot parent —
      // hors contexte de dialogue on les remplace par des stubs neutres.
      stubs: {
        DialogTitle: { template: '<h2><slot /></h2>' },
        DialogDescription: { template: '<p><slot /></p>' }
      }
    }
  })
}

describe('components/CandidatureConfirmation', () => {
  it('confirme la transmission avec le récapitulatif du projet', () => {
    const wrapper = mountConfirmation()

    expect(wrapper.text()).toContain('Votre candidature est transmise')
    expect(wrapper.text()).toContain('Ouvrir un centre — Créteil (94)')
    expect(wrapper.text()).toContain('sous 5 jours ouvrés')
  })

  it('affiche le projet passé en prop', () => {
    const wrapper = mountConfirmation('Devenir formateur — Lyon (69)')

    expect(wrapper.text()).toContain('Devenir formateur — Lyon (69)')
  })

  it('propose les liens de sortie vers l’accueil et les actualités', () => {
    const wrapper = mountConfirmation()
    const links = wrapper.findAll('a')

    expect(links).toHaveLength(2)
    expect(links[0].attributes('href')).toBe('/')
    expect(links[0].text()).toContain("Retour à l'accueil")
    expect(links[1].attributes('href')).toBe('/actualites')
    expect(links[1].text()).toContain('actualités')
  })
})
