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
  - leads `/leads/*` : 10 requêtes/min par IP — le endpoint relaie vers HubSpot, un quota large pousserait du spam dans le CRM
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
- Sync non destructive : à l'update, un champ n'est écrit que s'il est vide côté Directus — le contenu éditorial n'est jamais écrasé. Seuls `digiforma_id`, `sessions`, `raw` sont réécrits à chaque run (`sessions` reste éditable dans l'admin — repeater — mais les retours sont perdus au run suivant). Tous les autres champs sont éditables dans Directus, y compris `famille`/`sous_famille` (M2O — `sous_famille` n'est proposée par la sync que si vide).
- `sous_familles_formation` (`slug`, `name`, `caption`, M2O `famille`) regroupe les formations au sein d'une famille — la sync propose une affectation depuis `category_name`, uniquement si le champ est vide.
- Filtre `/courses?subFamily=<slug>` disponible, combiné avec `family`.
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

## Recherches sans résultat (`src/search-misses`)

- Journal des requêtes sans correspondance — « aucun résultat » (catalogue) et « hors catalogue » (moteur IA) — stocké dans la collection Directus `recherches_sans_resultat` via `DirectusItemsClient` (client REST générique `/items/*`, `src/directus`). Distinct des events analytics : on conserve le **contenu** de la requête pour la revue produit.
- Capture : `SearchMissesService.record()` — jamais bloquant, jamais d'exception. `CatalogService.list()` l'appelle quand une recherche textuelle (`search`) renvoie 0 résultat ; le moteur IA l'appellera avec `source: 'assistant'` et l'intention détectée.
- RGPD : e-mail, téléphone, SIRET, IBAN et longues suites de chiffres masqués (`scrubPersonalData`, `src/common/utils/pii.util.ts`) ; localisation « autour de moi » arrondie à ~10 km ; texte tronqué à 500 caractères ; doublons ignorés pendant 60 s ; purge quotidienne après `SEARCH_MISS_RETENTION_DAYS` jours (`SEARCH_MISS_PURGE_CRON`, `0` désactive).
- Endpoints admin (clé `x-api-key`) : `GET /admin/search-misses` (liste paginée), `GET /admin/search-misses/aggregate` (regroupement par requête normalisée), `GET /admin/search-misses/export` (CSV UTF-8 BOM, séparateur `;`), `POST /admin/search-misses/purge`.
- La collection n'est jamais lisible publiquement ; elle est hors du flow Directus d'invalidation de cache.

## Pas de TDD explicite

Les tests ne sont pas forcément écrits avant le code, mais chaque fonctionnalité livrée est couverte. Préférer écrire le test en même temps que l'implémentation.
