# directus/

Schema versionné et outillage pour l'instance Directus (back-office LEARN UP
ACADEMY).

## Contenu

- `schema/snapshot.yaml` — snapshot du schéma (collections, champs, relations),
  exporté via `directus schema snapshot`. **Actuellement obsolète** : il date de
  ST-11 et ne reflète pas les champs ajoutés ensuite (`latitude`/`longitude`,
  `department`, `region`, etc.). Il ne doit pas être utilisé pour `schema apply`
  tant qu'il n'a pas été régénéré (voir Maintenance du snapshot ci-dessous).
- `schema/collections.mjs`, `schema/roles.mjs` — définitions source des
  collections et de la matrice de rôles/permissions, lisibles par un humain
  (le YAML du snapshot est dense et peu adapté à la revue).
- `schema/build.mjs` — script de construction : crée les collections/relations
  si absentes, puis les rôles, policies, permissions. Idempotent (sûr à
  ré-exécuter — vérifié sur plusieurs runs consécutifs). C'est le mécanisme de
  restauration automatique au démarrage.
- `seed/` — script de seed de contenu de démonstration (voir sa propre section
  dans le README racine).

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
