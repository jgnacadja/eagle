---
name: nestjs-stack
description: Conventions NestJS 11 pour le monorepo EAGLE. Utiliser pour créer ou réviser un module, service, controller, DTO, test, config, cache Redis, rate limit ou sync dans apps/api.
license: MIT
metadata:
  author: learnup
  version: '1.0.0'
  domain: backend
  triggers: nestjs, nest, apps/api, controller, service, dto, module, prisma, redis, throttler, sync, digiforma
---

# NestJS stack — EAGLE

## Règles bloquantes

- DTOs `class-validator` pour chaque endpoint. `ValidationPipe` global : `whitelist`, `transform`, `forbidNonWhitelisted`.
- Pas de secret dans le code. Variables sensibles uniquement dans `.env`.
- Pas de `console.*`. Utiliser les mécanismes de log de NestJS si besoin.
- Tests unitaires/supertest pour chaque module. Mocks Prisma, Redis, Digiforma.

## Structure d'une feature

```
src/{feature}/
  {feature}.module.ts
  {feature}.controller.ts
  {feature}.service.ts
  {feature}.dto.ts
  {feature}.controller.spec.ts
  {feature}.service.spec.ts
```

## Patterns

- `NestFactory.create(AppModule)`, `app.enableShutdownHooks()`, `ValidationPipe` global, `HttpExceptionFilter` global.
- Services `@Injectable()`, injection constructeur, jamais `new`.
- Prisma : `PrismaService` global, migrations dans `apps/api/prisma/`.
- Cache : ioredis, clés versionnées `catalog:v{n}:...`, invalidation en fin de sync.
- Throttle : `@nestjs/throttler` + `@nest-lab/throttler-storage-redis`. 100 req/min IP pour `/formations*`, 10 req/min pour `/admin*`.
- Sync : cron 1 h, client GraphQL Digiforma (Bearer), upsert idempotent, table `SyncRun`.

## Tests

- Vitest + `Test.createTestingModule`.
- `supertest` pour controllers.
- Fixtures JSON dans `test/fixtures/` quand pas de clé Digiforma.
