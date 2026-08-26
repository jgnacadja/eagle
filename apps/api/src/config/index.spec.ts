import type { INestApplication } from '@nestjs/common'
import type { CustomOrigin } from '@nestjs/common/interfaces/external/cors-options.interface'
import { SwaggerModule } from '@nestjs/swagger'
import { configureApp } from './index'

function makeApp() {
  return { enableCors: vi.fn() } as unknown as INestApplication
}

function getCorsOrigin(app: INestApplication): CustomOrigin {
  const options = (app.enableCors as ReturnType<typeof vi.fn>).mock.calls[0][0]
  return options.origin as CustomOrigin
}

describe('configureApp', () => {
  const originalCorsOrigin = process.env.CORS_ORIGIN
  const originalNodeEnv = process.env.NODE_ENV
  let setupSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    setupSpy = vi.spyOn(SwaggerModule, 'setup').mockImplementation(() => undefined as never)
    vi.spyOn(SwaggerModule, 'createDocument').mockReturnValue({} as never)
  })

  afterEach(() => {
    process.env.CORS_ORIGIN = originalCorsOrigin
    process.env.NODE_ENV = originalNodeEnv
    vi.restoreAllMocks()
  })

  it('registers CORS with the default origin when CORS_ORIGIN is unset', () => {
    delete process.env.CORS_ORIGIN
    const app = makeApp()

    configureApp(app)

    const callback = vi.fn()
    getCorsOrigin(app)('http://localhost:3000', callback)
    expect(callback).toHaveBeenCalledWith(null, true)
  })

  it('allows an origin listed in CORS_ORIGIN', () => {
    process.env.CORS_ORIGIN = 'https://a.example.com, https://b.example.com'
    const app = makeApp()

    configureApp(app)

    const callback = vi.fn()
    getCorsOrigin(app)('https://b.example.com', callback)
    expect(callback).toHaveBeenCalledWith(null, true)
  })

  it('allows requests with no origin (e.g. curl, server-to-server)', () => {
    process.env.CORS_ORIGIN = 'https://a.example.com'
    const app = makeApp()

    configureApp(app)

    const callback = vi.fn()
    getCorsOrigin(app)(undefined, callback)
    expect(callback).toHaveBeenCalledWith(null, true)
  })

  it('rejects an origin not listed in CORS_ORIGIN without leaking an error', () => {
    process.env.CORS_ORIGIN = 'https://a.example.com'
    const app = makeApp()

    configureApp(app)

    const callback = vi.fn()
    getCorsOrigin(app)('https://evil.example.com', callback)
    expect(callback).toHaveBeenCalledWith(null, false)
  })

  it('exposes Swagger docs outside production', () => {
    const app = makeApp()

    configureApp(app)

    expect(setupSpy).toHaveBeenCalledWith('docs', app, expect.anything())
  })

  it('does not expose Swagger docs in production', () => {
    process.env.NODE_ENV = 'production'
    const app = makeApp()

    configureApp(app)

    expect(setupSpy).not.toHaveBeenCalled()
  })
})
