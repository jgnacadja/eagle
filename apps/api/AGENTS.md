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
  - admin `/admin/*` : 10 requêtes/min — bucket par clé API **valide** (HMAC-SHA256 rapide), par IP pour les clés absentes/invalides (borne l'énumération et le coût du hash) — sauf `POST /admin/cache/invalidate` (`@SkipThrottle`) : les écritures Directus en masse déclenchent une rafale d'invalidations qu'aucun 429 ne doit dropper
  - `/health` et les fetches SSR (`x-internal-ssr` = `INTERNAL_API_TOKEN`) sont exclus du quota public — sans ça l'IP du serveur Nuxt mutualiserait tous les visiteurs dans un seul bucket.
- Si le stockage Redis tombe, le throttling bascule sur le stockage mémoire du throttler (par process) pendant 30 s puis retente Redis (`FailSafeThrottlerStorage`) ; les 429 sont loggés par `HttpExceptionFilter`.
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
- Planification externe : workflow GitHub `.github/workflows/sync.yml` toutes les 1 h (`POST /admin/sync` avec `x-api-key`) — pas de cron in-process (serverless). Déclenchement manuel identique.
- `POST /admin/sync` répond `202 { started }` immédiatement ; le run part en tâche de fond (`waitUntil` Vercel pour survivre à la réponse), suivi via `GET /admin/sync/status`.
- Exécution unique : verrou distribué Redis `sync:lock` (`SET NX PX`, libération compare-and-delete par token) + flag `running` local.

## Catalogue

- `CatalogService` charge l'intégralité des formations publiées depuis Directus en mémoire (limité au cache Redis `formations:all`), puis applique filtres, tri et pagination côté API.
- Endpoints publics : `GET /courses`, `GET /courses/:family/:slug`, `GET /families`.
- `POST /admin/families/apply` synchronise la relation `famille` entre Directus et les formations.

## Recherche assistée (IA)

- `POST /assistant/message` (`AssistantModule`) : tour de conversation. DTO `AssistantRequestDto` (message, historique ≤ 20, contexte d'entrée).
- Le modèle est appelé via le SDK `openai` (`AssistantModelClient`, endpoint compatible OpenAI — OpenRouter par défaut : `ASSISTANT_BASE_URL`, `ASSISTANT_API_KEY`, modèle `ASSISTANT_MODEL`, défaut gratuit dev `nvidia/nemotron-3-super-120b-a12b:free`, prod `anthropic/claude-haiku-4.5`). Sans clé ou en cas d'erreur provider, `AssistantService` lève un `503`.
- Le LLM répond en JSON, re-validé Zod, et ne décide que des `slug` + justifications : titres, attributs et disponibilités sont **re-résolus** depuis `CatalogService.allCourses()` — jamais repris de la sortie LLM (anti-hallucination). `toRecommendation()` / `buildAvailability()` (`assistant.service.ts`) portent ce grounding, partagé avec le repli déterministe.
- **Mode dégradé** (`DegradedModeService.answer()`, appelé par le contrôleur) : la décision du modèle dispose de `ASSISTANT_AI_TIMEOUT_MS` (30 s) ; erreur, délai dépassé ou clé absente → `FallbackRecommendationService` répond à sa place dans le même contrat `AssistantReply`, avec `mode: 'fallback'` (`'ai'` sinon). Le front ne reçoit un `503` (état « indisponible ») que si le catalogue lui-même est inaccessible.
- **Repli déterministe** (`fallback/`) : recherche `RetrievalService` sur le besoin agrégé (2 derniers tours du visiteur + message courant), sans modèle. Les formations données près de `context.location` priment ; sans candidat solide sur place, tout le catalogue est parcouru. La fiche d'origine (`context.formationSlug`) n'est jamais recommandée. Les justifications citent les mots du visiteur tels que saisis (jamais les termes racinisés de l'index) sans attribuer de champ, et chaque alternative énonce une différence réelle avec la principale lue dans le catalogue (domaine, modalité, certification). Issue : `recommend` (1 principale + ≤ 2 alternatives), `no_results` (candidat trop faible) ou `out_of_catalog` (aucun signal) — wording exact de la spec (§13, §17, §18).
- **Garde-fous wording** (`guardrails/wording.guardrails.ts`), appliqués à toute réponse, IA ou repli : `sanitizeJustification()` réécrit les formulations assertives au conditionnel (« est adaptée » → « semble adaptée »), neutralise les promesses réglementaires (« garantit », « vous serez certifié », « conforme à la réglementation ») et de résultat au futur (« vous obtiendrez » → « vous pourriez obtenir »), limite à 2 phrases ; une justification vide reçoit un texte de secours conditionnel ; `applyWordingGuardrails()` dédoublonne, plafonne à 1 principale + 2 alternatives et garantit une principale ; `guardReply()` ajoute la mention de source (`source`, RG-IA-01) et la transparence « assistant automatisé » (`notice`).
- Les impasses (`no_results`, `out_of_catalog`) sont journalisées via `SearchMissesService` (`source: 'assistant'`, `intent` = facettes détectées par le modèle, `context.mode`).
- Throttler dédié : 20 req/min/IP sur `/assistant/*`, hors quota public.

## Recherches sans résultat (`src/search-misses`)

- Journal des requêtes sans correspondance — « aucun résultat » (catalogue) et « hors catalogue » (moteur IA) — stocké dans la collection Directus `recherches_sans_resultat` via `DirectusItemsClient` (client REST générique `/items/*`, `src/directus`). Distinct des events analytics : on conserve le **contenu** de la requête pour la revue produit.
- Capture : `SearchMissesService.record()` — jamais bloquant, jamais d'exception. `CatalogService.list()` l'appelle quand une recherche textuelle (`search`) renvoie 0 résultat ; la recherche assistée l'appelle avec `source: 'assistant'` et l'intention détectée (`DegradedModeService`).
- RGPD : e-mail, téléphone, SIRET, IBAN, adresses postales et longues suites de chiffres masqués (`scrubPersonalData`, `src/common/utils/pii.util.ts`) ; localisation « autour de moi » arrondie à ~10 km ; texte tronqué à 500 caractères ; doublons ignorés pendant 60 s ; purge des entrées de plus de `SEARCH_MISS_RETENTION_DAYS` jours (`0` désactive), déclenchée chaque nuit par le workflow GitHub `search-misses-purge.yml` → `POST /admin/search-misses/purge` (pas de cron in-process : serverless). **Limite assumée** : un nom ou une donnée personnelle sans motif reconnaissable n'est pas détecté — le texte journalisé est une donnée à accès restreint (rôles Directus internes, endpoints admin sous `x-api-key`, export réservé à la revue produit), jamais exposée au public ni réutilisée hors de cette revue.
- Endpoints admin (clé `x-api-key`) : `GET /admin/search-misses` (liste paginée), `GET /admin/search-misses/aggregate` (regroupement par requête normalisée), `GET /admin/search-misses/export` (CSV UTF-8 BOM, séparateur `;`), `POST /admin/search-misses/purge`.
- La collection n'est jamais lisible publiquement ; elle est hors du flow Directus d'invalidation de cache.

## Retrieval catalogue — moteur IA (`src/retrieval`)

- Couche de recherche sur les **formations publiées uniquement** (`CatalogService.allCourses()`, mêmes rows que le catalogue public) qui alimente le grounding IA (BACKEND-B) et le fallback déterministe (BACKEND-C). Contrat interne : `RetrievalService.search({ text, limit, family, modalities, location })` → `RetrievalResult` (candidats triés avec `score` fusionné, `lexicalScore` BM25, `semanticScore` cosinus, `matchedTerms`, `coverage`, `confident`). Les seuils métier (« aucun résultat », « hors catalogue ») restent la décision du consommateur. Le filtre `location` applique la règle du catalogue public (`matchesLocation` : tous les jetons dans la même session, CP / département par préfixe, rayon autour d'un point).
- `CatalogIndexService` : index en mémoire (termes pondérés par champ — intitulé ×3, classification / certification ×2 —, vecteur par formation). Reconstruit à la demande quand le cache catalogue est invalidé (`CacheService.onCatalogInvalidated`, déclenché par la sync Digiforma et les purges Directus), après 15 min, ou via `POST /admin/retrieval/reindex`. Une invalidation reçue pendant une construction déclenche la suivante ; un catalogue vide n'est jamais figé. En multi-instances (Vercel), `CacheService.syncInvalidations()` (compteur Redis `catalog:generation`, consulté au plus toutes les 30 s) rattrape les purges faites par une autre instance.
- Embeddings : port `EmbeddingsProvider` (`EMBEDDINGS_PROVIDER` token). `HashingEmbeddingsProvider` = repli local sans clé (n-grammes hachés, similarité lexicale approchée, tolérant aux fautes) ; `HttpEmbeddingsProvider` = API au format OpenAI (`EMBEDDINGS_API_URL/KEY/MODEL`, fournisseur à confirmer), réponses validées (vecteurs numériques, non vides, de même dimension). Si le provider distant échoue à l'indexation, repli local et `degraded: true` dans le statut ; s'il échoue seulement sur une requête, la recherche continue en lexical seul.
- Expansions métier de la requête (`retrieval.synonyms.ts` : secourisme → sst, chariot → caces…) et bruit ignoré (« formation », « salariés »…). Texte partagé : `common/utils/text.util.ts` (normalisation, tokens, mots vides, racinisation légère) — aussi utilisé par la recherche du catalogue.
- Endpoints admin (clé `x-api-key`) : `GET /admin/retrieval/status`, `POST /admin/retrieval/reindex`, `GET /admin/retrieval/search?q=&limit=&family=&modalities=&location=` (jeu de requêtes de pertinence).

## Pas de TDD explicite

Les tests ne sont pas forcément écrits avant le code, mais chaque fonctionnalité livrée est couverte. Préférer écrire le test en même temps que l'implémentation.
