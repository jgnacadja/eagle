import { inspect } from 'node:util'

export type LeadFormName = 'newsletter' | 'demande' | 'candidature' | 'conseiller' | 'rappel'

export const LEAD_FORM_NAMES: readonly LeadFormName[] = [
  'newsletter',
  'demande',
  'candidature',
  'conseiller',
  'rappel'
]

/** Un champ par formulaire : le compilateur signale l'oubli d'un formulaire ajouté. */
export function mapForms(
  pick: (form: LeadFormName) => string | null
): Record<LeadFormName, string | null> {
  return {
    newsletter: pick('newsletter'),
    demande: pick('demande'),
    candidature: pick('candidature'),
    conseiller: pick('conseiller'),
    rappel: pick('rappel')
  }
}

export type SourceStatus = 'active' | 'inactive'

/**
 * Secrets déchiffrés d'une source. Toute sérialisation (JSON, logs,
 * `util.inspect`) renvoie un marqueur : seule la lecture explicite d'une
 * propriété expose la valeur.
 */
export class SourceSecrets {
  constructor(
    readonly digiformaApiKey: string,
    readonly hubspotToken: string | null
  ) {
    for (const key of ['digiformaApiKey', 'hubspotToken'] as const) {
      Object.defineProperty(this, key, { enumerable: false })
    }
  }

  toJSON(): string {
    return '[redacted]'
  }

  [inspect.custom](): string {
    return '[redacted]'
  }
}

export interface SourceConfig {
  /** Id Directus ; `env` pour la source HQ reconstruite depuis l'environnement. */
  id: string
  code: string
  name: string
  isHq: boolean
  status: SourceStatus
  /** Vrai quand la config vient de l'env faute de source en base (CA4). */
  fromEnv: boolean
  digiforma: { apiUrl: string | null }
  hubspot: {
    portalId: string | null
    forms: Record<LeadFormName, string | null>
  }
  secrets: SourceSecrets
}

/**
 * Ligne `sources` écartée faute de secret lisible (clé de chiffrement
 * erronée, valeur altérée, secret resté en clair). Une source écartée n'est
 * jamais synchronisée : elle doit apparaître comme un échec, pas disparaître.
 */
export interface UnreadableSource {
  id: string
  code: string
  status: SourceStatus
  fromEnv: false
  /** Cause de l'écart — ne cite jamais la valeur du secret. */
  reason: string
}
