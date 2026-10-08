import { Injectable, Logger } from '@nestjs/common'
import { DirectusItemsClient } from '../directus/directus.items.client'
import type { LeadFormName, SourceConfig } from '../sources/source.types'
import { SourcesService } from '../sources/sources.service'

/** Formulaires rattachés à la source de la formation / du centre visé. */
const ROUTED_FORMS: ReadonlySet<LeadFormName> = new Set(['demande', 'conseiller', 'rappel'])

export interface HubspotTarget {
  /** Null quand même la tête de réseau n'est pas configurée → 503 côté appelant. */
  portalId: string | null
  formGuid: string | null
  /** Token d'app privée de la source, s'il est renseigné. */
  token: string | null
  isHq: boolean
  sourceCode: string
}

export interface LeadTargetContext {
  formationId?: number
  centreId?: number
}

type FallbackReason = 'source-inactive' | 'portal-missing' | 'form-guid-missing' | 'source-missing'

/**
 * Choisit le portail et le formulaire HubSpot d'un lead.
 *
 * `demande`, `conseiller`, `rappel` : `formation.source ?? centre.source ?? HQ`.
 * `newsletter`, `candidature` : toujours la HQ. Repli HQ (avec un log `warn`
 * sans donnée personnelle) si la source est inactive ou introuvable, ou si
 * son portail ou le GUID du formulaire manque — un lead n'est jamais perdu
 * faute de configuration franchise.
 */
@Injectable()
export class HubspotTargetResolver {
  private readonly logger = new Logger(HubspotTargetResolver.name)

  constructor(
    private readonly sources: SourcesService,
    private readonly directus: DirectusItemsClient
  ) {}

  async resolve(type: LeadFormName, context: LeadTargetContext = {}): Promise<HubspotTarget> {
    const hq = await this.sources.getHq()
    if (!ROUTED_FORMS.has(type)) return this.toTarget(hq, type)

    const sourceId = await this.findSourceId(context)
    if (!sourceId) return this.toTarget(hq, type)

    const source = await this.sources.getById(sourceId)
    if (!source) return this.fallback(hq, type, sourceId, 'source-missing')
    if (source.isHq) return this.toTarget(source, type)

    const reason = this.unusableReason(source, type)
    if (reason) return this.fallback(hq, type, source.code, reason)
    return this.toTarget(source, type)
  }

  private unusableReason(source: SourceConfig, type: LeadFormName): FallbackReason | null {
    if (source.status !== 'active') return 'source-inactive'
    if (!source.hubspot.portalId) return 'portal-missing'
    if (!source.hubspot.forms[type]) return 'form-guid-missing'
    return null
  }

  private fallback(
    hq: SourceConfig,
    type: LeadFormName,
    sourceCode: string,
    reason: FallbackReason
  ): HubspotTarget {
    this.logger.warn(
      { leadType: type, sourceCode, reason },
      'Lead routed to the HQ portal instead of its source'
    )
    return this.toTarget(hq, type)
  }

  private toTarget(source: SourceConfig, type: LeadFormName): HubspotTarget {
    return {
      portalId: source.hubspot.portalId,
      formGuid: source.hubspot.forms[type],
      token: source.secrets.hubspotToken,
      isHq: source.isHq,
      sourceCode: source.code
    }
  }

  // formation.source ?? centre.source : un id inexistant, sans source, ou une
  // lecture Directus en échec ne bloquent pas le lead (repli sur le suivant).
  private async findSourceId({ formationId, centreId }: LeadTargetContext): Promise<string | null> {
    const fromFormation = await this.readSourceId('formations', formationId)
    if (fromFormation) return fromFormation
    return this.readSourceId('centres', centreId)
  }

  private async readSourceId(
    collection: 'formations' | 'centres',
    id: number | undefined
  ): Promise<string | null> {
    if (id === undefined) return null
    try {
      const { data } = await this.directus.readMany<{ source: string | null }>(collection, {
        filter: { id: { _eq: id } },
        fields: ['source'],
        limit: 1
      })
      return data[0]?.source ?? null
    } catch (error) {
      this.logger.warn(
        { collection, error: error instanceof Error ? error.message : 'unknown error' },
        'Source lookup failed — falling back'
      )
      return null
    }
  }
}
