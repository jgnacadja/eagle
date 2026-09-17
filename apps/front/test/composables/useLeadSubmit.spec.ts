import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLeadSubmit } from '~/composables/useLeadSubmit'

const fetchMock = vi.fn()

vi.stubGlobal('useRuntimeConfig', () => ({
  public: {
    hubspot: {
      portalId: '149356688',
      formsBaseUrl: 'https://api-eu1.hsforms.com',
      formGuids: {
        newsletter: 'guid-newsletter',
        demande: 'guid-demande',
        candidature: 'guid-candidature'
      }
    }
  }
}))
vi.stubGlobal('logClientError', vi.fn())
vi.stubGlobal('$fetch', fetchMock)

interface SubmittedBody {
  fields: { name: string; value: string }[]
  context?: { pageUri?: string; pageName?: string }
  legalConsentOptions?: { consent: { consentToProcess: boolean; text: string } }
}

function lastCall(): { url: string; body: SubmittedBody } {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, { body: SubmittedBody }]
  return { url, body: init.body }
}

function fieldNames(body: SubmittedBody): Record<string, string> {
  return Object.fromEntries(body.fields.map((f) => [f.name, f.value]))
}

describe('useLeadSubmit', () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({})
  })

  it('newsletter : poste email seul, sans contexte ni consentement', async () => {
    const { submit } = useLeadSubmit()

    const ok = await submit('newsletter', { email: 'abonne@site.fr' })

    expect(ok).toBe(true)
    const { url, body } = lastCall()
    expect(url).toBe(
      'https://api-eu1.hsforms.com/submissions/v3/integration/submit/149356688/guid-newsletter'
    )
    expect(fieldNames(body)).toEqual({ email: 'abonne@site.fr' })
    expect(body.context).toBeUndefined()
    expect(body.legalConsentOptions).toBeUndefined()
  })

  it('demande : mappe les champs HubSpot, joint contexte et consentement', async () => {
    const { submit } = useLeadSubmit()

    await submit('demande', {
      nom: 'Jean Dupont Martin',
      email: 'jean@acme.fr',
      telephone: '0612345678',
      raisonSociale: 'ACME',
      siret: '12345678901234',
      fonction: 'DRH',
      salaries: 12,
      echeance: 'Octobre 2026',
      precisions: 'En intra.',
      centre: 'LEARN UP Créteil',
      formation: 'CACES R489',
      session: '12-14 octobre',
      sujet: 'franchise',
      consentement: true,
      pageUri: 'https://learnup.fr/centres/demande-de-formation',
      pageName: 'Demande de formation'
    })

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
    expect(body.context?.pageUri).toBe('https://learnup.fr/centres/demande-de-formation')
    expect(body.legalConsentOptions?.consent.consentToProcess).toBe(true)
  })

  it('demande : n’envoie pas les champs contextuels vides', async () => {
    const { submit } = useLeadSubmit()

    await submit('demande', {
      nom: 'Jean Dupont',
      email: 'jean@acme.fr',
      telephone: '0612345678',
      raisonSociale: 'ACME',
      siret: '12345678901234',
      fonction: 'DRH',
      salaries: 3,
      echeance: 'Flexible',
      consentement: true
    })

    const { body } = lastCall()
    const names = Object.keys(fieldNames(body))
    expect(names).not.toContain('learnup_centre')
    expect(names).not.toContain('learnup_formation')
    expect(names).not.toContain('learnup_type_projet')
  })

  it('candidature : mappe voie, territoire et parcours', async () => {
    const { submit } = useLeadSubmit()

    await submit('candidature', {
      voie: 'formateur',
      nom: 'Marie Curie',
      email: 'marie@lab.fr',
      telephone: '0698765432',
      ville: 'Lyon',
      parcours: '10 ans de formation SST.',
      consentement: true
    })

    const { url, body } = lastCall()
    expect(url).toContain('guid-candidature')
    expect(fieldNames(body)).toMatchObject({
      firstname: 'Marie',
      lastname: 'Curie',
      learnup_territoire: 'Lyon',
      learnup_parcours: '10 ans de formation SST.',
      learnup_type_projet: 'formateur'
    })
    expect(body.legalConsentOptions?.consent.consentToProcess).toBe(true)
  })

  it('échec réseau : expose l’erreur et retourne false', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    const { submit, error } = useLeadSubmit()

    const ok = await submit('newsletter', { email: 'a@b.fr' })

    expect(ok).toBe(false)
    expect(error.value).toContain('échoué')
  })

  it('reset : efface l’erreur exposée', async () => {
    fetchMock.mockRejectedValue(new Error('down'))
    const { submit, error, reset } = useLeadSubmit()

    await submit('newsletter', { email: 'a@b.fr' })
    expect(error.value).toBeTruthy()

    reset()
    expect(error.value).toBeNull()
  })

  it('config absente : retourne false sans appeler HubSpot', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { hubspot: { portalId: '', formsBaseUrl: '', formGuids: {} } }
    }))
    const { submit, error } = useLeadSubmit()

    const ok = await submit('newsletter', { email: 'a@b.fr' })

    expect(ok).toBe(false)
    expect(error.value).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
