import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type {
  CandidatureLeadPayload,
  DemandeLeadPayload,
  NewsletterLeadPayload
} from '@learnup/types'
import type { CandidatureLeadDto, DemandeLeadDto, NewsletterLeadDto } from './leads.dto'

export type LeadFormName = 'newsletter' | 'demande' | 'candidature'

interface HubSpotField {
  objectTypeId: '0-1'
  name: string
  value: string
}

// Champ présent seulement s'il a une valeur : une chaîne vide écraserait
// une propriété HubSpot déjà renseignée par une soumission précédente.
function field(name: string, value: string | number | null | undefined): HubSpotField | null {
  const v = value == null ? '' : String(value).trim()
  return v ? { objectTypeId: '0-1', name, value: v } : null
}

function fields(entries: (HubSpotField | null)[]): HubSpotField[] {
  return entries.filter((entry): entry is HubSpotField => entry !== null)
}

// « Nom et prénom » unique côté site → firstname/lastname HubSpot :
// 1er mot = prénom, le reste = nom. Un seul mot → prénom seul.
function splitName(nom: string): { firstname: string; lastname: string } {
  const [firstname, ...rest] = nom.trim().split(/\s+/)
  return { firstname: firstname ?? '', lastname: rest.join(' ') }
}

// Les CTA réseau historiques envoient ?sujet=franchise — la propriété
// HubSpot `learnup_type_projet` attend `centre`. Toute valeur inconnue
// est ignorée : une enum invalide ferait jeter toute la soumission.
const SUJETS_VALIDES = new Set(['centre', 'organisme', 'formateur', 'conseiller'])

function mapSujet(sujet: string | undefined): string | undefined {
  if (!sujet) return undefined
  const mapped = sujet === 'franchise' ? 'centre' : sujet
  return SUJETS_VALIDES.has(mapped) ? mapped : undefined
}

// Texte de consentement joint aux forms qui portent une case explicite
// (demande, candidature). La newsletter n'en a pas : y joindre
// legalConsentOptions ferait jeter la soumission par HubSpot (200 mais rien
// d'enregistré).
const CONSENT_TEXT =
  "J'accepte que ces informations soient utilisées pour le traitement de ma demande."

const SUBMIT_TIMEOUT_MS = 15_000

/**
 * Pivot des formulaires « lead » du site vers la Forms API v3 de HubSpot.
 * L'endpoint de soumission n'est pas authentifié (portalId + formGuid
 * suffisent) : le service ne détient aucun secret — la clé de service ne
 * sert qu'au provisioning, jamais ici.
 */
@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name)
  private readonly portalId: string | undefined
  private readonly formsBaseUrl: string
  private readonly formGuids: Record<LeadFormName, string | undefined>

  constructor(config: ConfigService) {
    this.portalId = config.get<string>('HUBSPOT_PORTAL_ID')
    this.formsBaseUrl = config.get<string>('HUBSPOT_FORMS_BASE_URL') ?? 'https://api.hsforms.com'
    this.formGuids = {
      newsletter: config.get<string>('HUBSPOT_FORM_NEWSLETTER'),
      demande: config.get<string>('HUBSPOT_FORM_DEMANDE'),
      candidature: config.get<string>('HUBSPOT_FORM_CANDIDATURE')
    }
  }

  submitNewsletter(dto: NewsletterLeadDto): Promise<{ submitted: true }> {
    const fields = this.buildFields('newsletter', dto)
    return this.post('newsletter', fields, dto)
  }

  submitDemande(dto: DemandeLeadDto): Promise<{ submitted: true }> {
    const fields = this.buildFields('demande', dto)
    return this.post('demande', fields, dto, true)
  }

  submitCandidature(dto: CandidatureLeadDto): Promise<{ submitted: true }> {
    const fields = this.buildFields('candidature', dto)
    return this.post('candidature', fields, dto, true)
  }

  private buildFields(form: 'newsletter', payload: NewsletterLeadPayload): HubSpotField[]
  private buildFields(form: 'demande', payload: DemandeLeadPayload): HubSpotField[]
  private buildFields(form: 'candidature', payload: CandidatureLeadPayload): HubSpotField[]
  private buildFields(
    form: LeadFormName,
    payload: NewsletterLeadPayload | DemandeLeadPayload | CandidatureLeadPayload
  ): HubSpotField[] {
    switch (form) {
      case 'newsletter': {
        const p = payload as NewsletterLeadPayload
        return fields([field('email', p.email)])
      }
      case 'demande': {
        const p = payload as DemandeLeadPayload
        const { firstname, lastname } = splitName(p.nom)
        return fields([
          field('firstname', firstname),
          field('lastname', lastname),
          field('email', p.email),
          field('phone', p.telephone),
          field('company', p.raisonSociale),
          field('jobtitle', p.fonction),
          field('learnup_siret', p.siret),
          field('learnup_salaries', p.salaries),
          field('learnup_echeance', p.echeance),
          field('learnup_precisions', p.precisions),
          field('learnup_centre', p.centre),
          field('learnup_formation', p.formation),
          field('learnup_session', p.session),
          field('learnup_type_projet', mapSujet(p.sujet))
        ])
      }
      case 'candidature': {
        const p = payload as CandidatureLeadPayload
        const { firstname, lastname } = splitName(p.nom)
        return fields([
          field('firstname', firstname),
          field('lastname', lastname),
          field('email', p.email),
          field('phone', p.telephone),
          field('learnup_territoire', p.ville),
          field('learnup_parcours', p.parcours),
          field('learnup_type_projet', p.voie)
        ])
      }
    }
  }

  private async post(
    form: LeadFormName,
    hubspotFields: HubSpotField[],
    context: { pageUri?: string; pageName?: string },
    withConsent = false
  ): Promise<{ submitted: true }> {
    const formGuid = this.formGuids[form]
    if (!this.portalId || !formGuid) {
      this.logger.error(`Missing HubSpot configuration (form: ${form})`)
      throw new ServiceUnavailableException('The submission service is unavailable.')
    }

    const body: Record<string, unknown> = { fields: hubspotFields }
    // Contexte seulement si la page le fournit : un pageUri dont le domaine
    // n'est pas tracké par le portail fait jeter la soumission par HubSpot.
    if (context.pageUri || context.pageName) {
      body.context = { pageUri: context.pageUri, pageName: context.pageName }
    }
    if (withConsent) {
      body.legalConsentOptions = {
        consent: { consentToProcess: true, text: CONSENT_TEXT }
      }
    }

    try {
      const response = await fetch(
        `${this.formsBaseUrl}/submissions/v3/integration/submit/${this.portalId}/${formGuid}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS)
        }
      )

      if (!response.ok) {
        this.logger.error(`HubSpot Forms HTTP ${response.status} (form: ${form})`)
        throw new ServiceUnavailableException('The submission service is unavailable.')
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error
      this.logger.error(
        `HubSpot Forms submit failed (form: ${form})`,
        error instanceof Error ? error.stack : String(error)
      )
      throw new ServiceUnavailableException('The submission service is unavailable.')
    }

    return { submitted: true }
  }
}
