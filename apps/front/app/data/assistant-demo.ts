import type {
  AssistantComparison,
  AssistantConversation,
  AssistantRecommendation,
  AssistantStateId
} from '~/types/assistant'

/**
 * Fixtures des 11 états du moteur IA (wording exact de la maquette S0).
 * Servies uniquement en mode démo (`?state=` sur la page moteur, flag
 * `assistantDemoStates`) pour la revue design et la recette ; DEV-CORE
 * branchera les données réelles.
 */
export const ASSISTANT_EXAMPLES = [
  'Former des salariés au SST',
  'Mettre à jour une habilitation obligatoire',
  'Aider des managers à gérer leur équipe'
]

export const ASSISTANT_ADVISOR_ROUTE = '/parler-a-votre-conseiller'
export const ASSISTANT_CATALOGUE_ROUTE = '/formations'
export const ASSISTANT_REQUEST_ROUTE = '/centres/demande-de-formation'

export type AssistantDemoView =
  | { kind: 'hero' }
  | { kind: 'conversation'; conversation: AssistantConversation }
  | { kind: 'unavailable' }
  | { kind: 'comparison'; comparison: AssistantComparison }

const CONFLITS: AssistantRecommendation = {
  course: {
    title: 'Gestion des conflits en équipe',
    to: '/formations/management/gestion-des-conflits-en-equipe'
  },
  justification:
    "Cette formation semble particulièrement adaptée à votre besoin parce qu'elle s'adresse aux managers et porte sur la prévention et la résolution des conflits au sein d'une équipe.",
  attributes: ['2 jours', 'Présentiel ou distanciel', 'Inter / intra'],
  sessionsTo: '/formations/management/gestion-des-conflits-en-equipe#sessions'
}

const COMMUNICATION: AssistantRecommendation = {
  course: {
    title: 'Communication managériale',
    to: '/formations/management/communication-manageriale'
  },
  justification:
    'Semble pertinente si le besoin porte davantage sur la posture et les échanges au quotidien.',
  attributes: []
}

const FONDAMENTAUX: AssistantRecommendation = {
  course: {
    title: "Management d'équipe — fondamentaux",
    to: '/formations/management/management-d-equipe-fondamentaux'
  },
  justification:
    'Semble utile si les difficultés dépassent les conflits : organisation, animation, cadrage.',
  attributes: []
}

const SST_TO = '/formations/securite-prevention/sst-sauveteur-secouriste-du-travail'

const SST: AssistantRecommendation = {
  course: { title: 'SST — Sauveteur Secouriste du Travail', to: SST_TO },
  justification:
    "Cette formation semble adaptée à votre besoin parce qu'elle forme les salariés à la prévention et aux premiers secours en entreprise, avec une certification à l'issue.",
  attributes: ['2 jours', 'Certifiante', 'Inter / intra'],
  availability: {
    centre: 'Centre LEARN UP de Créteil',
    distance: 'à 2,1 km du centre-ville',
    nextSession: 'jeudi 18 septembre 2026',
    seats: 'available',
    sessionsTo: `${SST_TO}#sessions`,
    requestTo: `${ASSISTANT_REQUEST_ROUTE}?formation=sst-sauveteur-secouriste-du-travail&centre=creteil`
  }
}

const GESTES_POSTURES: AssistantRecommendation = {
  course: { title: 'Gestes et postures', to: '/formations/securite-prevention/gestes-et-postures' },
  justification: 'Semble pertinente si le besoin porte sur la prévention des troubles physiques.',
  attributes: []
}

const MAC_SST: AssistantRecommendation = {
  course: { title: 'MAC SST — recyclage', to: '/formations/securite-prevention/mac-sst-recyclage' },
  justification: 'Semble utile si vos salariés sont déjà titulaires du certificat SST.',
  attributes: []
}

const CONVERSATIONS: Record<
  Exclude<AssistantStateId, 'initial' | 'unavailable' | 'comparison'>,
  AssistantConversation
> = {
  analyzing: {
    turns: [
      {
        role: 'user',
        text: 'Je cherche une formation pour nos managers qui ont du mal à gérer leurs équipes.'
      },
      { role: 'assistant', kind: 'analyzing' }
    ]
  },
  clarification: {
    turns: [
      { role: 'user', text: 'Je veux former mes équipes à la sécurité.' },
      {
        role: 'assistant',
        kind: 'clarification',
        clarification: {
          intro: 'Votre besoin nécessite une précision pour vous orienter correctement.',
          question: 'Quel type de risque ou de compétence souhaitez-vous traiter ?',
          options: [
            'Premiers secours',
            'Risque incendie',
            'Habilitation électrique',
            'Gestes et postures'
          ]
        }
      }
    ],
    composer: true
  },
  recommendation: {
    turns: [
      { role: 'user', text: "Mes managers ont besoin d'apprendre à mieux gérer les conflits." },
      {
        role: 'assistant',
        kind: 'recommendations',
        recommendations: { principal: CONFLITS, alternatives: [COMMUNICATION, FONDAMENTAUX] }
      }
    ]
  },
  availability: {
    context: ['SST', '8 salariés', 'Créteil'],
    turns: [
      { role: 'user', text: 'Formation SST pour 8 personnes à Créteil.' },
      {
        role: 'assistant',
        kind: 'recommendations',
        recommendations: { principal: SST, alternatives: [GESTES_POSTURES, MAC_SST] }
      }
    ]
  },
  'no-session': {
    turns: [
      { role: 'user', text: 'Habilitation électrique B0-H0 pour deux techniciens.' },
      {
        role: 'assistant',
        kind: 'no-session',
        noSession: {
          course: {
            title: 'Habilitation électrique B0-H0',
            to: '/formations/habilitations-electriques/habilitation-electrique-b0-h0'
          },
          requestTo: `${ASSISTANT_REQUEST_ROUTE}?formation=habilitation-electrique-b0-h0`
        }
      }
    ]
  },
  'no-result': {
    turns: [
      { role: 'user', text: 'Une formation à la gestion de crise pour notre comité de direction.' },
      { role: 'assistant', kind: 'no-result' }
    ]
  },
  'out-of-catalog': {
    turns: [
      {
        role: 'user',
        text: 'Nous cherchons une formation au pilotage de drone pour notre équipe technique.'
      },
      {
        role: 'assistant',
        kind: 'out-of-catalog',
        outOfCatalog: {
          message:
            'Ce besoin ne correspond pas aux formations actuellement proposées dans le catalogue LEARN UP. Nous ne vous proposons pas de formation approchante pour ne pas vous orienter à tort.'
        }
      }
    ]
  },
  history: {
    context: ['SST', '8 salariés', 'Créteil'],
    turns: [
      { role: 'user', text: 'Je cherche une formation SST.' },
      {
        role: 'assistant',
        kind: 'text',
        text: 'Pour combien de personnes, et dans quelle ville ?'
      },
      { role: 'user', text: 'Pour 8 salariés à Créteil.' },
      {
        role: 'assistant',
        kind: 'summary',
        summary: {
          text: 'Votre demande complète : formation SST pour 8 salariés à Créteil.',
          course: SST.course,
          meta: 'Centre LEARN UP de Créteil · prochaine session : 18 septembre 2026',
          sessionsTo: `${SST_TO}#sessions`
        }
      }
    ]
  }
}

const COMPARISON: AssistantComparison = {
  need: 'gestion des conflits pour des managers',
  rows: [
    {
      course: CONFLITS.course,
      principal: true,
      why: 'Répond directement au besoin exprimé : prévenir et résoudre les conflits.',
      duration: '2 jours',
      modality: 'Présentiel / distanciel'
    },
    {
      course: COMMUNICATION.course,
      why: "Plus adaptée si l'enjeu porte sur la posture et les échanges quotidiens.",
      duration: '2 jours',
      modality: 'Présentiel'
    },
    {
      course: FONDAMENTAUX.course,
      why: "Format plus large : organisation, animation et cadrage de l'équipe.",
      duration: '3 jours',
      modality: 'Présentiel / distanciel'
    }
  ]
}

export const ASSISTANT_DEMO_STATES: Record<AssistantStateId, AssistantDemoView> = {
  initial: { kind: 'hero' },
  analyzing: { kind: 'conversation', conversation: CONVERSATIONS.analyzing },
  clarification: { kind: 'conversation', conversation: CONVERSATIONS.clarification },
  recommendation: { kind: 'conversation', conversation: CONVERSATIONS.recommendation },
  availability: { kind: 'conversation', conversation: CONVERSATIONS.availability },
  'no-session': { kind: 'conversation', conversation: CONVERSATIONS['no-session'] },
  'no-result': { kind: 'conversation', conversation: CONVERSATIONS['no-result'] },
  'out-of-catalog': { kind: 'conversation', conversation: CONVERSATIONS['out-of-catalog'] },
  unavailable: { kind: 'unavailable' },
  comparison: { kind: 'comparison', comparison: COMPARISON },
  history: { kind: 'conversation', conversation: CONVERSATIONS.history }
}

export function isAssistantStateId(value: unknown): value is AssistantStateId {
  return typeof value === 'string' && Object.hasOwn(ASSISTANT_DEMO_STATES, value)
}
