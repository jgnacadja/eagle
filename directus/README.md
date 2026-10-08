# directus/

Schema versionné et outillage pour l'instance Directus (back-office LEARN UP
ACADEMY).

## Contenu

- `schema/snapshot.yaml` — snapshot du schéma (collections, champs, relations),
  exporté via `directus schema snapshot`. À régénérer après chaque modification
  du schéma (voir Maintenance du snapshot ci-dessous).
- `schema/collections.mjs`, `schema/roles.mjs` — définitions source des
  collections et de la matrice de rôles/permissions, lisibles par un humain
  (le YAML du snapshot est dense et peu adapté à la revue).
- `schema/build.mjs` — script de construction : crée les collections/relations
  si absentes, puis les rôles, policies, permissions et les flows. Idempotent
  (sûr à ré-exécuter — vérifié sur plusieurs runs consécutifs). C'est le
  mécanisme de restauration automatique au démarrage.
- `schema/flows.mjs` — définition des flows « Invalidate site cache »,
  « Invalidate formation page » et « Geocode centre on address change » :
  webhooks sortants vers l'API (`/admin/cache/invalidate`,
  `/admin/centres/geocode`) et le front (`/api/cache/invalidate`, purge ISR).
  Une opération `condition` en tête de chaîne des flows d'invalidation ignore
  les écritures du compte de service `DIRECTUS_TOKEN` (la sync purge le
  catalogue elle-même) — l'id est résolu via `/users/me` au build.
  URLs et secrets **jamais cuits dans la config du flow** : les opérations
  référencent `{{ $env.API_INTERNAL_URL }}`, `{{ $env.FRONT_INTERNAL_URL }}`,
  `{{ $env.ADMIN_API_KEY }}`, `{{ $env.NUXT_CACHE_PURGE_SECRET }}`, résolus à
  l'exécution depuis l'env du container Directus. L'instance doit donc porter
  `FLOWS_ENV_ALLOW_LIST=API_INTERNAL_URL,FRONT_INTERNAL_URL,ADMIN_API_KEY,NUXT_CACHE_PURGE_SECRET`
  - ces 4 variables (posées sur le service `directus` de docker-compose.yml ;
    à déclarer aussi sur tout hébergement externe, ex. staging). En dev,
    Directus tourne dans Docker alors qu'API/front tournent sur l'hôte :
    `host.docker.internal` est le bon hôte (et reste valide en full-compose
    via les ports publiés).
- `seed/` — script de seed de contenu de démonstration (voir sa propre section
  dans le README racine).

## Multi-sources (Digiforma + HubSpot par franchise)

- Collection `sources` : une ligne par compte Digiforma (nom, `code` unique,
  `is_hq`, `status` active/inactive, URL + clé API Digiforma, portail HubSpot,
  5 GUIDs de formulaires, `hubspot_token` optionnel, `last_sync_*`). Les clés
  (`digiforma_api_key`, `hubspot_token`) sont masquées dans l'admin et lisibles
  par le seul rôle `admin` (+ Administrator natif et compte de service) ; les
  autres rôles internes ne lisent que `id, name, code, is_hq, status`. Le
  chiffrement à l'enregistrement arrive avec le hook `sources-encrypt`.
- `centres.source` (M2O nullable, vide = HQ), `formations.source` (M2O NOT NULL)
  et `formations.archived_by_source` (booléen).
- **Migration** (`build.mjs`, idempotent) : crée la source `hq` depuis l'env
  (`DIGIFORMA_API_URL`, `HUBSPOT_PORTAL_ID`, `HUBSPOT_FORM_*` — jamais la clé
  API, à saisir dans l'admin ; vide = repli env), rattache les formations
  existantes à la HQ, puis passe `formations.source` en NOT NULL avec la HQ pour
  valeur par défaut (la sync actuelle, qui n'envoie pas `source`, reste valide).
- **Index** (`schema/indexes.mjs`, lancé par `directus-init` après `build.mjs`) :
  unique `(source, digiforma_id)` à la place de l'unique `digiforma_id`, et une
  seule source HQ (index unique partiel). Retour arrière :
  `node --env-file=.env directus/schema/indexes.mjs down` (échoue s'il existe
  des doublons `digiforma_id` entre sources). Hors Docker : `pnpm directus:indexes`
  avec `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` dans `.env`.
- `pnpm test:directus` couvre la migration, les index (knex simulé) et les
  permissions.

## Modèle de rôles (Directus 11)

Directus 11 sépare le rôle de ses permissions : `role` → `directus_access` →
`policy` → `permissions`. Une policy par rôle ici — c'est le mapping le plus
simple pour ce cas d'usage, mais ce n'est pas obligatoire (une policy peut
être partagée entre plusieurs rôles).

| Rôle                                                 | Périmètre                                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Administrator** (natif Directus)                   | Super-admin, accès total, bypass complet.                                                                                |
| **admin**                                            | CRUD complet sur tout le contenu (centres, familles, articles, pages, blocs, stats, médiathèque).                        |
| **editeur**                                          | Crée/édite articles et blocs de contenu (brouillon). Lecture seule sur centres/familles/pages/stats. Pas de suppression. |
| **moderateur**                                       | Lecture + édition sur articles et blocs (relecture, publication). Lecture seule ailleurs. Ni création ni suppression.    |
| **lecteur**                                          | Lecture seule sur tout, aucune écriture.                                                                                 |
| **Public** (natif Directus, visiteurs non connectés) | Lecture seule, uniquement le contenu `status: published`.                                                                |

Matrice vérifiée empiriquement (utilisateurs de test créés/testés/supprimés) :
lecture toujours OK pour les 4 rôles internes, écriture/suppression refusées
(403) hors du périmètre accordé à chacun.

**Public n'est pas un rôle classique** — Directus le représente par une ligne
`directus_access` où `role` et `user` valent tous les deux `null`, pas par une
entrée dans `directus_roles`. Sans permissions dessus, un visiteur du site
(donc non authentifié) reçoit un 403 sur toute lecture — c'est ce qui a été
découvert en branchant le front (ST-12) : le manque avait échappé à la revue
initiale de ST-11, qui n'avait modélisé que les rôles internes.

## Recherches sans résultat

La collection `recherches_sans_resultat` n'est pas une collection éditoriale :
elle est alimentée par l'API (`apps/api/src/search-misses`) à chaque recherche
sans correspondance — catalogue « aucun résultat », moteur IA « hors
catalogue ». Elle sert à la revue produit (formations manquantes récurrentes,
boucle corpus / prompt du moteur IA) : consultation dans l'admin, case
« Traité » pour le suivi, export agrégé via `GET /admin/search-misses/export`.

Données personnelles : l'API masque les identifiants reconnaissables (e-mail,
téléphone, SIRET, IBAN, adresse postale) avant enregistrement, mais le texte
libre peut encore contenir ce que le visiteur a saisi (un nom, par exemple).
La collection est donc une donnée à accès restreint — rôles internes
uniquement, jamais publique — purgée automatiquement après
`SEARCH_MISS_RETENTION_DAYS` jours, et l'export ne sert qu'à la revue produit.

- Jamais lisible publiquement ; lecture pour tous les rôles internes,
  `moderateur` peut cocher « Traité », `admin` peut supprimer.
- Hors du flow « Invalidate site cache » (`schema/flows.mjs`) : une écriture
  ne touche aucune page publique.
- RGPD : texte nettoyé des données personnelles avant enregistrement, aucun
  identifiant visiteur, purge automatique après `SEARCH_MISS_RETENTION_DAYS`
  jours (`.env`, 180 par défaut).

## Déploiement

Le schéma (collections, champs, relations, rôles, policies, permissions) est
appliqué automatiquement au démarrage par le service `directus-init`.

```bash
docker compose up -d
```

L'API et le front attendent que `directus-init` ait terminé avant de démarrer.

### Données de démonstration

Le contenu de démo (`centres`, `familles_formation`, `articles`) est injecté
via un service à part, désactivé par défaut pour ne pas écraser de la vraie
donnée en recette/prod :

```bash
docker compose --profile seed up -d directus-seed
```

### Attention aux données réelles

`docker compose down -v` détruit **définitivement** le volume `pgdata` et donc
tout le contenu saisi dans Directus. Pour un redéploiement, utiliser
`docker compose down` **sans** `-v`, ou prévoir une restauration PostgreSQL.

## Maintenance du snapshot

Après toute modification de `schema/collections.mjs` ou `schema/roles.mjs`,
reconstruire le schéma puis régénérer `snapshot.yaml` :

```bash
docker compose up -d
# attendre que directus-init ait terminé (docker compose ps)
pnpm directus:snapshot
```

Puis commiter `directus/schema/snapshot.yaml`.

## Journal d'audit

Natif à Directus (`directus_activity`), aucune configuration nécessaire.
Vérifié sur une modification réelle (changement du statut Qualiopi d'un
centre) : action, collection, item, horodatage et auteur correctement
enregistrés.

## Médiathèque

Pas de collection dédiée : la bibliothèque de fichiers native de Directus
(`directus_files`) sert de médiathèque. Directus sait resservir n'importe quel
asset en WebP à la volée via l'API de transformation d'images
(`?format=webp`) — pas besoin d'imposer WebP à l'upload.

## SEO

Chaque collection porteuse de page (`centres`, `familles_formation`,
`articles`, `pages`) a ses propres champs `seo_title` / `seo_description` /
`seo_canonical`. Structure posée maintenant ; les valeurs et règles précises
(matrice d'intentions, anti-duplication, données structurées) viennent du
livrable ST-06 et seront saisies dans ces mêmes champs, sans changement de
schéma attendu.

## Point d'attention — "formations"

ST-11 ne définit pas de collection `formations` dédiée (seules `centres`,
`familles_formation`, `articles`, `pages`/`page_blocks`, `stats` sont dans son
périmètre explicite) : les formations individuelles sont pilotées depuis
Digiforma plutôt que dupliquées dans Directus. Le jeu de données "formations
témoin" initialement seedé par ST-09 a été retiré en conséquence — si un
besoin de collection `formations` apparaît plus tard, il fera l'objet d'un
ticket dédié plutôt que d'une réintroduction du seed.
