# apps/api — Conventions NestJS

Lire d'abord `AGENTS.md` à la racine.

## Architecture

- `src/app.module.ts` point d'entrée global.
- Par fonctionnalité, organiser en `src/{feature}/` avec : `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.dto.ts`, `*.spec.ts`.
- Services `@Injectable()` avec injection par constructeur. Ne jamais instancier manuellement.

## Validation et sécurité

- DTOs obligatoires pour tous les endpoints, décorateurs `class-validator` (`@IsString`, `@IsOptional`, `@IsInt`, etc.).
- `ValidationPipe` global : `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` (déjà dans `main.ts`).
- `HttpExceptionFilter` global (dans `main.ts`) — conserver la structure `{ statusCode, message, timestamp, path }`.
- Helmet, `@nestjs/throttler` + stockage Redis (`@nest-lab/throttler-storage-redis`) à mettre en place pour le catalog.
- Limites cibles :
  - lecture publique `/courses*` : 100 requêtes/min par IP
  - admin `/admin/*` : 10 requêtes/min par clé API
- Routes admin : protégées par `ADMIN_API_KEY` (header `x-api-key`). Guard dédié.

## Tests

- Unitaire `*.spec.ts` à côté du fichier testé.
- Supertest sur les controllers : `apps/api/test` ou à côté du controller (`*.controller.spec.ts`).
- Vitest, `@nestjs/testing` `Test.createTestingModule`.
- Toujours mocker Prisma, Redis et le client Digiforma. Fixtures JSON dans `test/fixtures/` si pas de clé API.

## Base de données

- Prisma dans `apps/api/prisma/` : `schema.prisma` + migrations versionnées.
- Modèles attendus pour le sprint 2 :
  - `Course` : `digiforma_id` unique, slug, titre, description, durée, prix, CPF, code CPF, certification, catégorie/famille, blocs (JSON), image, statut, champs SEO, raw Digiforma, timestamps.
  - `SyncRun` : started_at, finished_at, statut, compteurs, message d'erreur.
- Clés : `DATABASE_URL`, `REDIS_URL` dans `.env`.

## Cache

- ioredis, service générique `get`/`set`/`del`.
- Clés versionnées : `catalog:v{n}:...`. Incrémenter `n` en fin de sync réussie.
- TTL 1 h par défaut, configurable.

## Sync Digiforma

- Client GraphQL `DigiformaClient` : `fetch` vers `app.digiforma.com/api/v1/graphql`, auth Bearer, pagination, retry/exponential backoff, timeout.
- Mapping `Program` → `Course` ; en cas de doute, garder le payload brut dans `raw`.
- Cron `@nestjs/schedule` toutes les 1 h (env `SYNC_CRON`).
- Endpoint admin : `POST /admin/sync` (forcer), `GET /admin/sync/status`.

## Pas de TDD explicite

Les tests ne sont pas forcément écrits avant le code, mais chaque fonctionnalité livrée est couverte. Préférer écrire le test en même temps que l'implémentation.
