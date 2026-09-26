---
name: sonarqube
description: Qualité SonarQube locale (docker sonarqube-local, projet eagle). Utiliser pour lancer un scan, lire les métriques (couverture, duplication, issues, quality gate) et corriger les dettes de code sans régression.
license: MIT
metadata:
  author: learnup
  version: '1.0.0'
  domain: quality
  triggers: sonar, sonarqube, quality gate, coverage, couverture, duplication, code smell, dette, lcov, scan
---

# SonarQube — EAGLE

## Stack

- Serveur local : conteneur Docker `sonarqube-local` → `http://localhost:9000` (`docker start sonarqube-local` si arrêté).
- **Le conteneur n'est pas garanti** : il est installé manuellement par le dev. Vérifier avant tout scan — `docker ps | grep sonarqube-local` ou `curl -sf http://localhost:9000/api/system/status`. Si absent ou sans token, ne pas l'installer soi-même : appliquer les règles de qualité ci-dessous localement (tests, dedup, lint) et signaler que la vérification Sonar reste à faire (CI/SonarCloud ou dev avec le conteneur).
- Projet : key `eagle`, org `learnup`. Dashboard : `http://localhost:9000/dashboard?id=eagle`.
- Config d'analyse : `sonar-project.properties` à la racine (sources `apps/`, `packages/` ; exclusions specs, mocks, `.nuxt`, `dist`).
- LCOV attendus : `apps/front/coverage/lcov.info`, `apps/api/coverage/lcov.info`, `apps/presence/coverage/lcov.info`, `packages/ui/coverage/lcov.info`.
- Le dashboard SonarCloud (`sonarcloud.io`, org `learnup`) est **distinct** : il ne se met à jour que via la CI sur le repo distant ou un scan poussé avec un token cloud — un scan local ne le touche pas.

## Lancer un scan

Prérequis : le conteneur `sonarqube-local` doit tourner **et** un `SONAR_TOKEN` doit être fourni. L'un des deux manque → sauter le scan, ne pas bloquer la livraison : les vérifications locales (section « Vérifications avant de livrer ») couvrent l'essentiel.

```bash
# 1. Régénérer toutes les couvertures (produit les lcov.info)
pnpm test:coverage

# 2. Scanner — Java 21+ requis (le shim jenv peut être cassé : préfixer PATH)
SONAR_TOKEN=<token> \
  PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH \
  pnpm dlx sonar-scanner -Dsonar.host.url=http://localhost:9000 -Dsonar.token=$SONAR_TOKEN
```

- Token utilisateur : demandé à l'équipe (jamais commité). Le scan s'exécute en ~15 s.
- Après le scan, attendre le traitement : `GET /api/ce/task?id=<taskId>` → `status: SUCCESS` (l'URL est affichée dans les logs du scanner).

## Lire les métriques

```bash
curl -s -u "$SONAR_TOKEN:" \
  "http://localhost:9000/api/measures/component?component=eagle&metricKeys=coverage,line_coverage,branch_coverage,duplicated_lines_density,bugs,vulnerabilities,code_smells,new_coverage,alert_status"
```

Quality gate attendu : `alert_status = OK`, `new_coverage = 100` sur le code nouveau.

## Objectifs du repo

- **Couverture 100%** lignes + branches + fonctions sur `apps/api` et `apps/front` — déjà atteint, à conserver.
- **Duplication 0%** — extraire avant de dupliquer (voir Patterns ci-dessous).
- **0 issue** — corriger la cause, pas masquer.

## Corriger sans dette — règles de conduite

1. **Tests d'abord** : une branche non couverte se couvre par un test réel (fixture minimale, état d'erreur, interaction) avant tout autre choix.
2. **Code mort > exclusion** : si une garde est structurellement inatteignable, la **supprimer** (`if (x?.y)` → `x!.y`, garde `v-if` inutile, ternaire dont un bras est mort) plutôt que l'ignorer. Justifier l'invariant dans un commentaire court.
3. **`/* v8 ignore */` en dernier recours** uniquement pour : branches SSR (`import.meta.server`/`client` toujours faux sous happy-dom), `typeof window === 'undefined'`, config framework jamais exécutée sous test (callbacks ioredis, shims ESM/CJS gelés par Vitest). Toujours annoter la raison.
4. **`?.` → `!` seulement avec invariant vérifié** : un computed lazy lu sous `v-if="found"`/`v-if="item"` est sûr ; un getter évalué immédiatement (`useContentSeo`, `useHead`, `watchEffect`) ne l'est que si un `throw`/`return` précède. Vérifier le consommateur, pas seulement la définition.
5. **Ne pas élargir les exclusions** `sonar.coverage.exclusions` / `vitest.config.ts` pour cacher du code exécutable — réservé aux fichiers purement déclaratifs (DTO, types, modules Nest, re-exports).

## Patterns de déduplication déjà en place

- DTO leads : `LeadContactDto` (nom/email/telephone partagés) dans `apps/api/src/leads/leads.dto.ts`.
- Champs formulaires : `leadFields()` dans `apps/front/app/utils/leadFields.ts` — schémas zod communs, messages paramétrés.
- Consentement : `app/components/ConsentField.vue` — checkbox + erreur a11y, slot pour le texte légal.
- Mapping centres → carte : `toCenterResults()` dans `apps/front/app/utils/centre.ts`.
- Toute nouvelle duplication d'un bloc ≥ ~10 lignes entre fichiers → extraire dans `utils/`, `components/` ou un DTO de base.

## Vérifications avant de livrer

```bash
pnpm lint && pnpm test:coverage && pnpm build
```

Puis rescan Sonar et vérifier que le quality gate reste OK. Le scanner affiche l'URL du rapport de tâche (`/api/ce/task?id=...`).
