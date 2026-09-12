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
- Helmet, `@nestjs/throttler` + stockage Redis (`@nest-lab/throttler-storage-redis`) en place dans `app.module.ts`.
- Limites :
  - lecture publique : 100 requêtes/min par IP (tracker `req.ip` — `trust proxy` est activé dans `configureApp` pour que l'IP cliente traverse le proxy/Vercel)
  - proxy `/directus/*` : 600 requêtes/min par IP (assets images inclus)
  - admin `/admin/*` : 10 requêtes/min par clé API — sauf `POST /admin/cache/invalidate` (`@SkipThrottle`) : les écritures Directus en masse déclenchent une rafale d'invalidations qu'aucun 429 ne doit dropper
  - `/health` et les fetches SSR (`x-internal-ssr` = `INTERNAL_API_TOKEN`) sont exclus du quota public — sans ça l'IP du serveur Nuxt mutualiserait tous les visiteurs dans un seul bucket.
- Si le stockage Redis tombe, le throttling est désactivé (fail-open, `FailSafeThrottlerStorage`) et les 429 sont loggés par `HttpExceptionFilter`.
- Routes admin : protégées par `ADMIN_API_KEY` (header `x-api-key`). Guard dédié.

## Tests

- Unitaire `*.spec.ts` à côté du fichier testé.
- Supertest sur les controllers : `apps/api/test` ou à côté du controller (`*.controller.spec.ts`).
- Vitest, `@nestjs/testing` `Test.createTestingModule`.
- Toujours mocker Directus, Redis et le client Digiforma. Fixtures JSON dans `test/fixtures/` si pas de clé API.

## Base de données

- Plus de Prisma / Postgres dédié côté API.
- La source de vérité des formations est la collection Directus `formations` (`directus/schema/collections.mjs`).
- Champs attendus pour `formations` : `digiforma_id` unique, `slug`, `title`, `description`, `duration_days`, `duration_hours`, `price`, `cpf`, `cpf_code`, `certification`, `certifier_name`, `category_name`, `modalities`, `center_slug`, `center_slugs`, `sessions`, `locations_text`, `blocks`, `image`, `generated_program_url`, `status`, `seo_title`, `seo_description`, `seo_canonical`, `raw`.
- `image` (M2O `directus_files`) est l'unique champ visuel : la sync importe l'image Digiforma via `POST /files/import` (marqueur `digiforma-sync:` dans la description du fichier), l'éditeur peut la remplacer — jamais écrasée. L'URL source reste dans `raw` (fallback `Course.imageUrl`).
- Sync non destructive : à l'update, un champ n'est écrit que s'il est vide côté Directus — le contenu éditorial n'est jamais écrasé. Seuls `digiforma_id`, `sessions`, `raw` sont réécrits à chaque run (et restent readonly dans l'admin). Tous les autres champs sont éditables dans Directus, y compris `famille`/`sous_famille` (M2O — `sous_famille` n'est proposée par la sync que si vide).
- `sous_familles_formation` (`slug`, `name`, `caption`, M2O `famille`) regroupe les formations au sein d'une famille — la sync propose une affectation depuis `category_name`, uniquement si le champ est vide.
- Filtre `/courses?subFamily=<slug>` disponible, combiné avec `family`.
- `SyncRun` est stocké dans Redis (`sync:last_run`) : statut, dates, compteurs, message d'erreur.
- Clés : `REDIS_URL`, `DIRECTUS_TOKEN`, `DIRECTUS_INTERNAL_URL` dans `.env` (plus de `DATABASE_URL`).

## Cache

- ioredis, service générique `get`/`set`/`del`.
- Clés versionnées : `catalog:v{n}:...`. Incrémenter `n` en fin de sync réussie.
- TTL 1 h par défaut, configurable.

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
