import type { ConfigService } from '@nestjs/config'
import { ServiceUnavailableException } from '@nestjs/common'
import { LeadsService } from './leads.service'
import type { CandidatureLeadDto, DemandeLeadDto, NewsletterLeadDto } from './leads.dto'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

function mockConfig(values: Record<string, string | undefined> = {}): ConfigService {
  const env: Record<string, string | undefined> = {
    HUBSPOT_PORTAL_ID: '149356688',
    HUBSPOT_FORMS_BASE_URL: 'https://api-eu1.hsforms.com',
    HUBSPOT_FORM_NEWSLETTER: 'guid-newsletter',
    HUBSPOT_FORM_DEMANDE: 'guid-demande',
    HUBSPOT_FORM_CANDIDATURE: 'guid-candidature',
    ...values
  }
  return { get: (key: string) => env[key] } as unknown as ConfigService
}

interface SubmittedBody {
  fields: { name: string; value: string }[]
  context?: { pageUri?: string; pageName?: string }
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

describe('LeadsService', () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200 })
  })

  it('newsletter : poste email seul, sans contexte ni consentement', async () => {
    const service = new LeadsService(mockConfig())
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
    const service = new LeadsService(mockConfig())

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

  it('demande : ignore les champs vides pour ne pas écraser le CRM', async () => {
    const service = new LeadsService(mockConfig())

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
    const service = new LeadsService(mockConfig())

    await service.submitDemande({ ...demande, sujet: 'foobar' })

    const { body } = lastCall()
    expect(fieldNames(body).learnup_type_projet).toBeUndefined()
  })

  it('candidature : mappe la voie sur learnup_type_projet', async () => {
    const service = new LeadsService(mockConfig())

    await service.submitCandidature(candidature)

    const { url, body } = lastCall()
    expect(url).toContain('guid-candidature')
    expect(fieldNames(body).learnup_type_projet).toBe('organisme')
    expect(fieldNames(body).learnup_territoire).toBe('Créteil')
    expect(body.legalConsentOptions?.consent.consentToProcess).toBe(true)
  })

  it('lève 503 si la configuration HubSpot est absente', async () => {
    const service = new LeadsService(mockConfig({ HUBSPOT_FORM_NEWSLETTER: undefined }))

    await expect(service.submitNewsletter({ email: 'abonne@site.fr' })).rejects.toBeInstanceOf(
      ServiceUnavailableException
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('lève 503 si HubSpot rejette la soumission', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400 })
    const service = new LeadsService(mockConfig())

    await expect(service.submitNewsletter({ email: 'abonne@site.fr' })).rejects.toBeInstanceOf(
      ServiceUnavailableException
    )
  })

  it('lève 503 si le fetch échoue (réseau/timeout)', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'))
    const service = new LeadsService(mockConfig())

    await expect(service.submitNewsletter({ email: 'abonne@site.fr' })).rejects.toBeInstanceOf(
      ServiceUnavailableException
    )
  })
})
