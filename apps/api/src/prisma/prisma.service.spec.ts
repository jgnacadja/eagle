import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from './prisma.service'

describe('PrismaService', () => {
  let service: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: () => 'postgresql://learnup:learnup@localhost:5432/learnup_api'
          }
        }
      ]
    }).compile()

    service = module.get<PrismaService>(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('connects on module init', async () => {
    vi.spyOn(service, '$connect').mockResolvedValue(undefined)
    await service.onModuleInit()
    expect(service.$connect).toHaveBeenCalled()
  })

  it('disconnects on module destroy', async () => {
    vi.spyOn(service, '$disconnect').mockResolvedValue(undefined)
    await service.onModuleDestroy()
    expect(service.$disconnect).toHaveBeenCalled()
  })
})
