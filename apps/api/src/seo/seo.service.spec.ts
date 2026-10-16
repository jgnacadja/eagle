import { Test, TestingModule } from '@nestjs/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CacheService } from '../common/cache/cache.service'
import { DirectusItemsClient } from '../directus/directus.items.client'
import { SeoService } from './seo.service'

describe('SeoService', () => {
  let service: SeoService
  const readMany = vi.fn()
  const cache = { get: vi.fn(), set: vi.fn() }

  beforeEach(async () => {
    vi.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeoService,
        { provide: DirectusItemsClient, useValue: { readMany } },
        { provide: CacheService, useValue: cache }
      ]
    }).compile()
    service = module.get(SeoService)
  })

  it('renvoie le 301 d’une ligne redirects', async () => {
    readMany.mockResolvedValueOnce({
      data: [{ status: '301', to_path: '/formations/gestion/nouveau-slug' }]
    })
    expect(await service.resolve('/formations/gestion/ancien-slug')).toEqual({
      redirect: { to: '/formations/gestion/nouveau-slug', status: 301 }
    })
  })

  it('renvoie gone sur un 410, même avec une cible résiduelle', async () => {
    readMany.mockResolvedValueOnce({ data: [{ status: '410', to_path: '/autre' }] })
    expect(await service.resolve('/vieille-page')).toEqual({ gone: true })
  })

  it('ignore un 301 sans cible et résout le contenu à la place', async () => {
    readMany
      .mockResolvedValueOnce({ data: [{ status: '301', to_path: null }] })
      .mockResolvedValueOnce({ data: [{ id: 12 }] })
    expect(await service.resolve('/mentions-legales')).toEqual({ type: 'page', id: 12 })
  })

  it('normalise le chemin avant la recherche (slash final, casse)', async () => {
    readMany.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] })
    await service.resolve('/Formations/Securite/')
    expect(readMany.mock.calls[0][1].filter).toEqual({
      from_path: { _eq: '/formations/securite' }
    })
  })

  it('résout une fiche formation sur famille + slug', async () => {
    readMany
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [{ id: 7, famille: 3 }] })
      .mockResolvedValueOnce({ data: [{ slug: 'securite' }] })
    expect(await service.resolve('/formations/securite/caces-r489')).toEqual({
      type: 'formation',
      id: 7
    })
    expect(readMany.mock.calls[1][1].filter).toEqual({
      slug: { _eq: 'caces-r489' },
      status: { _eq: 'published' }
    })
  })

  it('refuse une fiche dont la famille de l’URL n’est pas la sienne', async () => {
    readMany
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [{ id: 7, famille: 3 }] })
      .mockResolvedValueOnce({ data: [{ slug: 'gestion' }] })
    expect(await service.resolve('/formations/securite/caces-r489')).toEqual({
      type: null,
      id: null
    })
  })

  it('résout famille, article, centre et page selon le gabarit', async () => {
    const cases = [
      ['/formations/securite', 'familles_formation', 'famille'],
      ['/actualites/reforme-caces', 'articles', 'article'],
      ['/centres/creteil', 'centres', 'centre'],
      ['/politique-confidentialite', 'pages_legales', 'page']
    ] as const
    for (const [path, collection, type] of cases) {
      readMany.mockReset()
      readMany.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [{ id: 1 }] })
      expect(await service.resolve(path)).toEqual({ type, id: 1 })
      expect(readMany.mock.calls[1][0]).toBe(collection)
    }
  })

  it('reconnaît les routes codées sans requête contenu', async () => {
    readMany.mockResolvedValueOnce({ data: [] })
    expect(await service.resolve('/a-propos')).toEqual({ type: 'static', id: '/a-propos' })
    expect(readMany).toHaveBeenCalledTimes(1) // redirects seul
  })

  it('renvoie type/id null sur une adresse inconnue', async () => {
    readMany.mockResolvedValue({ data: [] })
    expect(await service.resolve('/nope/rien/ici')).toEqual({ type: null, id: null })
  })

  it('sert la résolution depuis le cache sans rappeler Directus', async () => {
    cache.get.mockResolvedValueOnce({ gone: true })
    expect(await service.resolve('/x')).toEqual({ gone: true })
    expect(readMany).not.toHaveBeenCalled()
    expect(cache.set).not.toHaveBeenCalled()
  })

  it('met en cache la résolution calculée', async () => {
    readMany.mockResolvedValueOnce({ data: [{ status: '410', to_path: null }] })
    await service.resolve('/gone')
    expect(cache.set).toHaveBeenCalledWith('seo:resolve:/gone', { gone: true })
  })
})
