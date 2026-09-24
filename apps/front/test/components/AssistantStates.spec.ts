import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AssistantAnalyzing from '~/components/Assistant/AssistantAnalyzing.vue'
import AssistantClarification from '~/components/Assistant/AssistantClarification.vue'
import AssistantComposer from '~/components/Assistant/AssistantComposer.vue'
import AssistantContextBar from '~/components/Assistant/AssistantContextBar.vue'
import AssistantExamples from '~/components/Assistant/AssistantExamples.vue'
import AssistantNoResult from '~/components/Assistant/AssistantNoResult.vue'
import AssistantNoSession from '~/components/Assistant/AssistantNoSession.vue'
import AssistantOutOfCatalog from '~/components/Assistant/AssistantOutOfCatalog.vue'
import AssistantReply from '~/components/Assistant/AssistantReply.vue'
import AssistantSummary from '~/components/Assistant/AssistantSummary.vue'
import AssistantUnavailable from '~/components/Assistant/AssistantUnavailable.vue'
import AssistantUserBubble from '~/components/Assistant/AssistantUserBubble.vue'

describe('AssistantExamples', () => {
  it('liste les exemples et émet pick au clic (pré-remplissage)', async () => {
    const wrapper = mount(AssistantExamples, { props: { examples: ['SST', 'CACES'] } })
    const buttons = wrapper.findAll('button')

    expect(wrapper.find('ul').attributes('aria-label')).toBe('Exemples de besoins')
    expect(buttons.map((b) => b.text())).toEqual(['SST', 'CACES'])
    await buttons[1]!.trigger('click')

    expect(wrapper.emitted('pick')).toEqual([['CACES']])
  })
})

describe('AssistantUserBubble / AssistantReply', () => {
  it('annonce l’auteur aux lecteurs d’écran', () => {
    const bubble = mount(AssistantUserBubble, { props: { text: 'Former 8 salariés' } })
    expect(bubble.text()).toContain('Vous :')
    expect(bubble.text()).toContain('Former 8 salariés')

    const reply = mount(AssistantReply, { slots: { default: '<p>Bonjour</p>' } })
    expect(reply.text()).toContain('Recherche assistée :')
    expect(reply.text()).toContain('Bonjour')
    expect(reply.find('svg').attributes('aria-hidden')).toBe('true')
  })
})

describe('AssistantAnalyzing', () => {
  it('affiche le texte d’analyse et un squelette décoratif', () => {
    const wrapper = mount(AssistantAnalyzing)

    expect(wrapper.text()).toContain('Analyse de votre besoin…')
    expect(wrapper.findAll('.animate-pulse')).toHaveLength(3)
    expect(wrapper.find('[aria-hidden="true"]').exists()).toBe(true)
  })
})

describe('AssistantClarification', () => {
  const clarification = {
    intro: 'Votre besoin nécessite une précision.',
    question: 'Quel type de risque ?',
    options: ['Premiers secours', 'Risque incendie']
  }

  it('pose une seule question, relie la liste de réponses et émet pick', async () => {
    const wrapper = mount(AssistantClarification, { props: { clarification } })
    const question = wrapper.find('p.font-semibold')
    const list = wrapper.find('ul')

    expect(wrapper.text()).toContain('Votre besoin nécessite une précision.')
    expect(question.text()).toBe('Quel type de risque ?')
    expect(list.attributes('aria-labelledby')).toBe(question.attributes('id'))

    await wrapper.findAll('button')[1]!.trigger('click')
    expect(wrapper.emitted('pick')).toEqual([['Risque incendie']])
  })
})

describe('AssistantComposer', () => {
  it('ignore une réponse vide et émet la réponse trimée puis vide le champ', async () => {
    const wrapper = mount(AssistantComposer)
    const input = wrapper.find('input')

    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()

    await input.setValue('  8 salariés à Créteil ')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([['8 salariés à Créteil']])
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('button').attributes('aria-label')).toBe('Envoyer ma réponse')
    expect(wrapper.find('label').text()).toBe('Répondre librement')
  })
})

describe('AssistantContextBar', () => {
  it('affiche les chips du contexte et émet edit', async () => {
    const wrapper = mount(AssistantContextBar, { props: { chips: ['SST', '8 salariés'] } })

    expect(wrapper.text()).toContain('Contexte')
    expect(wrapper.findAll('li').map((li) => li.text())).toEqual(['SST', '8 salariés'])
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('edit')).toHaveLength(1)
  })
})

describe('AssistantNoSession', () => {
  it('propose la demande de session en action principale et garde la fiche consultable', () => {
    const wrapper = mount(AssistantNoSession, {
      props: {
        noSession: {
          course: { title: 'Habilitation électrique B0-H0', to: '/formations/elec/b0-h0' },
          requestTo: '/centres/demande-de-formation?formation=b0-h0'
        }
      }
    })

    expect(wrapper.text()).toContain("aucune session n'est actuellement programmée")
    expect(wrapper.find('a[href="/centres/demande-de-formation?formation=b0-h0"]').text()).toBe(
      'Demander une session'
    )
    expect(wrapper.find('a[href="/parler-a-votre-conseiller"]').text()).toBe('Être accompagné')
    expect(wrapper.findAll('a[href="/formations/elec/b0-h0"]')).toHaveLength(2)
  })
})

describe('AssistantNoResult', () => {
  it('offre quatre portes de sortie, la demande personnalisée en tête', async () => {
    const wrapper = mount(AssistantNoResult)

    expect(wrapper.text()).toContain("Nous n'avons pas identifié de formation")
    expect(wrapper.find('a[href="/centres/demande-de-formation"]').text()).toContain(
      'Faire une demande personnalisée'
    )
    expect(wrapper.find('a[href="/formations"]').text()).toContain('Consulter le catalogue')
    expect(wrapper.find('a[href="/parler-a-votre-conseiller"]').text()).toContain(
      'Parler à un conseiller'
    )

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('reformulate')).toHaveLength(1)
  })
})

describe('AssistantOutOfCatalog', () => {
  it('signale le hors catalogue sans approximation et oriente vers un conseiller', () => {
    const wrapper = mount(AssistantOutOfCatalog, {
      props: { outOfCatalog: { message: 'Ce besoin ne correspond pas au catalogue.' } }
    })

    expect(wrapper.text()).toContain('Ce besoin ne correspond pas au catalogue.')
    expect(wrapper.find('a[href="/parler-a-votre-conseiller"]').text()).toBe(
      'Décrire mon besoin à un conseiller'
    )
    expect(wrapper.find('a[href="/formations"]').text()).toBe('Voir le catalogue')
  })
})

describe('AssistantUnavailable', () => {
  it('annonce l’indisponibilité, propose de réessayer et garde le repli catalogue', async () => {
    const wrapper = mount(AssistantUnavailable)
    const section = wrapper.find('section')

    expect(section.attributes('role')).toBe('alert')
    expect(section.attributes('aria-labelledby')).toBe(wrapper.find('h2').attributes('id'))
    expect(wrapper.text()).toContain('momentanément indisponible')
    expect(wrapper.find('a[href="/formations"]').text()).toBe('Voir le catalogue')
    expect(wrapper.find('a[href="/parler-a-votre-conseiller"]').text()).toBe(
      'Parler à un conseiller'
    )

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})

describe('AssistantSummary', () => {
  it('récapitule la demande et mène aux sessions de la formation retenue', () => {
    const wrapper = mount(AssistantSummary, {
      props: {
        summary: {
          text: 'Votre demande complète : formation SST pour 8 salariés à Créteil.',
          course: { title: 'SST', to: '/formations/securite/sst' },
          meta: 'Centre LEARN UP de Créteil · prochaine session : 18 septembre 2026',
          sessionsTo: '/formations/securite/sst#sessions'
        }
      }
    })

    expect(wrapper.text()).toContain('Votre demande complète')
    expect(wrapper.find('a[href="/formations/securite/sst"]').text()).toBe('SST')
    expect(wrapper.find('a[href="/formations/securite/sst#sessions"]').text()).toBe(
      'Voir les sessions'
    )
    expect(wrapper.text()).toContain('prochaine session : 18 septembre 2026')
  })
})
