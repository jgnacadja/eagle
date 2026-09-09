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
  - lecture publique `/courses*` : 300 requêtes/min par IP (le SSR du front déclenche ~6 appels API par page vue depuis la même IP)
  - admin `/admin/*` : 10 requêtes/min par clé API
- Routes admin : protégées par `ADMIN_API_KEY` (header `x-api-key`). Guard dédié.

## Tests

- Unitaire `*.spec.ts` à côté du fichier testé.
- Supertest sur les controllers : `apps/api/test` ou à côté du controller (`*.controller.spec.ts`).
- Vitest, `@nestjs/testing` `Test.createTestingModule`.
- Toujours mocker Directus, Redis et le client Digiforma. Fixtures JSON dans `test/fixtures/` si pas de clé API.

## Base de données

- Plus de Prisma / Postgres dédié côté API.
- La source de vérité des formations est la collection Directus `formations` (`directus/schema/collections.mjs`).
- Champs attendus pour `formations` : `digiforma_id` unique, `slug`, `title`, `description`, `duration_days`, `duration_hours`, `price`, `cpf`, `cpf_code`, `certification`, `certifier_name`, `category_name`, `modalities`, `center_slug`, `center_slugs`, `sessions`, `locations_text`, `blocks`, `image_url`, `generated_program_url`, `status`, `seo_title`, `seo_description`, `seo_canonical`, `raw`.
- La relation `famille` (M2O vers `familles_formation`) est le seul champ éditable ; elle n'est jamais écrasée par la sync.
- `SyncRun` est stocké dans Redis (`sync:last_run`) : statut, dates, compteurs, message d'erreur.
- Clés : `REDIS_URL`, `DIRECTUS_TOKEN`, `DIRECTUS_INTERNAL_URL` dans `.env` (plus de `DATABASE_URL`).

## Cache

- ioredis, service générique `get`/`set`/`del`.
- Clés versionnées : `catalog:v{n}:...`. Incrémenter `n` en fin de sync réussie.
- TTL 1 h par défaut, configurable.
- **Jamais cacher un résultat vide** (catalogue sans formations) : si Directus est vide ou indisponible au démarrage, un catalogue vide ne doit pas être gelé pendant le TTL.

## Sync Digiforma

- Client GraphQL `DigiformaClient` : `fetch` vers `app.digiforma.com/api/v1/graphql`, auth Bearer, pagination, retry/exponential backoff, timeout.
- Mapping `Program` → payload Directus (`FormationDirectusPayload`, snake_case) ; en cas de doute, garder le payload brut dans `raw`.
- La sync écrit / met à jour les formations dans Directus (`DirectusCatalogService.upsertMany`).
- Cron `@nestjs/schedule` toutes les 1 h (env `SYNC_CRON`).
- Endpoint admin : `POST /admin/sync` (forcer), `GET /admin/sync/status`.

## Catalogue

- `CatalogService` charge l'intégralité des formations publiées depuis Directus en mémoire (limité au cache Redis `formations:all`), puis applique filtres, tri et pagination côté API.
- Endpoints publics : `GET /courses`, `GET /courses/:family/:slug`, `GET /families`.
- `POST /admin/families/apply` synchronise la relation `famille` entre Directus et les formations.

## Pas de TDD explicite

Les tests ne sont pas forcément écrits avant le code, mais chaque fonctionnalité livrée est couverte. Préférer écrire le test en même temps que l'implémentation.
