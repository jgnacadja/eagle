import type { LeadFormName } from '../sources/source.types'
import type {
  CandidatureLeadDto,
  ConseillerLeadDto,
  DemandeLeadDto,
  NewsletterLeadDto,
  RappelLeadDto
} from '../leads/leads.dto'
import { HUBSPOT_FORMS_URL, type RecordedCall } from './support/fake-network'
import {
  captureLogs,
  centreRows,
  createHarness,
  ENC_KEY,
  encryptedRow,
  ENV_MONO_SOURCE,
  programsHq,
  programsLyon,
  sourceRows,
  type Harness,
  type SourceRow
} from './support/harness'

const HQ_URL = 'https://digiforma-hq.test/graphql'
const LYON_URL = 'https://digiforma-lyon.test/graphql'
const ENV_URL = ENV_MONO_SOURCE.DIGIFORMA_API_URL

// Clés en clair des fixtures : la base ne contient que leur forme chiffrée.
const PLAIN_SECRETS = {
  digiformaHq: 'digiforma-key-hq-0001',
  digiformaLyon: 'digiforma-key-lyon-0002',
  hubspotLyon: 'hubspot-token-lyon-0003'
}

const pageContext = {
  pageUri: 'https://learnup.test/formations',
  pageName: 'Formations',
  hutk: 'tracking-cookie-1'
}

const demande: DemandeLeadDto = {
  nom: 'Jean Dupont',
  email: 'jean@acme.test',
  telephone: '0612345678',
  raisonSociale: 'ACME',
  siret: '12345678901234',
  fonction: 'DRH',
  salaries: 12,
  echeance: 'Octobre 2026',
  consentement: true,
  ...pageContext
}
const conseiller: ConseillerLeadDto = {
  besoin: 'conseiller',
  nom: 'Jean Dupont',
  email: 'jean@acme.test',
  telephone: '0612345678',
  consentement: true,
  ...pageContext
}
const rappel: RappelLeadDto = { telephone: '0612345678', consentement: true, ...pageContext }
const newsletter: NewsletterLeadDto = { email: 'jean@acme.test', ...pageContext }
const candidature: CandidatureLeadDto = {
  voie: 'organisme',
  nom: 'Jean Dupont',
  email: 'jean@acme.test',
  telephone: '0612345678',
  ville: 'Lyon',
  parcours: 'Formateur.',
  consentement: true,
  ...pageContext
}

function twoSources(): SourceRow[] {
  return sourceRows().map(encryptedRow)
}

async function twoSourcesHarness(): Promise<Harness> {
  const harness = await createHarness({ sources: twoSources() })
  harness.directus.rows('centres').push(...centreRows())
  harness.network.addDigiforma(HQ_URL, PLAIN_SECRETS.digiformaHq, { response: programsHq() })
  harness.network.addDigiforma(LYON_URL, PLAIN_SECRETS.digiformaLyon, { response: programsLyon() })
  return harness
}

// Cible d'une soumission HubSpot : portail, GUID, endpoint et jeton.
function target(call: RecordedCall | undefined) {
  if (!call) throw new Error('No HubSpot submission recorded')
  const match = new RegExp(
    `^${HUBSPOT_FORMS_URL}/submissions/v3/integration/(secure/)?submit/(\\w+)/([\\w-]+)$`
  ).exec(call.url)
  if (!match) throw new Error(`Unexpected HubSpot URL ${call.url}`)
  return {
    secure: match[1] !== undefined,
    portalId: match[2],
    formGuid: match[3],
    authorization: call.headers.authorization,
    context: (call.body as { context?: { hutk?: string } }).context
  }
}

const lastTarget = (harness: Harness) => target(harness.network.hubspotCalls.at(-1))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('multi-source integration', () => {
  describe('CA1 — deux comptes Digiforma, sans collision d’ids', () => {
    it('crée une formation par source pour un même digiforma_id', async () => {
      const h = await twoSourcesHarness()

      const result = await h.runSync()

      expect(result.runs).toEqual([
        { source: 'hq', status: 'accepted' },
        { source: 'lyon', status: 'accepted' }
      ])
      const formations = h.directus.rows('formations').filter((f) => f.digiforma_id === 'prog-001')
      expect(formations).toHaveLength(2)
      expect(h.directus.formation('uuid-hq', 'prog-001')?.title).toBe('Pilotage de projet HQ')
      expect(h.directus.formation('uuid-lyon', 'prog-001')?.title).toBe(
        'Habilitation électrique Lyon'
      )
      expect(h.directus.rows('formations')).toHaveLength(3)
    })

    it('interroge chaque compte avec sa propre clé déchiffrée', async () => {
      const h = await twoSourcesHarness()

      await h.runSync()

      expect(h.network.digiformaCallsTo(HQ_URL)[0].headers.authorization).toBe(
        `Bearer ${PLAIN_SECRETS.digiformaHq}`
      )
      expect(h.network.digiformaCallsTo(LYON_URL)[0].headers.authorization).toBe(
        `Bearer ${PLAIN_SECRETS.digiformaLyon}`
      )
    })

    it('met à jour sur la clé (source, digiforma_id) au run suivant, sans doublon', async () => {
      const h = await twoSourcesHarness()
      await h.runSync()

      await h.runSync()

      expect(h.directus.rows('formations')).toHaveLength(3)
      expect(h.cache.runs.get('hq')).toMatchObject({ status: 'success', inserted: 0, updated: 1 })
      expect(h.cache.runs.get('lyon')).toMatchObject({ status: 'success', inserted: 0, updated: 2 })
    })
  })

  describe('isolation des sources', () => {
    it('synchronise la source saine quand l’autre est en erreur, avec des SyncRun distincts', async () => {
      const h = await twoSourcesHarness()
      h.network.setDigiforma(LYON_URL, 500)

      await h.runSync()

      expect(h.directus.formation('uuid-hq', 'prog-001')).toBeDefined()
      expect(h.directus.rows('formations').filter((f) => f.source === 'uuid-lyon')).toHaveLength(0)
      expect(h.cache.runs.get('hq')).toMatchObject({ status: 'success', source: 'hq', inserted: 1 })
      expect(h.cache.runs.get('lyon')).toMatchObject({
        status: 'failed',
        source: 'lyon',
        error: 'Digiforma HTTP 500'
      })
      expect(h.cache.runs.get('hq')).not.toBe(h.cache.runs.get('lyon'))
      expect(h.cache.versions.get('hq')).toBe(1)
      expect(h.cache.versions.has('lyon')).toBe(false)
      expect(h.directus.rows('sources').map((s) => [s.code, s.last_sync_status])).toEqual([
        ['hq', 'success'],
        ['lyon', 'failed']
      ])
    })

    it('reprend la source en échec au run suivant sans toucher l’autre', async () => {
      const h = await twoSourcesHarness()
      h.network.setDigiforma(LYON_URL, 500)
      await h.runSync()
      h.network.setDigiforma(LYON_URL, programsLyon())

      await h.runSync('lyon')

      expect(h.cache.runs.get('lyon')).toMatchObject({ status: 'success', inserted: 2 })
      expect(h.directus.rows('formations')).toHaveLength(3)
      expect(h.network.digiformaCallsTo(HQ_URL)).toHaveLength(1)
    })
  })

  describe('CA2 — désactivation / réactivation réversibles', () => {
    it('archive les formations de la source désactivée puis les republie, sauf celles archivées à la main', async () => {
      const h = await twoSourcesHarness()
      await h.runSync()
      const manual = h.directus.formation('uuid-lyon', 'prog-002')
      Object.assign(manual ?? {}, { status: 'archived' })
      const lyonCallsBefore = h.network.digiformaCallsTo(LYON_URL).length

      h.updateSource('uuid-lyon', { status: 'inactive' })
      await h.runSync()

      const lyonProg = h.directus.formation('uuid-lyon', 'prog-001')
      expect(lyonProg).toMatchObject({ status: 'archived', archived_by_source: true })
      expect(manual).toMatchObject({ status: 'archived', archived_by_source: false })
      expect(h.directus.formation('uuid-hq', 'prog-001')).toMatchObject({ status: 'published' })
      expect(h.directus.rows('formations')).toHaveLength(3)
      expect(h.network.digiformaCallsTo(LYON_URL)).toHaveLength(lyonCallsBefore)
      expect(h.cache.runs.get('lyon')).toMatchObject({ status: 'success', archived: 1 })
      expect(h.cache.versions.get('lyon')).toBe(2)

      h.updateSource('uuid-lyon', { status: 'active' })
      await h.runSync()

      expect(lyonProg).toMatchObject({ status: 'published', archived_by_source: false })
      expect(manual).toMatchObject({ status: 'archived', archived_by_source: false })
      expect(h.cache.runs.get('lyon')).toMatchObject({ status: 'success', republished: 1 })
      expect(h.cache.versions.get('lyon')).toBe(3)
    })

    it('ne désactive pas les autres sources lors d’une sync ciblée', async () => {
      const h = await twoSourcesHarness()
      await h.runSync()
      h.updateSource('uuid-lyon', { status: 'inactive' })

      await h.runSync('hq')

      expect(h.directus.formation('uuid-lyon', 'prog-001')).toMatchObject({ status: 'published' })
    })
  })

  describe('CA3 — routage des leads par portail HubSpot', () => {
    let h: Harness
    let lyonFormationId: number
    let hqFormationId: number

    beforeEach(async () => {
      h = await twoSourcesHarness()
      await h.runSync()
      lyonFormationId = h.directus.formation('uuid-lyon', 'prog-001')?.id as number
      hqFormationId = h.directus.formation('uuid-hq', 'prog-001')?.id as number
    })

    it('envoie une demande sur une formation franchise au portail de la franchise', async () => {
      await h.leads.submitDemande({ ...demande, formationId: lyonFormationId })

      expect(lastTarget(h)).toMatchObject({
        portalId: '2222222',
        formGuid: 'lyon-form-demande',
        secure: true,
        authorization: `Bearer ${PLAIN_SECRETS.hubspotLyon}`
      })
    })

    it('route conseiller et rappel sur un centre franchise vers le portail de la franchise', async () => {
      await h.leads.submitConseiller({ ...conseiller, centreId: 1 })
      expect(lastTarget(h)).toMatchObject({ portalId: '2222222', formGuid: 'lyon-form-conseiller' })

      await h.leads.submitRappel({ ...rappel, centreId: 1 })
      expect(lastTarget(h)).toMatchObject({ portalId: '2222222', formGuid: 'lyon-form-rappel' })
    })

    it('garde newsletter et candidature sur le portail HQ, même avec un contexte franchise', async () => {
      await h.leads.submitNewsletter({ ...newsletter, formationId: lyonFormationId } as never)
      expect(lastTarget(h)).toMatchObject({ portalId: '1111111', formGuid: 'hq-form-newsletter' })

      await h.leads.submitCandidature({ ...candidature, centreId: 1 } as never)
      expect(lastTarget(h)).toMatchObject({ portalId: '1111111', formGuid: 'hq-form-candidature' })
    })

    it('route sur la HQ un lead sans contexte, sur une formation HQ, un centre HQ ou un id inconnu', async () => {
      await h.leads.submitDemande(demande)
      expect(lastTarget(h)).toMatchObject({ portalId: '1111111', formGuid: 'hq-form-demande' })

      await h.leads.submitDemande({ ...demande, formationId: hqFormationId })
      expect(lastTarget(h)).toMatchObject({ portalId: '1111111', formGuid: 'hq-form-demande' })

      await h.leads.submitConseiller({ ...conseiller, centreId: 2 })
      expect(lastTarget(h)).toMatchObject({ portalId: '1111111', formGuid: 'hq-form-conseiller' })

      await h.leads.submitDemande({ ...demande, formationId: 9999 })
      expect(lastTarget(h)).toMatchObject({ portalId: '1111111', formGuid: 'hq-form-demande' })
    })

    it('ne joint le cookie de tracking qu’au portail HQ', async () => {
      await h.leads.submitDemande(demande)
      expect(lastTarget(h).context?.hutk).toBe('tracking-cookie-1')

      await h.leads.submitDemande({ ...demande, formationId: lyonFormationId })
      expect(lastTarget(h).context?.hutk).toBeUndefined()
    })

    it('replie sur la HQ quand la source de la formation est désactivée', async () => {
      h.updateSource('uuid-lyon', { status: 'inactive' })

      await h.leads.submitDemande({ ...demande, formationId: lyonFormationId })

      expect(lastTarget(h)).toMatchObject({ portalId: '1111111', formGuid: 'hq-form-demande' })
    })

    it('replie sur la HQ quand le GUID du formulaire de la franchise manque', async () => {
      h.updateSource('uuid-lyon', { hubspot_form_demande: null })

      await h.leads.submitDemande({ ...demande, formationId: lyonFormationId })

      expect(lastTarget(h)).toMatchObject({ portalId: '1111111', formGuid: 'hq-form-demande' })
    })
  })

  describe('CA4 — sans source en base, le comportement env mono-source est inchangé', () => {
    async function envHarness(): Promise<Harness> {
      const h = await createHarness({ sources: [], env: ENV_MONO_SOURCE })
      h.network.addDigiforma(ENV_URL, ENV_MONO_SOURCE.DIGIFORMA_API_KEY, {
        response: programsHq()
      })
      return h
    }

    it('synchronise le compte Digiforma de l’env sous la source hq', async () => {
      const h = await envHarness()

      const result = await h.runSync()

      expect(result.runs).toEqual([{ source: 'hq', status: 'accepted' }])
      expect(h.network.digiformaCallsTo(ENV_URL)[0].headers.authorization).toBe(
        `Bearer ${ENV_MONO_SOURCE.DIGIFORMA_API_KEY}`
      )
      expect(h.directus.rows('formations')).toHaveLength(1)
      expect(h.directus.rows('formations')[0]).toMatchObject({
        digiforma_id: 'prog-001',
        source: null,
        status: 'published'
      })
      expect(h.cache.runs.get('hq')).toMatchObject({ status: 'success', inserted: 1 })
      expect(h.directus.calls.some((call) => call.url.includes('/items/sources/'))).toBe(false)
    })

    it('met à jour sans doublon au run suivant', async () => {
      const h = await envHarness()
      await h.runSync()

      await h.runSync()

      expect(h.directus.rows('formations')).toHaveLength(1)
      expect(h.cache.runs.get('hq')).toMatchObject({ inserted: 0, updated: 1 })
    })

    it('poste les 5 formulaires sur le portail et les GUID de l’env', async () => {
      const h = await envHarness()
      await h.runSync()
      const formationId = h.directus.rows('formations')[0].id as number

      const submissions: Array<[LeadFormName, () => Promise<unknown>]> = [
        ['newsletter', () => h.leads.submitNewsletter(newsletter)],
        ['demande', () => h.leads.submitDemande({ ...demande, formationId, centreId: 2 })],
        ['candidature', () => h.leads.submitCandidature(candidature)],
        ['conseiller', () => h.leads.submitConseiller({ ...conseiller, centreId: 2 })],
        ['rappel', () => h.leads.submitRappel({ ...rappel, formationId })]
      ]
      for (const [form, submit] of submissions) {
        await submit()
        expect(lastTarget(h)).toMatchObject({
          portalId: ENV_MONO_SOURCE.HUBSPOT_PORTAL_ID,
          formGuid:
            ENV_MONO_SOURCE[`HUBSPOT_FORM_${form.toUpperCase()}` as keyof typeof ENV_MONO_SOURCE],
          secure: false
        })
      }
      expect(h.network.hubspotCalls).toHaveLength(5)
      expect(lastTarget(h).context?.hutk).toBe('tracking-cookie-1')
    })
  })

  describe('secrets — aucune clé en clair dans les logs', () => {
    it('ne journalise ni clé Digiforma, ni jeton HubSpot, ni clé de chiffrement', async () => {
      const logs = captureLogs()
      const plaintextRow: SourceRow = {
        ...sourceRows()[1],
        id: 'uuid-rogue',
        code: 'rogue',
        digiforma_api_key: 'plaintext-secret-0006',
        hubspot_token: null
      }
      const h = await createHarness({ sources: [...twoSources(), plaintextRow] })
      h.directus.rows('centres').push(...centreRows())
      h.network.addDigiforma(HQ_URL, PLAIN_SECRETS.digiformaHq, { response: programsHq() })
      h.network.addDigiforma(LYON_URL, PLAIN_SECRETS.digiformaLyon, { response: 500 })

      await h.runSync()
      h.network.setDigiforma(LYON_URL, programsLyon())
      await h.runSync('lyon')
      const lyonFormationId = h.directus.formation('uuid-lyon', 'prog-001')?.id as number
      await h.leads.submitDemande({ ...demande, formationId: lyonFormationId })
      h.updateSource('uuid-lyon', { hubspot_form_demande: null })
      await h.leads.submitDemande({ ...demande, formationId: lyonFormationId })

      const output = logs.text()
      expect(logs.count()).toBeGreaterThan(0)
      expect(output).toContain('rogue')
      expect(output).toContain('lyon')
      for (const secret of [
        ...Object.values(PLAIN_SECRETS),
        'plaintext-secret-0006',
        ENC_KEY,
        'directus-service-token-0005'
      ]) {
        expect(output).not.toContain(secret)
      }
      expect(output).not.toContain('enc:v1:')
    })
  })
})
