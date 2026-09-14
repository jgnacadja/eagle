import type { INestApplication } from '@nestjs/common'
import helmet from 'helmet'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { makeCorsOrigin, toOriginMatcher } from '../common/utils/cors.util'

export function configureApp(app: INestApplication): void {
  app.use(helmet())

  // Derrière un proxy (Vercel, LB, Docker) : sans `trust proxy`, req.ip vaut
  // l'IP du frontal et tout le trafic partage le même bucket du throttler
  // (100 req/min au total). On fait confiance au premier hop uniquement.
  const httpApp = app.getHttpAdapter().getInstance() as
    { set?: (key: string, value: unknown) => void } | undefined

  httpApp?.set?.('trust proxy', 1)

  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .map(toOriginMatcher)

  const corsOrigin = makeCorsOrigin(allowedOrigins)

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  })

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Backend API')
      .setDescription('API LEARN UP ACADEMY — documentation OpenAPI')
      .setVersion('0.0.1')
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
      .build()
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig))
  }
}
