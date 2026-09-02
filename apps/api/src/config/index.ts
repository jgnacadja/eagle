import type { INestApplication } from '@nestjs/common'
import type { CustomOrigin } from '@nestjs/common/interfaces/external/cors-options.interface'
import helmet from 'helmet'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export function configureApp(app: INestApplication): void {
  app.use(helmet())
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  const corsOrigin: CustomOrigin = (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, false)
    }
  }

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
      .build()
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig))
  }
}
