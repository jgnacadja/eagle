# LEARN UP ACADEMY

[![CI](https://github.com/jgnacadja/eagle/actions/workflows/ci.yml/badge.svg)](https://github.com/jgnacadja/eagle/actions/workflows/ci.yml)

Monorepo **pnpm + Turborepo** du site LEARN UP ACADEMY — API **NestJS**,
front **Nuxt 4** (SSR), back-office **Directus**, base **PostgreSQL**.

> Ce dépôt est au stade socle technique (Sprint 1, Lot 2). La logique métier
> (gabarits, collections Directus, contenu) arrive au fil des tickets
> suivants — voir la liste ClickUp du sprint pour l'état d'avancement.

---

## Lancement rapide

```bash
git clone https://github.com/jgnacadja/eagle.git
cd eagle
cp .env.example .env
pnpm install
pnpm dev
```

| App               | URL                   | Rôle                              |
| ------------------ | --------------------- | ---------------------------------- |
| `apps/api`         | http://localhost:3001 | NestJS — squelette (`/health`, `/docs`) |
| `apps/front`       | http://localhost:3000 | Nuxt 4 SSR                         |

`pnpm dev` construit d'abord les packages partagés (`@learnup/ui`,
`@learnup/types`) avant de démarrer les apps — aucune étape manuelle
supplémentaire n'est nécessaire.

> **Avec Docker** — stack complète (API + front + PostgreSQL) :
>
> ```bash
> docker compose up --build
> ```
>
> L'environnement local complet (Redis, MinIO, Directus, seeds) est mis en
> place en ST-09.

Installation attendue en moins de 15 minutes pour un nouveau développeur.

---

## Structure du monorepo

```
apps/
  api/            NestJS — squelette (health check, config). Pas de logique
                  métier ce sprint : Directus porte le back-office en S1.
  front/          Nuxt 4 SSR — structure app/ (app.vue, pages/, components/)

packages/
  ui/             Design system token-driven (@learnup/ui) — voir son README :
                  les valeurs sont provisoires tant que la DA n'est pas validée
  types/          Types TypeScript partagés (@learnup/types)

directus/         Schema snapshots + config Directus versionnés (dès ST-11)
```

### Convention UI — zéro valeur de style en dur

Toute couleur, espacement, rayon, ombre ou police utilisé dans `apps/front`
doit venir de `@learnup/ui` (tokens TS ou `tokens.css`). C'est une règle de
revue bloquante : elle permet de re-skinner par simple mise à jour des tokens
une fois la direction artistique validée par LEARN UP PRIME.

---

## Scripts (racine, via Turborepo)

| Script                | Effet                                     |
| ---------------------- | ------------------------------------------ |
| `pnpm dev`             | Démarre api + front en watch (build des packages d'abord) |
| `pnpm build`           | Build tous les apps/packages                |
| `pnpm lint`            | ESLint sur tout le monorepo                 |
| `pnpm format`          | Prettier `--write` sur tout le repo         |
| `pnpm test`            | Tests unitaires Vitest                      |
| `pnpm test:coverage`   | Tests unitaires + couverture v8             |
| `pnpm test:e2e`        | Tests Playwright E2E (front)                |

---

## Conventions

- **Commits** — [Conventional Commits](https://www.conventionalcommits.org/),
  vérifiés localement par commitlint + husky (`commit-msg`).
- **Branches** — `develop` (intégration) et `main` (production), toutes deux
  protégées. Branches de travail : `{feat,fix,chore}/{ticket-id}-{slug}`.
- **PR/MR** — le template `.github/pull_request_template.md` s'applique
  automatiquement. `CODEOWNERS` route la revue.
- **TypeScript strict** partout (`tsconfig.base.json`).

---

## CI/CD

| Déclencheur          | `unit-and-lint` | `e2e` |
| --------------------- | :--------------: | :---: |
| Push sur toute branche |        ✅        |   —   |
| PR → `main`            |        ✅        |   —   |
| Push sur `main`        |        ✅        |  ✅   |

- **`unit-and-lint`** — lint ESLint + tests Vitest (coverage v8). Rapide,
  tourne sur toutes les branches.
- **`e2e`** — déclenché uniquement sur `main` (post-merge) : stack Docker
  complète + Playwright headless.

Le quality gate SonarQube (ST-10) n'est pas encore branché sur ce pipeline —
suivi séparément.

> **Prérequis Playwright** : `pnpm --filter @learnup/front exec playwright install chromium`
