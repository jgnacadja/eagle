export interface LegalPageSection {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export interface LegalPage {
  slug: string
  label: string
  title: string
  lastUpdated: string
  metaDescription: string
  sections: LegalPageSection[]
  cta: { label: string; to: string }
}

export const legalPages: LegalPage[] = [
  {
    slug: 'mentions-legales',
    label: 'Mentions légales',
    title: 'Mentions légales',
    lastUpdated: '1er septembre 2026',
    metaDescription:
      'Mentions légales du site LEARN UP ACADEMY : éditeur, hébergement, propriété intellectuelle et responsabilité.',
    sections: [
      {
        id: 'editeur',
        title: '1. Éditeur du site',
        paragraphs: [
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.',
          'Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue.'
        ]
      },
      {
        id: 'hebergement',
        title: '2. Hébergement',
        paragraphs: [
          'Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.'
        ]
      },
      {
        id: 'propriete',
        title: '3. Propriété intellectuelle',
        paragraphs: [
          'Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam sodales hendrerit. Ut velit mauris, egestas sed, gravida nec, ornare ut, mi. Aenean ut orci vel massa suscipit pulvinar. Nulla sollicitudin.'
        ],
        bullets: [
          'Fusce varius, ligula non tempus aliquam, nunc turpis ullamcorper nibh ;',
          'in tempus sapien eu quam vestibulum ante ipsum primis ;',
          'curabitur vulputate vestibulum lorem sed pede.'
        ]
      },
      {
        id: 'responsabilite',
        title: '4. Responsabilité',
        paragraphs: [
          'Morbi in sem quis dui placerat ornare. Pellentesque odio nisi, euismod in, pharetra a, ultricies in, diam. Sed arcu. Cras consequat. Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat.'
        ]
      },
      {
        id: 'contact',
        title: '5. Contact',
        paragraphs: [
          'Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus. Phasellus ultrices nulla quis nibh. Quisque a lectus.'
        ]
      }
    ],
    cta: { label: 'Contacter LEARN UP ACADEMY', to: 'mailto:contact@learnup.fr' }
  },
  {
    slug: 'confidentialite',
    label: 'Confidentialité',
    title: 'Politique de confidentialité',
    lastUpdated: '1er septembre 2026',
    metaDescription:
      'Politique de confidentialité de LEARN UP ACADEMY : collecte, utilisation et protection des données personnelles.',
    sections: [
      {
        id: 'collecte',
        title: '1. Collecte des données',
        paragraphs: [
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.',
          'Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.'
        ]
      },
      {
        id: 'utilisation',
        title: '2. Utilisation des données',
        paragraphs: [
          'Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim.'
        ],
        bullets: [
          'Gestion des demandes de renseignements ;',
          'Envoi de communications et de newsletters ;',
          'Amélioration des services et de l’expérience utilisateur.'
        ]
      },
      {
        id: 'droits',
        title: '3. Vos droits',
        paragraphs: [
          'Morbi in sem quis dui placerat ornare. Pellentesque odio nisi, euismod in, pharetra a, ultricies in, diam. Sed arcu. Cras consequat.'
        ]
      }
    ],
    cta: { label: 'Contacter LEARN UP ACADEMY', to: 'mailto:contact@learnup.fr' }
  },
  {
    slug: 'conditions-generales',
    label: 'Conditions générales',
    title: 'Conditions générales',
    lastUpdated: '1er septembre 2026',
    metaDescription: 'Conditions générales d’utilisation du site LEARN UP ACADEMY.',
    sections: [
      {
        id: 'objet',
        title: '1. Objet',
        paragraphs: [
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.',
          'Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.'
        ]
      },
      {
        id: 'acces',
        title: '2. Accès au site',
        paragraphs: [
          'Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim.'
        ]
      },
      {
        id: 'responsabilites',
        title: '3. Responsabilités',
        paragraphs: [
          'Morbi in sem quis dui placerat ornare. Pellentesque odio nisi, euismod in, pharetra a, ultricies in, diam. Sed arcu. Cras consequat.'
        ]
      }
    ],
    cta: { label: 'Contacter LEARN UP ACADEMY', to: 'mailto:contact@learnup.fr' }
  },
  {
    slug: 'accessibilite',
    label: 'Accessibilité',
    title: 'Accessibilité — RGAA',
    lastUpdated: '1er septembre 2026',
    metaDescription:
      'Déclaration d’accessibilité de LEARN UP ACADEMY, engagements RGAA et contact alternatif.',
    sections: [
      {
        id: 'engagement',
        title: '1. Engagement',
        paragraphs: [
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.',
          'Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.'
        ]
      },
      {
        id: 'etat',
        title: '2. État de conformité',
        paragraphs: [
          'Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim.'
        ]
      },
      {
        id: 'contact',
        title: '3. Contact et amélioration',
        paragraphs: [
          'Morbi in sem quis dui placerat ornare. Pellentesque odio nisi, euismod in, pharetra a, ultricies in, diam. Sed arcu. Cras consequat.'
        ]
      }
    ],
    cta: { label: 'Contacter LEARN UP ACADEMY', to: 'mailto:contact@learnup.fr' }
  },
  {
    slug: 'cookies',
    label: 'Gestion des cookies',
    title: 'Gestion des cookies',
    lastUpdated: '1er septembre 2026',
    metaDescription: 'Politique de gestion des cookies du site LEARN UP ACADEMY.',
    sections: [
      {
        id: 'cookies',
        title: '1. Cookies utilisés',
        paragraphs: [
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.',
          'Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.'
        ]
      },
      {
        id: 'gestion',
        title: '2. Gestion des préférences',
        paragraphs: [
          'Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim.'
        ]
      }
    ],
    cta: { label: 'Contacter LEARN UP ACADEMY', to: 'mailto:contact@learnup.fr' }
  }
]

export const tabbedLegalPages = legalPages.filter((p) => p.slug !== 'cookies')
