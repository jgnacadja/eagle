import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { AdminApiKeyGuard } from './admin-api-key.guard'

const apiKey = 'super-secret-admin-key'

function mockContext(headerValue?: string): Record<string, () => unknown> {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { 'x-api-key': headerValue }
      })
    })
  }
}

describe('AdminApiKeyGuard', () => {
  let guard: AdminApiKeyGuard

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminApiKeyGuard,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: () => apiKey
          }
        }
      ]
    }).compile()

    guard = module.get<AdminApiKeyGuard>(AdminApiKeyGuard)
  })

  it('allows access with a valid API key', () => {
    expect(guard.canActivate(mockContext(apiKey) as never)).toBe(true)
  })

  it('throws with a missing API key', () => {
    expect(() => guard.canActivate(mockContext(undefined) as never)).toThrow(
      'Invalid admin API key'
    )
  })

  it('throws with an invalid API key', () => {
    expect(() => guard.canActivate(mockContext('wrong-key') as never)).toThrow(
      'Invalid admin API key'
    )
  })

  it('throws with a key of a different length', () => {
    expect(() => guard.canActivate(mockContext('short') as never)).toThrow('Invalid admin API key')
  })
})
