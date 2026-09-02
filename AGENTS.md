## Avant de coder

1. Lire ce fichier, puis `apps/api/AGENTS.md` ou `apps/front/AGENTS.md` si le fichier modifié appartient à l'une de ces apps.
2. Explorer le code existant avant de changer quoi que ce soit.
3. Poser une question si la demande est ambiguë.
4. Ne jamais pousser sans permission explicite.

## Consignes générales

- **Pense avant d'agir** : décompose le travail en étapes visibles, valide chaque étape.
- **Explore d'abord** : lis `package.json`, la structure, les fichiers voisins avant d'écrire.
- **Utilise les outils agent** : skills `.agents/skills/` et MCP serveurs `.mcp.json` s'ils sont disponibles.
- **Pas de secret dans le repo** : tokens, mots de passe, clés API uniquement dans `.env` (non versionné) et `.env.example` (placeholders).
- **Préfère éditer** : ne crée un fichier que s'il n'existe pas ou si c'est explicitement demandé.
- **Vérifie systématiquement** : `pnpm lint`, `pnpm test`, `pnpm build` selon le périmètre modifié.
- **Pas de `console.*`** dans le code, sauf dans `apps/front/app/utils/logger.ts` et `directus/logger.mjs`.
- **Respecte la stack** : TypeScript strict, Conventional Commits, branches `feat/{ticket-id}-{slug}`, tokens `@learnup/ui`.

## Vue d'ensemble

- **Stack** : pnpm + Turborepo, NestJS 11 (`apps/api`), Nuxt 4 (`apps/front`), Directus (`directus/`), PostgreSQL 16, Redis 7.
- **Packages partagés** : `@learnup/types` (`packages/types/`), `@learnup/ui` (`packages/ui/`).
- **Objectif du sprint 2** : parcours catalogue formations (sync Digiforma → API → front + SEO).

## Commandes essentielles

Toutes les commandes se lancent depuis la racine, sauf mention contraire :

| Commande                    | Effet                                                               |
| --------------------------- | ------------------------------------------------------------------- |
| `pnpm dev`                  | Lance API + front en watch (Turborepo démarre les packages d'abord) |
| `pnpm dev:api`              | Lance uniquement `apps/api`                                         |
| `pnpm dev:front`            | Lance uniquement `apps/front`                                       |
| `pnpm build`                | Build l'ensemble du monorepo                                        |
| `pnpm lint`                 | ESLint sur tout le repo                                             |
| `pnpm format`               | Prettier `--write` sur tout le repo                                 |
| `pnpm test`                 | Tests Vitest unitaires                                              |
| `pnpm test:coverage`        | Tests + couverture v8                                               |
| `pnpm test:e2e`             | Tests Playwright (front)                                            |
| `pnpm directus:build`       | Build le schéma Directus (`directus/schema/build.mjs`)              |
| `pnpm seed`                 | Seed idempotent des données de démo                                 |
| `docker compose up --build` | Stack complète (Postgres, Redis, MinIO, Directus, API, Front)       |

## Structure du monorepo

```
apps/
  api/            NestJS 11 — API catalogue
  front/          Nuxt 4 SSR — app/ (composables, pages, components, layouts)
packages/
  types/          Types TypeScript partagés
  ui/             Design system token-driven
directus/
  schema/         Schéma, collections, rôles versionnés
  seed/           Données de démo
```

## Conventions communes

- **TypeScript strict** : `tsconfig.base.json` impose `strict: true`. Pas de `any` sans justification.
- **Conventional Commits** : `type(scope): summary`. Scopes usuels : `api`, `front`, `config`, `directus`, `deps`.
- **Branches** : `feat/{ticket-id}-{slug}`, `fix/{ticket-id}-{slug}`, `chore/{ticket-id}-{slug}`. Base `main`.
- **Valeurs de style** : jamais en dur. Importer `@learnup/ui` et utiliser les tokens CSS (`--color-*`, etc.) ou les classes Tailwind (`text-ink`, `bg-paper`, etc.).
- **Secrets** : **jamais** dans le repo. Uniquement dans `.env` (non versionné) et `.env.example` (valeurs de dev). Variables sensibles dans `docker-compose.yml` : utiliser `${VAR:-default}`.
- **Logging** : pas de `console.*` dans le code, sauf dans `apps/front/app/utils/logger.ts` et `directus/logger.mjs` (explicitement exemptés par ESLint).
- **Tests systématiques** : chaque module a sa couverture. Vitest + Supertest (API), Vitest + `@vue/test-utils` (front). Mocks Prisma/Redis/Digiforma en dev si pas de clé.

## Règles de revue bloquantes

Un reviewer peut exiger un fix si :

1. Valeur de style écrite en dur (`#fff`, `px` arbitraire, etc.).
2. Secret ou token présent dans le code.
3. `console.*` hors fichiers autorisés.
4. Manque de tests sur un module modifié ou ajouté.
5. Pas de DTO `class-validator` sur une route API.
6. `any` non justifié.
7. Import circulaire ou fuite d'abstraction entre `apps/`.

## Configuration agent

### Workspace VS Code

- Fichier `eagle.code-workspace` : workspace multi-root.
- `.vscode/settings.json`, `.vscode/extensions.json`, `.vscode/tasks.json`, `.vscode/launch.json` : configuration partagée.

### Skills partagées

Les skills du repo sont dans `.agents/skills/` (format Agent Skills) :

- `nestjs-stack`
- `nuxt-frontend`
- `digiforma-sync`
- `monorepo-vscode`
- `learnup-conventions`

Des skills publics peuvent être installés avec `npx skills add` :

- `onmax/nuxt-skills`
- `amirtaherkhani/nestjs-agent-skills`
- `prisma/skills`
- `wshobson/agents` (`monorepo-management`)
- `antfu/skills` (`vitest`)
- `netresearch/git-workflow-skill`

### MCP serveurs

Les serveurs sont partagés sans secret (les clés sont interpolées depuis `.env`) :

- lire `.mcp.json` à la racine.

Serveurs configurés :

- `nuxt`, `context7` — documentation à jour.
- `directus` — contenu Directus (via `@directus/content-mcp`).
- `postgres`, `redis` — inspection DB/cache (lecture seule).
- `github`, `sonarqube`, `filesystem` — repo, qualité, fichiers locaux.
- `fetch`, `docker`, `vercel` — optionnels, désactivés par défaut.

## Tickets

Les tickets du sprint 2 sont dans ClickUp (liste `901220536096`). Lier chaque PR à son ticket et remplir le template PR.

## Points de vigilance

- **Digiforma** : API GraphQL sur `https://app.digiforma.com/api/v1/graphql`, auth Bearer. Aucun webhook natif connu : on poll toutes les 1 h.
- **Bases de données** : Postgres partagé avec Directus via la DB `learnup` (même instance, schémas/logique applicative distincts).
- **Cache** : Redis utilisé par Directus et par l'API (clés versionnées `catalog:v{n}:…`).
