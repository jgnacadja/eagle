import { Test, TestingModule } from '@nestjs/testing'
import { ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { LeadsController } from './leads.controller'
import { LeadsService } from './leads.service'

const validDemande = {
  nom: 'Jean Dupont',
  email: 'jean@acme.fr',
  telephone: '06 12 34 56 78',
  raisonSociale: 'ACME',
  siret: '123 456 789 01234',
  fonction: 'DRH',
  salaries: 12,
  echeance: 'Octobre 2026',
  consentement: true
}

const validCandidature = {
  voie: 'formateur',
  nom: 'Jean Dupont',
  email: 'jean@acme.fr',
  telephone: '0612345678',
  ville: 'Créteil',
  parcours: 'Déjà formateur.',
  consentement: true
}

const validConseiller = {
  besoin: 'centre',
  nom: 'Jean Dupont',
  email: 'jean@acme.fr',
  telephone: '06 12 34 56 78',
  siret: '123 456 789 01234',
  message: 'Former 8 salariés près de Lyon.',
  consentement: true
}

describe('LeadsController', () => {
  let app: INestApplication
  let service: {
    submitNewsletter: ReturnType<typeof vi.fn>
    submitDemande: ReturnType<typeof vi.fn>
    submitCandidature: ReturnType<typeof vi.fn>
    submitConseiller: ReturnType<typeof vi.fn>
    submitRappel: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    service = {
      submitNewsletter: vi.fn().mockResolvedValue({ submitted: true }),
      submitDemande: vi.fn().mockResolvedValue({ submitted: true }),
      submitCandidature: vi.fn().mockResolvedValue({ submitted: true }),
      submitConseiller: vi.fn().mockResolvedValue({ submitted: true }),
      submitRappel: vi.fn().mockResolvedValue({ submitted: true })
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [{ provide: LeadsService, useValue: service }]
    }).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })
    )
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('POST /leads/newsletter accepte un e-mail valide', async () => {
    await request(app.getHttpServer())
      .post('/leads/newsletter')
      .send({ email: 'abonne@site.fr' })
      .expect(201)

    expect(service.submitNewsletter).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'abonne@site.fr' })
    )
  })

  it('POST /leads/newsletter rejette un e-mail invalide', async () => {
    await request(app.getHttpServer())
      .post('/leads/newsletter')
      .send({ email: 'pas-un-email' })
      .expect(400)

    expect(service.submitNewsletter).not.toHaveBeenCalled()
  })

  it('POST /leads/demande accepte et nettoie le SIRET', async () => {
    await request(app.getHttpServer()).post('/leads/demande').send(validDemande).expect(201)

    expect(service.submitDemande).toHaveBeenCalledWith(
      expect.objectContaining({ siret: '12345678901234', salaries: 12 })
    )
  })

  it('POST /leads/demande rejette sans consentement', async () => {
    await request(app.getHttpServer())
      .post('/leads/demande')
      .send({ ...validDemande, consentement: false })
      .expect(400)

    expect(service.submitDemande).not.toHaveBeenCalled()
  })

  it('POST /leads/demande rejette un SIRET invalide', async () => {
    await request(app.getHttpServer())
      .post('/leads/demande')
      .send({ ...validDemande, siret: '123' })
      .expect(400)

    expect(service.submitDemande).not.toHaveBeenCalled()
  })

  it('POST /leads/candidature rejette une voie inconnue', async () => {
    await request(app.getHttpServer())
      .post('/leads/candidature')
      .send({ ...validCandidature, voie: 'franchise' })
      .expect(400)

    expect(service.submitCandidature).not.toHaveBeenCalled()
  })

  it('POST /leads/candidature accepte un payload complet', async () => {
    await request(app.getHttpServer()).post('/leads/candidature').send(validCandidature).expect(201)

    expect(service.submitCandidature).toHaveBeenCalledWith(
      expect.objectContaining({ voie: 'formateur' })
    )
  })

  it('POST /leads/conseiller accepte un payload complet et nettoie le SIRET', async () => {
    await request(app.getHttpServer()).post('/leads/conseiller').send(validConseiller).expect(201)

    expect(service.submitConseiller).toHaveBeenCalledWith(
      expect.objectContaining({ besoin: 'centre', siret: '12345678901234' })
    )
  })

  it('POST /leads/conseiller accepte l’absence de SIRET et de message', async () => {
    const { siret: _siret, message: _message, ...minimal } = validConseiller

    await request(app.getHttpServer()).post('/leads/conseiller').send(minimal).expect(201)

    expect(service.submitConseiller).toHaveBeenCalledWith(
      expect.objectContaining({ besoin: 'centre' })
    )
  })

  it('POST /leads/conseiller rejette un besoin inconnu', async () => {
    await request(app.getHttpServer())
      .post('/leads/conseiller')
      .send({ ...validConseiller, besoin: 'franchise' })
      .expect(400)

    expect(service.submitConseiller).not.toHaveBeenCalled()
  })

  it('POST /leads/conseiller rejette un SIRET invalide', async () => {
    await request(app.getHttpServer())
      .post('/leads/conseiller')
      .send({ ...validConseiller, siret: '123' })
      .expect(400)

    expect(service.submitConseiller).not.toHaveBeenCalled()
  })

  it('POST /leads/conseiller rejette sans consentement', async () => {
    await request(app.getHttpServer())
      .post('/leads/conseiller')
      .send({ ...validConseiller, consentement: false })
      .expect(400)

    expect(service.submitConseiller).not.toHaveBeenCalled()
  })

  it('POST /leads/rappel accepte un payload valide', async () => {
    await request(app.getHttpServer())
      .post('/leads/rappel')
      .send({ telephone: '06 12 34 56 78', creneau: 'Ce matin', consentement: true })
      .expect(201)

    expect(service.submitRappel).toHaveBeenCalledWith(
      expect.objectContaining({
        telephone: '06 12 34 56 78',
        creneau: 'Ce matin',
        consentement: true
      })
    )
  })

  it('POST /leads/rappel accepte les formats espacés et internationaux', async () => {
    // Même règle que LeadContactDto : au moins 10 chiffres, séparateurs
    // et indicatif libres (la regex FR stricte rejetait +33 6 …, +33 (0)6…,
    // +32, +41 alors que le front les laissait passer → 400 sans recours).
    for (const telephone of [
      '+33 6 12 34 56 78',
      '+33 (0)6 12 34 56 78',
      '+32 470 12 34 56',
      '+41 44 123 45 67'
    ]) {
      await request(app.getHttpServer())
        .post('/leads/rappel')
        .send({ telephone, consentement: true })
        .expect(201)
    }
  })

  it('POST /leads/rappel rejette un numéro invalide', async () => {
    await request(app.getHttpServer())
      .post('/leads/rappel')
      .send({ telephone: '123', consentement: true })
      .expect(400)

    expect(service.submitRappel).not.toHaveBeenCalled()
  })

  it('POST /leads/rappel rejette un numéro de plus de 30 caractères', async () => {
    await request(app.getHttpServer())
      .post('/leads/rappel')
      .send({ telephone: `06 ${'12 '.repeat(20)}`, consentement: true })
      .expect(400)

    expect(service.submitRappel).not.toHaveBeenCalled()
  })

  it('POST /leads/rappel rejette sans consentement', async () => {
    await request(app.getHttpServer())
      .post('/leads/rappel')
      .send({ telephone: '06 12 34 56 78', consentement: false })
      .expect(400)

    expect(service.submitRappel).not.toHaveBeenCalled()
  })

  it('rejette les propriétés non listées (forbidNonWhitelisted)', async () => {
    await request(app.getHttpServer())
      .post('/leads/newsletter')
      .send({ email: 'abonne@site.fr', hacker: 'x' })
      .expect(400)

    expect(service.submitNewsletter).not.toHaveBeenCalled()
  })

  it('POST /leads/demande accepte formationId et centreId (entiers, chaînes numériques)', async () => {
    await request(app.getHttpServer())
      .post('/leads/demande')
      .send({ ...validDemande, formationId: '12', centreId: 3, hutk: 'abc' })
      .expect(201)

    expect(service.submitDemande).toHaveBeenCalledWith(
      expect.objectContaining({ formationId: 12, centreId: 3, hutk: 'abc' })
    )
  })

  it('POST /leads/demande ignore un identifiant de rattachement invalide au lieu de perdre le lead', async () => {
    const invalid: Array<Record<string, unknown>> = [
      { formationId: 'abc' },
      { centreId: 0 },
      { formationId: 1.5 },
      { centreId: -4 },
      { formationId: '' },
      { centreId: true },
      { formationId: null },
      { centreId: '12abc' }
    ]
    for (const bad of invalid) {
      service.submitDemande.mockClear()
      await request(app.getHttpServer())
        .post('/leads/demande')
        .send({ ...validDemande, centreId: 3, ...bad })
        .expect(201)

      const [dto] = service.submitDemande.mock.calls[0] as [Record<string, unknown>]
      const [field] = Object.keys(bad)
      expect(dto[field]).toBeUndefined()
      expect(dto.nom).toBe('Jean Dupont')
    }
  })

  it('POST /leads/demande garde l’identifiant valide quand l’autre est invalide', async () => {
    await request(app.getHttpServer())
      .post('/leads/demande')
      .send({ ...validDemande, formationId: 'abc', centreId: '7' })
      .expect(201)

    const [dto] = service.submitDemande.mock.calls[0] as [Record<string, unknown>]
    expect(dto.formationId).toBeUndefined()
    expect(dto.centreId).toBe(7)
  })

  it('POST /leads/conseiller et /leads/rappel ignorent aussi un rattachement invalide', async () => {
    await request(app.getHttpServer())
      .post('/leads/conseiller')
      .send({ ...validConseiller, formationId: 'abc', centreId: 0 })
      .expect(201)
    await request(app.getHttpServer())
      .post('/leads/rappel')
      .send({ telephone: '0612345678', consentement: true, formationId: 1.5, centreId: 'x' })
      .expect(201)

    expect(service.submitConseiller).toHaveBeenCalledWith(
      expect.objectContaining({ formationId: undefined, centreId: undefined })
    )
    expect(service.submitRappel).toHaveBeenCalledWith(
      expect.objectContaining({ formationId: undefined, centreId: undefined })
    )
  })

  it('POST /leads/conseiller et /leads/rappel acceptent le rattachement', async () => {
    await request(app.getHttpServer())
      .post('/leads/conseiller')
      .send({ ...validConseiller, centreId: 5 })
      .expect(201)
    await request(app.getHttpServer())
      .post('/leads/rappel')
      .send({ telephone: '0612345678', consentement: true, formationId: 7 })
      .expect(201)

    expect(service.submitConseiller).toHaveBeenCalledWith(expect.objectContaining({ centreId: 5 }))
    expect(service.submitRappel).toHaveBeenCalledWith(expect.objectContaining({ formationId: 7 }))
  })

  it('POST /leads/newsletter rejette un rattachement (hors périmètre du formulaire)', async () => {
    await request(app.getHttpServer())
      .post('/leads/newsletter')
      .send({ email: 'abonne@site.fr', formationId: 1 })
      .expect(400)
    expect(service.submitNewsletter).not.toHaveBeenCalled()
  })

  it('POST /leads/candidature rejette un rattachement (toujours routée sur la HQ)', async () => {
    await request(app.getHttpServer())
      .post('/leads/candidature')
      .send({ ...validCandidature, centreId: 1 })
      .expect(400)
    expect(service.submitCandidature).not.toHaveBeenCalled()
  })
})
