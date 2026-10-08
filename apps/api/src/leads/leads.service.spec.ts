import type { ConfigService } from '@nestjs/config'
import { Logger, ServiceUnavailableException } from '@nestjs/common'
import { LeadsService } from './leads.service'
import type { HubspotTarget, HubspotTargetResolver } from './hubspot-target.resolver'
import type {
  CandidatureLeadDto,
  ConseillerLeadDto,
  DemandeLeadDto,
  NewsletterLeadDto
} from './leads.dto'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

function mockConfig(values: Record<string, string | undefined> = {}): ConfigService {
  const env: Record<string, string | undefined> = {
    HUBSPOT_PORTAL_ID: '149356688',
    HUBSPOT_FORMS_BASE_URL: 'https://api-eu1.hsforms.com',
    HUBSPOT_FORM_NEWSLETTER: 'guid-newsletter',
    HUBSPOT_FORM_DEMANDE: 'guid-demande',
    HUBSPOT_FORM_CANDIDATURE: 'guid-candidature',
    HUBSPOT_FORM_CONSEILLER: 'guid-conseiller',
    HUBSPOT_FORM_RAPPEL: 'guid-rappel',
    ...values
  }
  return { get: (key: string) => env[key] } as unknown as ConfigService
}

// Résolveur reproduisant le repli env : portail et GUID lus dans la même
// config que les tests, tête de réseau, sans token.
function envResolver(values: Record<string, string | undefined>): HubspotTargetResolver {
  const env = mockConfig(values)
  return {
    resolve: vi.fn(async (form: string): Promise<HubspotTarget> => ({
      portalId: env.get<string>('HUBSPOT_PORTAL_ID') ?? null,
      formGuid: env.get<string>(`HUBSPOT_FORM_${form.toUpperCase()}`) ?? null,
      token: null,
      isHq: true,
      sourceCode: 'hq'
    }))
  } as unknown as HubspotTargetResolver
}

function makeService(values: Record<string, string | undefined> = {}): LeadsService {
  return new LeadsService(mockConfig(values), envResolver(values))
}

interface SubmittedBody {
  fields: { name: string; value: string }[]
  context?: { pageUri?: string; pageName?: string; hutk?: string }
  legalConsentOptions?: { consent: { consentToProcess: boolean; text: string } }
}

function lastCall(): { url: string; body: SubmittedBody } {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, { body: string }]
  return { url, body: JSON.parse(init.body) as SubmittedBody }
}

function fieldNames(body: SubmittedBody): Record<string, string> {
  return Object.fromEntries(body.fields.map((f) => [f.name, f.value]))
}

const demande: DemandeLeadDto = {
  nom: 'Jean Dupont Martin',
  email: 'jean@acme.fr',
  telephone: '0612345678',
  raisonSociale: 'ACME',
  siret: '12345678901234',
  fonction: 'DRH',
  salaries: 12,
  echeance: 'Octobre 2026',
  precisions: 'En intra.',
  consentement: true,
  centre: 'LEARN UP Créteil',
  formation: 'CACES R489',
  session: '12-14 octobre',
  sujet: 'franchise',
  pageUri: 'https://learnup.fr/centres/demande-de-formation',
  pageName: 'Demande de formation'
}

const candidature: CandidatureLeadDto = {
  voie: 'organisme',
  nom: 'Jean Dupont Martin',
  email: 'jean@acme.fr',
  telephone: '0612345678',
  ville: 'Créteil',
  parcours: 'Déjà formateur.',
  consentement: true
}

const conseiller: ConseillerLeadDto = {
  besoin: 'conseiller',
  nom: 'Jean Dupont Martin',
  email: 'jean@acme.fr',
  telephone: '0612345678',
  siret: '12345678901234',
  message: 'Former 8 salariés près de Lyon.',
  consentement: true,
  pageUri: 'https://learnup.fr/parler-a-votre-conseiller',
  pageName: 'Parler à votre conseiller'
}

describe('LeadsService', () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200 })
  })

  it('newsletter : poste email seul, sans contexte ni consentement', async () => {
    const service = makeService()
    const dto: NewsletterLeadDto = { email: 'abonne@site.fr' }

    await expect(service.submitNewsletter(dto)).resolves.toEqual({ submitted: true })

    const { url, body } = lastCall()
    expect(url).toBe(
      'https://api-eu1.hsforms.com/submissions/v3/integration/submit/149356688/guid-newsletter'
    )
    expect(fieldNames(body)).toEqual({ email: 'abonne@site.fr' })
    expect(body.context).toBeUndefined()
    expect(body.legalConsentOptions).toBeUndefined()
  })

  it('demande : mappe les champs HubSpot, joint contexte et consentement', async () => {
    const service = makeService()

    await service.submitDemande(demande)

    const { url, body } = lastCall()
    expect(url).toContain('guid-demande')
    expect(fieldNames(body)).toEqual({
      firstname: 'Jean',
      lastname: 'Dupont Martin',
      email: 'jean@acme.fr',
      phone: '0612345678',
      company: 'ACME',
      jobtitle: 'DRH',
      learnup_siret: '12345678901234',
      learnup_salaries: '12',
      learnup_echeance: 'Octobre 2026',
      learnup_precisions: 'En intra.',
      learnup_centre: 'LEARN UP Créteil',
      learnup_formation: 'CACES R489',
      learnup_session: '12-14 octobre',
      learnup_type_projet: 'centre'
    })
    expect(body.context).toEqual({
      pageUri: 'https://learnup.fr/centres/demande-de-formation',
      pageName: 'Demande de formation'
    })
    expect(body.legalConsentOptions?.consent.consentToProcess).toBe(true)
  })

  it('demande : verse le lieu intra dans learnup_precisions', async () => {
    const service = makeService()

    await service.submitDemande({ ...demande, lieu: 'Lyon 69003' })

    expect(fieldNames(lastCall().body).learnup_precisions).toBe(
      'Lieu de la formation : Lyon 69003\nEn intra.'
    )
  })

  it('demande : verse le téléphone pro dans learnup_precisions', async () => {
    const service = makeService()

    await service.submitDemande({ ...demande, telephonePro: '0142556677' })

    expect(fieldNames(lastCall().body).learnup_precisions).toBe(
      'Téléphone professionnel : 0142556677\nEn intra.'
    )
  })

  it('demande : ignore les champs vides pour ne pas écraser le CRM', async () => {
    const service = makeService()

    await service.submitDemande({
      ...demande,
      nom: 'Jean',
      precisions: undefined,
      centre: '',
      formation: undefined,
      session: undefined,
      sujet: undefined,
      pageUri: undefined,
      pageName: undefined
    })

    const { body } = lastCall()
    const names = fieldNames(body)
    expect(names.firstname).toBe('Jean')
    expect(names.lastname).toBeUndefined()
    expect(names.learnup_precisions).toBeUndefined()
    expect(names.learnup_centre).toBeUndefined()
    expect(names.learnup_type_projet).toBeUndefined()
    expect(body.context).toBeUndefined()
  })

  it('demande : ignore un sujet inconnu (enum HubSpot invalide)', async () => {
    const service = makeService()

    await service.submitDemande({ ...demande, sujet: 'foobar' })

    const { body } = lastCall()
    expect(fieldNames(body).learnup_type_projet).toBeUndefined()
  })

  it('candidature : mappe la voie sur learnup_type_projet', async () => {
    const service = makeService()

    await service.submitCandidature(candidature)

    const { url, body } = lastCall()
    expect(url).toContain('guid-candidature')
    expect(fieldNames(body).learnup_type_projet).toBe('organisme')
    expect(fieldNames(body).learnup_territoire).toBe('Créteil')
    expect(body.legalConsentOptions?.consent.consentToProcess).toBe(true)
  })

  it('conseiller : mappe le besoin sur learnup_type_projet, joint le consentement', async () => {
    const service = makeService()

    await service.submitConseiller(conseiller)

    const { url, body } = lastCall()
    expect(url).toContain('guid-conseiller')
    expect(fieldNames(body)).toEqual({
      firstname: 'Jean',
      lastname: 'Dupont Martin',
      email: 'jean@acme.fr',
      phone: '0612345678',
      learnup_siret: '12345678901234',
      learnup_precisions: 'Former 8 salariés près de Lyon.',
      learnup_type_projet: 'conseiller'
    })
    expect(body.context).toEqual({
      pageUri: 'https://learnup.fr/parler-a-votre-conseiller',
      pageName: 'Parler à votre conseiller'
    })
    expect(body.legalConsentOptions?.consent.consentToProcess).toBe(true)
  })

  it('conseiller : ignore SIRET et message absents', async () => {
    const service = makeService()

    await service.submitConseiller({ ...conseiller, siret: undefined, message: undefined })

    const names = fieldNames(lastCall().body)
    expect(names.learnup_siret).toBeUndefined()
    expect(names.learnup_precisions).toBeUndefined()
    expect(names.learnup_type_projet).toBe('conseiller')
  })

  it('lève 503 si la configuration HubSpot est absente', async () => {
    const service = makeService({ HUBSPOT_FORM_NEWSLETTER: undefined })

    await expect(service.submitNewsletter({ email: 'abonne@site.fr' })).rejects.toBeInstanceOf(
      ServiceUnavailableException
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('lève 503 si HubSpot rejette la soumission', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400 })
    const service = makeService()

    await expect(service.submitNewsletter({ email: 'abonne@site.fr' })).rejects.toBeInstanceOf(
      ServiceUnavailableException
    )
  })

  it('lève 503 si le fetch échoue (réseau/timeout)', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'))
    const service = makeService()

    await expect(service.submitNewsletter({ email: 'abonne@site.fr' })).rejects.toBeInstanceOf(
      ServiceUnavailableException
    )
  })
  it('utilise le domaine HubSpot par défaut quand non configuré', async () => {
    const service = makeService({ HUBSPOT_FORMS_BASE_URL: undefined })

    await service.submitNewsletter({ email: 'abonne@site.fr' })

    const { url } = lastCall()
    expect(url).toMatch(/^https:\/\/api\.hsforms\.com\//)
  })

  it('lève 503 quand le fetch rejette une valeur non-Error', async () => {
    fetchMock.mockRejectedValue('plain failure')
    const service = makeService()

    await expect(service.submitNewsletter({ email: 'abonne@site.fr' })).rejects.toBeInstanceOf(
      ServiceUnavailableException
    )
  })

  it('rappel : poste téléphone et créneau au formulaire dédié avec le libellé affiché', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 })
    const service = makeService()

    const res = await service.submitRappel({
      telephone: '06 12 34 56 78',
      creneau: 'Cet après-midi',
      consentement: true,
      consentementTexte: "J'accepte d'être rappelé par un conseiller au sujet de mon projet."
    })

    expect(res).toEqual({ submitted: true })
    const { url, body } = lastCall()
    // Formulaire dédié — jamais celui du conseiller (qui exige un e-mail).
    expect(url).toContain('guid-rappel')
    const fields = fieldNames(body)
    expect(fields.phone).toBe('06 12 34 56 78')
    expect(fields.learnup_precisions).toBe('Créneau souhaité : Cet après-midi')
    expect(fields.email).toBeUndefined()
    expect(body.legalConsentOptions?.consent).toEqual({
      consentToProcess: true,
      text: "J'accepte d'être rappelé par un conseiller au sujet de mon projet."
    })
  })

  it('rappel : replie le libellé de consentement sur le texte affiché par défaut', async () => {
    const service = makeService()

    await service.submitRappel({
      telephone: '06 12 34 56 78',
      consentement: true
    })

    const { body } = lastCall()
    expect(body.legalConsentOptions?.consent.text).toBe(
      "J'accepte d'être rappelé par un conseiller au sujet de mon projet de formation."
    )
  })

  it('rappel : lève 503 sans formulaire dédié — pas de repli sur le form conseiller', async () => {
    const service = makeService({ HUBSPOT_FORM_RAPPEL: undefined })

    await expect(
      service.submitRappel({ telephone: '06 12 34 56 78', consentement: true })
    ).rejects.toBeInstanceOf(ServiceUnavailableException)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('LeadsService — routage par portail', () => {
  const franchise: HubspotTarget = {
    portalId: 'portal-lyon',
    formGuid: 'guid-lyon-demande',
    token: null,
    isHq: false,
    sourceCode: 'lyon'
  }

  function serviceWith(target: HubspotTarget) {
    const resolver = { resolve: vi.fn().mockResolvedValue(target) }
    const service = new LeadsService(mockConfig(), resolver as unknown as HubspotTargetResolver)
    return { service, resolver }
  }

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200 })
  })

  it('demande : poste sur le portail et le formulaire de la source franchise (CA3)', async () => {
    const { service, resolver } = serviceWith(franchise)

    await service.submitDemande({ ...demande, formationId: 12, centreId: 3 })

    expect(resolver.resolve).toHaveBeenCalledWith('demande', { formationId: 12, centreId: 3 })
    expect(lastCall().url).toBe(
      'https://api-eu1.hsforms.com/submissions/v3/integration/submit/portal-lyon/guid-lyon-demande'
    )
  })

  it('conseiller et rappel transmettent leur rattachement au résolveur', async () => {
    const { service, resolver } = serviceWith(franchise)

    await service.submitConseiller({ ...conseiller, centreId: 9 })
    await service.submitRappel({ telephone: '0612345678', consentement: true, formationId: 4 })

    expect(resolver.resolve).toHaveBeenNthCalledWith(1, 'conseiller', {
      formationId: undefined,
      centreId: 9
    })
    expect(resolver.resolve).toHaveBeenNthCalledWith(2, 'rappel', {
      formationId: 4,
      centreId: undefined
    })
  })

  it('newsletter et candidature ne portent aucun rattachement', async () => {
    const { service, resolver } = serviceWith(franchise)

    await service.submitNewsletter({ email: 'abonne@site.fr' })
    await service.submitCandidature(candidature)

    expect(resolver.resolve).toHaveBeenNthCalledWith(1, 'newsletter', {})
    expect(resolver.resolve).toHaveBeenNthCalledWith(2, 'candidature', {})
  })

  it('joint hutk seulement quand la cible est la HQ', async () => {
    const hq = { ...franchise, isHq: true, sourceCode: 'hq' }

    await serviceWith(hq).service.submitNewsletter({ email: 'a@b.fr', hutk: 'cookie-123' })
    expect(lastCall().body.context?.hutk).toBe('cookie-123')

    await serviceWith(franchise).service.submitDemande({ ...demande, hutk: 'cookie-123' })
    expect(lastCall().body.context?.hutk).toBeUndefined()
  })

  it('n’ajoute pas de contexte pour une cible franchise sans page', async () => {
    const { service } = serviceWith(franchise)

    await service.submitRappel({ telephone: '0612345678', consentement: true, hutk: 'cookie' })

    expect(lastCall().body.context).toBeUndefined()
  })

  it('utilise l’endpoint sécurisé et le token d’app privée quand la source en a un', async () => {
    const { service } = serviceWith({ ...franchise, token: 'pat-secret' })

    await service.submitDemande(demande)

    const [url, init] = fetchMock.mock.calls.at(-1) as [string, { headers: Record<string, string> }]
    expect(url).toBe(
      'https://api-eu1.hsforms.com/submissions/v3/integration/secure/submit/portal-lyon/guid-lyon-demande'
    )
    expect(init.headers.Authorization).toBe('Bearer pat-secret')
  })

  it('sans token : endpoint public et aucun en-tête Authorization', async () => {
    const { service } = serviceWith(franchise)

    await service.submitDemande(demande)

    const [url, init] = fetchMock.mock.calls.at(-1) as [string, { headers: Record<string, string> }]
    expect(url).toContain('/integration/submit/')
    expect(init.headers).not.toHaveProperty('Authorization')
  })

  it('lève 503 quand la cible résolue n’a ni portail ni formulaire', async () => {
    const { service } = serviceWith({ ...franchise, portalId: null })
    await expect(service.submitDemande(demande)).rejects.toBeInstanceOf(ServiceUnavailableException)
    const noGuid = serviceWith({ ...franchise, formGuid: null }).service
    await expect(noGuid.submitDemande(demande)).rejects.toBeInstanceOf(ServiceUnavailableException)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('ne logge ni token ni donnée personnelle en cas d’échec HubSpot', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 })
    const { service } = serviceWith({ ...franchise, token: 'pat-secret' })
    const logged: string[] = []
    const spy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation((...args: unknown[]) => void logged.push(args.join(' ')))

    await expect(service.submitDemande(demande)).rejects.toBeInstanceOf(ServiceUnavailableException)

    spy.mockRestore()
    expect(logged.join(' ')).not.toContain('pat-secret')
    expect(logged.join(' ')).not.toContain('jean@acme.fr')
  })
})
