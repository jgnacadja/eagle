---
name: digiforma-sync
description: Client et synchronisation GraphQL Digiforma pour apps/api. Utiliser pour interroger l'API Digiforma, mapper le type Program, gérer le polling et tracer les sync.
license: MIT
metadata:
  author: learnup
  version: '1.0.0'
  domain: backend
  triggers: digiforma, program, graphql, sync, polling, digiforma_id, mapping, formation, syncrun
---

# Digiforma sync — EAGLE

## Contexte

- API GraphQL : `POST https://app.digiforma.com/api/v1/graphql`
- Auth : Bearer token `process.env.DIGIFORMA_API_KEY`
- Pas de webhook natif connu. Polling toutes les 1 h via `@nestjs/schedule`.

## Points d'attention

- Vérifier que le compte client a activé l'accès API.
- En dev sans clé : utiliser une fixture JSON dans `test/fixtures/programs.json`.
- L'objectif n'est pas de dupliquer la logique métier de Digiforma, mais de récupérer et normaliser les programmes.

## Mapping Program → Formation

Champs utiles à mapper (ordre de priorité) :

1. `id` / `slug` / `title` / `description`
2. `durationInDays` / `durationInHours`
3. `price` (TTC) / `cpf` / `cpfCode`
4. `certificationType` / `certifierName`
5. `category` / `programCategory` → mapping famille (table de correspondance à valider)
6. `blocks` (objectifs/pédagogie, JSON)
7. `image` / `generatedProgramUrl`
8. `createdAt` / `updatedAt` / `status`

Si un champ n'est pas lisible ou ambigu, stocker le payload brut dans `raw` (JSON) et continuer.

## Sync

- Cron `@Cron(process.env.SYNC_CRON ?? '0 * * * *')` — déclaré à l'import du module ; la variable `SYNC_CRON` du `.env` n'est lue qu'à l'exécution. En dev, privilégier un `--env-file` ou exporter la variable avant le lancement.
- Upsert par `digiforma_id` unique.
- `SyncRun` : `started_at`, `finished_at`, `status`, `counts`, `error`.
- Invalidation cache catalogue en fin de sync réussie.
- Endpoint admin : `POST /admin/sync` (forcer), `GET /admin/sync/status`, protégés par `ADMIN_API_KEY`.

## Tests

- Mocks de `fetch` / `DigiformaClient`.
- Vérifier l'upsert idempotent et la gestion d'erreur (retry, timeout).
