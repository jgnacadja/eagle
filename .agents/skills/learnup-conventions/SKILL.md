---
name: learnup-conventions
description: Conventions transversales du projet EAGLE. Utiliser pour les commits, les branches, les PR, la sécurité, les tokens UI, la qualité et la collaboration.
license: MIT
metadata:
  author: learnup
  version: '1.0.0'
  domain: process
  triggers: conventional commits, branch, pr, review, security, tokens, secrets, sonar, quality
---

# Conventions LEARN UP — EAGLE

## Git

- Commits : Conventional Commits — `type(scope): summary`.
  - `type` : `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `ci`
  - `scope` : `api`, `front`, `config`, `directus`, `deps`, `ci`
- Branches : `feat/{ticket-id}-{slug}`, `fix/{ticket-id}-{slug}`, `chore/{ticket-id}-{slug}`.
- PR : remplir `.github/pull_request_template.md`, lier le ticket ClickUp.
- Outillage agents (`.agents/`, `AGENTS.md`, `.vscode/`, `.mcp.json`, `.husky/pre-push`, …) : gitignoré, versionné sur la branche orpheline `agents`. Après toute modif → `pnpm agents:push` (autorisé sans permission) ; doute → `pnpm agents:status`. Le hook `pre-push` restauré par `pnpm agents` auto-sync `origin/agents` à chaque `git push`. Script : cherry-pick local de `chore/869f9qxkf-agents-tooling`, jamais poussé.

## Sécurité

- Zéro secret dans le repo (mot de passe, token, clé API, JWT secret).
- `.env.example` peut contenir des placeholders évidents (`change-me-*`, `localhost`).
- Docker : variables sensibles via `${VAR:-default}` et `.env`.
- CORS, rate limit, validation input, helmet, erreurs génériques.

## UI / Tokens

- Toute valeur de style vient de `@learnup/ui` : couleurs, espacements, rayons, ombres, typographie.
- Classe Tailwind ou token CSS. Pas de `style=""`, pas de valeur brute.

## Qualité

- ESLint, Prettier, TypeScript strict.
- Tests systématiques, couverture Sonar.
- CI : `unit-and-lint` sur chaque push/PR, Sonar sur `main`.

## Règles de revue bloquantes

1. Valeur de style en dur.
2. Secret/token dans le code.
3. `console.*` hors fichiers autorisés.
4. Manque de tests sur un module modifié.
5. DTO/validation manquant.
6. `any` non justifié.
7. Import circulaire entre `apps/`.
