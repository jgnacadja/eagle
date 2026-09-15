---
name: monorepo-vscode
description: Workspace VS Code du monorepo EAGLE. Utiliser pour configurer le multi-root, les tâches, le debug et les extensions.
license: MIT
metadata:
  author: learnup
  version: '1.0.0'
  domain: tooling
  triggers: vscode, workspace, monorepo, tasks, debug, launch, settings, extensions, turbo
---

# Monorepo VS Code — EAGLE

## Fichiers

- `eagle.code-workspace` : workspace multi-root (`apps/api`, `apps/front`, `packages/types`, `packages/ui`, `directus`).
- `.vscode/settings.json` : formatage, ESLint, exclusions.
- `.vscode/extensions.json` : extensions recommandées.
- `.vscode/tasks.json` : tâches rapides.
- `.vscode/launch.json` : debug API NestJS et front Nuxt.

## Conventions

- `editor.formatOnSave` activé.
- `editor.defaultFormatter` : Prettier.
- `eslint.workingDirectories` : racine du workspace.
- Exclusions : `**/node_modules`, `**/.nuxt`, `**/.output`, `**/dist`, `**/coverage`.

## Tâches attendues

- `pnpm dev`
- `pnpm dev:api`
- `pnpm dev:front`
- `pnpm lint`
- `pnpm test`
- `pnpm test:e2e`
- `docker compose up`
- `pnpm seed`
- `pnpm directus:build`

## Debug

- NestJS : attacher au port 9229. Lancer la tâche `pnpm dev:api:debug` (ou `pnpm --filter @learnup/api dev:debug`) avant d'attacher.
- Nuxt : launch Chrome/Edge contre `http://localhost:3000`.
