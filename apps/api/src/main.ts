import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { configureApp } from './config'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  app.enableShutdownHooks()

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })
  )
  app.useGlobalFilters(new HttpExceptionFilter())

  configureApp(app)

  const port = parseInt(process.env.API_PORT ?? '3001', 10)
  await app.listen(port, '0.0.0.0')
}

void bootstrap()
