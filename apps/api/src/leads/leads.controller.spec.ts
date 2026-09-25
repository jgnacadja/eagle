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
  }

  beforeEach(async () => {
    service = {
      submitNewsletter: vi.fn().mockResolvedValue({ submitted: true }),
      submitDemande: vi.fn().mockResolvedValue({ submitted: true }),
      submitCandidature: vi.fn().mockResolvedValue({ submitted: true }),
      submitConseiller: vi.fn().mockResolvedValue({ submitted: true })
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

  it('rejette les propriétés non listées (forbidNonWhitelisted)', async () => {
    await request(app.getHttpServer())
      .post('/leads/newsletter')
      .send({ email: 'abonne@site.fr', hacker: 'x' })
      .expect(400)

    expect(service.submitNewsletter).not.toHaveBeenCalled()
  })
})
