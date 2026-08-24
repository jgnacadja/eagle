# EAGLE

[![CI](https://github.com/jgnacadja/taskflow/actions/workflows/ci.yml/badge.svg)](https://github.com/jgnacadja/taskflow/actions/workflows/ci.yml)

Monorepo **pnpm + Turborepo** — backend **NestJS**, frontend **Nuxt 3**, base **PostgreSQL** (Prisma).

---

## Lancement rapide

```bash
git clone https://github.com/jgnacadja/taskflow.git
cp .env.example .env
docker compose up --build
```

Trois services démarrent automatiquement :

| Service    | URL                   | Rôle                                        |
| ---------- | --------------------- | ------------------------------------------- |
| `postgres` | —                     | PostgreSQL 16 avec healthcheck              |
| `backend`  | http://localhost:3001 | NestJS — migration Prisma appliquée au boot |
| `web`      | http://localhost:3000 | Nuxt 3                                      |

Points d'entrée supplémentaires : `http://localhost:3001/health` · `http://localhost:3001/docs` (Swagger).

> **Sans Docker** — nécessite un PostgreSQL local, puis :
>
> ```bash
> pnpm install
> cp .env.example .env          # adapter DATABASE_URL sur localhost:5432
> pnpm --filter @taskflow/backend prisma:migrate
> pnpm dev                       # back + front via Turbo
> ```

---

## Architecture

### Backend — `apps/backend/src/`

Organisation par domaine fonctionnel. Chaque module suit la même découpe :

```
src/
  auth/         register, login, refresh, logout — JWT access + refresh
  users/        entité User, accès par id/email
  lists/        CRUD listes — propriétaire vérifié à chaque opération
  tasks/        CRUD tâches — ownership via List → User
  gateway/      WebSocket — rooms list:{listId}, écoute EventEmitter2
  common/       filtre HttpException, constantes Prisma (codes P2002, P2003, P2025)
  prisma/       PrismaService (onModuleInit / onModuleDestroy)
  config/       ConfigModule NestJS
  health/       GET /health → { status: "ok" }
```

Chaque module expose : `controller` → `service` → (Prisma ou autre service).  
Aucune logique métier dans les controllers ; aucun accès Prisma direct dans les controllers.

### Frontend — `apps/web/`

```
pages/          index.vue (app principale), login.vue, register.vue
components/     TaskCard, TaskDetail, TaskForm, LeftSidebar, ConfirmModal, AppBrand
stores/         auth.ts, lists.ts, tasks.ts  (Pinia)
composables/    useTaskSocket.ts, useAuthSubmit.ts
plugins/        api.ts ($api — $fetch + Bearer), auth.client.ts (refresh au mount), socket.client.ts
middleware/     auth.global.ts — redirige vers /login si non authentifié
utils/          date.ts — formatDate partagé
layouts/        auth.vue
e2e/            Playwright — auth, lists, tasks, realtime
test/           Vitest + @vue/test-utils — composants
```

### Schéma de données

```
User  1 ──< List  1 ──< Task
```

- `Task` n'a **pas** de `userId` direct — l'ownership remonte via `Task → List → User`.
- Toutes les suppressions sont en **cascade** (List supprimée → Tasks supprimées).
- `completedAt` (`DateTime?`) remplace un éventuel booléen `isCompleted` : `null` = tâche active, valeur = tâche terminée. Source de vérité unique, pas de désynchronisation possible.

---

## Choix techniques justifiés

### Nuxt 3 vs SPA Vue

Nuxt apporte trois avantages déterminants pour ce projet : le **middleware de route natif** (auth.global.ts gère la protection de toutes les pages sans configuration supplémentaire), les **auto-imports** (composables, composants, utils) qui réduisent le boilerplate, et une **structure opinionnée** qui normalise l'arborescence dès le départ. Une SPA Vue pure aurait nécessité Vue Router + un plugin d'auth manuel.

### Pinia vs Vuex

Pinia est le gestionnaire d'état officiel de Vue 3 et est natif à Nuxt 3 via `@pinia/nuxt`. Son API Composition (fonctions au lieu d'options) est cohérente avec `<script setup>`, TypeScript y est first-class sans boilerplate de typage supplémentaire, et le bundle est plus léger que Vuex.

### Prisma vs TypeORM

Prisma génère un client TypeScript entièrement typé depuis un schéma déclaratif (`schema.prisma`). Les migrations sont auto-générées (`prisma migrate dev`), le DX est supérieur (autocomplétion sur toutes les requêtes, erreurs détectées à la compilation). TypeORM impose davantage de décorateurs et présente des comportements moins prévisibles sur les relations complexes.

### WebSocket — Socket.io + EventEmitter2

La Gateway NestJS (`@WebSocketGateway`) gère les rooms `list:{listId}` : chaque client rejoint la room de la liste sélectionnée via `join-list`. Les événements temps réel (`task:created`, `task:updated`, `task:deleted`) sont émis par les services via **EventEmitter2**, ce qui découple complètement la couche HTTP de la couche WebSocket — le service ne sait pas qu'il existe un Gateway.

### Mentions — CRUD listes en HTTP

## Les opérations sur les listes (créer, lister, supprimer) passent par HTTP classique. Seuls les événements `task:*` sont diffusés en temps réel via WebSocket parce que les listes changent peu fréquemment. Selon les specs, toute modification sur une liste (création, mise à jour, suppression ou changement de statut d'une tâche) doit être propagée en temps réel à tous les onglets et clients connectés sur cette même liste, sans rechargement de page.

## Sécurité

### Tokens JWT

| Token         | Durée  | Transport              | Stockage côté client |
| ------------- | ------ | ---------------------- | -------------------- |
| Access token  | 15 min | Header `Authorization` | Pinia (mémoire)      |
| Refresh token | 7 j    | Cookie `httpOnly`      | Cookie navigateur    |

- Les tokens ne sont **jamais** écrits dans `localStorage` ni via `pinia-plugin-persistedstate` — surface d'attaque XSS nulle.
- Le cookie refresh est `httpOnly; SameSite=Strict; Secure` (en production) — inaccessible au JavaScript.
- À chaque refresh, un nouveau access token est émis ; le cookie refresh est renouvelé.
- Le plugin `auth.client.ts` appelle `/auth/refresh` au mount pour restaurer la session après un rechargement de page.

### Isolation des données

L'ownership est systématiquement vérifié via la chaîne `Task → List → User.id`. Aucune tâche n'expose de `userId` direct — toute vérification passe par `task.list.userId`. Le helper privé `findTaskAndAssertOwner` centralise ce garde dans `TasksService` (supprime la duplication sur `complete`, `reactivate`, `findOne`, `remove`).

### CSRF

Couvert par `SameSite=Strict` : le cookie refresh n'est envoyé que sur des requêtes de même origine. Nuxt envoie ses requêtes avec `credentials: 'include'` — le navigateur gère l'envoi du cookie automatiquement.

### WebSocket

Le JWT est vérifié **au handshake** dans `handleConnection` de la Gateway. Toute connexion sans token valide est immédiatement déconnectée (`client.disconnect(true)`). Aucun événement socket n'est traité depuis une connexion non authentifiée.

---

## CI/CD

Deux jobs distincts, segmentés par coût d'exécution :

| Déclencheur          | `unit-and-lint` | `e2e` |
| -------------------- | :-------------: | :---: |
| Push sur `feature/*` |       ✅        |   —   |
| PR → `main`          |       ✅        |   —   |
| Push sur `main`      |       ✅        |  ✅   |

- **`unit-and-lint`** — lint ESLint (back + front) + tests Vitest avec coverage v8. Tourne sur toutes les branches pour un feedback rapide (< 2 min).
- **`e2e`** — déclenché uniquement sur `main` (post-merge). Démarre la stack Docker complète, attend les healthchecks, lance Playwright en mode headless. Tourne en parallèle de `unit-and-lint`.

> **Prérequis Playwright** : `pnpm --filter @taskflow/web exec playwright install chromium`

---

## Scripts (racine, via Turborepo)

| Script               | Effet                                 |
| -------------------- | ------------------------------------- |
| `pnpm dev`           | Démarre backend + frontend en watch   |
| `pnpm build`         | Build les deux apps                   |
| `pnpm lint`          | ESLint sur back + front               |
| `pnpm format`        | Prettier `--write` sur tout le repo   |
| `pnpm test`          | Tests unitaires Vitest (back + front) |
| `pnpm test:coverage` | Tests unitaires + couverture v8       |
| `pnpm test:e2e`      | Tests Playwright E2E (frontend)       |

---

## Features

- **Rate limiting** sur les endpoints auth (`/auth/login`, `/auth/register`) — prévention brute-force.
- **Pagination** sur les listes de tâches — la requête `findMany` sans limit peut devenir un problème à l'échelle.
- **Refresh token rotation avec blacklist** (Redis) — permettrait l'invalidation explicite d'un refresh token compromis, ce que `SameSite=Strict` seul ne garantit pas.
- **Tests de charge sur le WebSocket Gateway** — vérifier la tenue sous connexions concurrentes et la cohérence des rooms sous pression.
- **Tests fonctionnels supplémentaires**
- Parcours temps réel multi-onglets (P4) stabilisé avec `waitForEvent` Playwright plutôt que des timeouts fixes.
- Cas limites : token expiré pendant une opération WebSocket en cours, reconnexion automatique du socket après coupure réseau.

**Régressions visuelles — `toHaveScreenshot` Playwright**

États clés à capturer en snapshot de référence :

- Layout 3 colonnes (sidebar ouverte / sidebar rétractée)
- Empty state — aucune liste sélectionnée
- Main content avec tâches actives + section « terminées » dépliée
- Right sidebar ouverte sur le détail d'une tâche
- Modales de confirmation (suppression liste / suppression tâche)
- Formulaire avec erreurs de validation affichées
- Pages login / register (responsive)

Stratégie : snapshots de référence générés sur `main`, comparaison automatique sur chaque PR via `--update-snapshots` sur approbation.
