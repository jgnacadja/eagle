import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type {
  CandidatureLeadPayload,
  ConseillerLeadPayload,
  DemandeLeadPayload,
  NewsletterLeadPayload,
  RappelLeadPayload
} from '@learnup/types'
import type {
  CandidatureLeadDto,
  ConseillerLeadDto,
  DemandeLeadDto,
  NewsletterLeadDto,
  RappelLeadDto
} from './leads.dto'
import type { LeadFormName } from '../sources/source.types'
import { HubspotTargetResolver, type LeadTargetContext } from './hubspot-target.resolver'

export type { LeadFormName }

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
  const [firstname = '', ...rest] = nom.trim().split(/\s+/)
  return { firstname, lastname: rest.join(' ') }
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
// (demande, candidature, conseiller). La newsletter n'en a pas : y joindre
// legalConsentOptions ferait jeter la soumission par HubSpot (200 mais rien
// d'enregistré).
const CONSENT_TEXT =
  "J'accepte que ces informations soient utilisées pour le traitement de ma demande."

// Libellé de la case de consentement du « rappel rapide » — repli pour les
// clients qui ne transmettent pas `consentementTexte`. Doit rester identique
// au texte affiché par QuickCallbackCard.
const RAPPEL_CONSENT_TEXT =
  "J'accepte d'être rappelé par un conseiller au sujet de mon projet de formation."

const SUBMIT_TIMEOUT_MS = 15_000

/**
 * Pivot des formulaires « lead » du site vers la Forms API v3 de HubSpot.
 * Le portail et le GUID du formulaire viennent de `HubspotTargetResolver`
 * (source de la formation / du centre, repli HQ puis env). L'endpoint de
 * soumission n'est pas authentifié (portalId + formGuid suffisent) ; seul un
 * token d'app privée renseigné sur une source bascule sur l'endpoint
 * `secure`. La clé de service d'administration n'est jamais utilisée ici.
 */
@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name)
  private readonly formsBaseUrl: string

  constructor(
    config: ConfigService,
    private readonly targets: HubspotTargetResolver
  ) {
    this.formsBaseUrl = config.get<string>('HUBSPOT_FORMS_BASE_URL') ?? 'https://api.hsforms.com'
  }

  submitNewsletter(dto: NewsletterLeadDto): Promise<{ submitted: true }> {
    const fields = this.buildFields('newsletter', dto)
    return this.post('newsletter', fields, dto)
  }

  submitDemande(dto: DemandeLeadDto): Promise<{ submitted: true }> {
    const fields = this.buildFields('demande', dto)
    return this.post('demande', fields, dto, CONSENT_TEXT, dto)
  }

  submitCandidature(dto: CandidatureLeadDto): Promise<{ submitted: true }> {
    const fields = this.buildFields('candidature', dto)
    return this.post('candidature', fields, dto, CONSENT_TEXT)
  }

  submitConseiller(dto: ConseillerLeadDto): Promise<{ submitted: true }> {
    const fields = this.buildFields('conseiller', dto)
    return this.post('conseiller', fields, dto, CONSENT_TEXT, dto)
  }

  submitRappel(dto: RappelLeadDto): Promise<{ submitted: true }> {
    const fields = this.buildFields('rappel', dto)
    // Le libellé affiché par la case front prime : HubSpot enregistre
    // exactement ce que l'utilisateur a lu et coché.
    return this.post('rappel', fields, dto, dto.consentementTexte || RAPPEL_CONSENT_TEXT, dto)
  }

  private buildFields(form: 'newsletter', payload: NewsletterLeadPayload): HubSpotField[]
  private buildFields(form: 'demande', payload: DemandeLeadPayload): HubSpotField[]
  private buildFields(form: 'candidature', payload: CandidatureLeadPayload): HubSpotField[]
  private buildFields(form: 'conseiller', payload: ConseillerLeadPayload): HubSpotField[]
  private buildFields(form: 'rappel', payload: RappelLeadPayload): HubSpotField[]
  private buildFields(
    form: LeadFormName,
    payload:
      | NewsletterLeadPayload
      | DemandeLeadPayload
      | CandidatureLeadPayload
      | ConseillerLeadPayload
      | RappelLeadPayload
  ): HubSpotField[] {
    switch (form) {
      case 'newsletter': {
        const p = payload as NewsletterLeadPayload
        return fields([field('email', p.email)])
      }
      case 'demande': {
        const p = payload as DemandeLeadPayload
        const { firstname, lastname } = splitName(p.nom)
        // Pas de propriété HubSpot dédiée au lieu intra ni au téléphone pro :
        // ils sont préfixés aux précisions pour rester lisibles dans le CRM
        // sans migrer le formulaire.
        const precisions = [
          p.lieu ? `Lieu de la formation : ${p.lieu}` : '',
          p.telephonePro ? `Téléphone professionnel : ${p.telephonePro}` : '',
          p.precisions
        ]
          .filter(Boolean)
          .join('\n')
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
          field('learnup_precisions', precisions),
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
      case 'conseiller': {
        const p = payload as ConseillerLeadPayload
        const { firstname, lastname } = splitName(p.nom)
        return fields([
          field('firstname', firstname),
          field('lastname', lastname),
          field('email', p.email),
          field('phone', p.telephone),
          field('learnup_siret', p.siret),
          field('learnup_precisions', p.message),
          // besoin est déjà une valeur de l'enum HubSpot (DTO @IsIn).
          field('learnup_type_projet', p.besoin)
        ])
      }
      case 'rappel': {
        const p = payload as RappelLeadPayload
        const precisions = p.creneau ? `Créneau souhaité : ${p.creneau}` : 'Dès que possible'
        return fields([
          field('phone', p.telephone),
          field('learnup_precisions', precisions),
          field('learnup_type_projet', 'conseiller')
        ])
      }
    }
  }

  private async post(
    form: LeadFormName,
    hubspotFields: HubSpotField[],
    context: { pageUri?: string; pageName?: string; hutk?: string },
    consentText?: string,
    routing: LeadTargetContext = {}
  ): Promise<{ submitted: true }> {
    const target = await this.targets.resolve(form, {
      formationId: routing.formationId,
      centreId: routing.centreId
    })
    const { portalId, formGuid } = target
    if (!portalId || !formGuid) {
      this.logger.error(`Missing HubSpot configuration (form: ${form})`)
      throw new ServiceUnavailableException('The submission service is unavailable.')
    }

    const body: Record<string, unknown> = { fields: hubspotFields }
    // Contexte seulement si la page le fournit : un pageUri dont le domaine
    // n'est pas tracké par le portail fait jeter la soumission par HubSpot.
    // `hutk` (cookie de tracking) n'appartient qu'au portail HQ, dont le
    // script est celui du site : sur un portail franchise il serait rejeté
    // ou rattaché au mauvais contact.
    const hutk = target.isHq ? context.hutk : undefined
    if (context.pageUri || context.pageName || hutk) {
      body.context = { pageUri: context.pageUri, pageName: context.pageName, hutk }
    }
    if (consentText) {
      body.legalConsentOptions = {
        consent: { consentToProcess: true, text: consentText }
      }
    }

    try {
      const endpoint = target.token ? 'secure/submit' : 'submit'
      const response = await fetch(
        `${this.formsBaseUrl}/submissions/v3/integration/${endpoint}/${portalId}/${formGuid}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(target.token ? { Authorization: `Bearer ${target.token}` } : {})
          },
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
