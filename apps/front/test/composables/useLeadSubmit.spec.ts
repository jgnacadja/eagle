import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLeadSubmit } from '~/composables/useLeadSubmit'

const fetchMock = vi.fn()

vi.stubGlobal('useRuntimeConfig', () => ({
  public: { apiBase: 'http://localhost:3001' }
}))
vi.stubGlobal('logClientError', vi.fn())
vi.stubGlobal('$fetch', fetchMock)

function lastCall(): { url: string; body: Record<string, unknown> } {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, { body: Record<string, unknown> }]
  return { url, body: init.body }
}

describe('useLeadSubmit', () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({})
  })

  it('newsletter : poste le payload à /leads/newsletter', async () => {
    const { submit } = useLeadSubmit()

    const ok = await submit('newsletter', { email: 'abonne@site.fr' })

    expect(ok).toBe(true)
    const { url, body } = lastCall()
    expect(url).toBe('http://localhost:3001/leads/newsletter')
    expect(body).toEqual({ email: 'abonne@site.fr' })
  })

  it('demande : poste le payload métier tel quel à /leads/demande', async () => {
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
    expect(url).toBe('http://localhost:3001/leads/demande')
    expect(body).toMatchObject({
      nom: 'Jean Dupont Martin',
      siret: '12345678901234',
      sujet: 'franchise',
      consentement: true,
      pageUri: 'https://learnup.fr/centres/demande-de-formation'
    })
  })

  it('candidature : poste le payload à /leads/candidature', async () => {
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
    expect(url).toBe('http://localhost:3001/leads/candidature')
    expect(body).toMatchObject({ voie: 'formateur', ville: 'Lyon' })
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

  it('config absente : retourne false sans appeler l’API', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { apiBase: '' }
    }))
    const { submit, error } = useLeadSubmit()

    const ok = await submit('newsletter', { email: 'a@b.fr' })

    expect(ok).toBe(false)
    expect(error.value).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
