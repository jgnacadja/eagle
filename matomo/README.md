# matomo/

Configuration versionnée de l'instance Matomo (analytics auto-hébergé,
ST-26/27/32) — équivalent de `directus/schema/` pour Directus.

## Contenu

- `config.mjs` — source de vérité déclarative : site (nom, URLs, fuseau),
  6 dimensions personnalisées, 7 objectifs, réglages vie privée.
- `provision.mjs` — applique `config.mjs` sur une instance via l'API HTTP
  Matomo. Idempotent : ré-exécutable sans casse (crée ce qui manque, met à
  jour les objectifs dont le déclencheur a changé, ignore le reste).
- `provision.test.mjs` — couverture node:test (`pnpm test:matomo`).
- `CNIL.md` — dossier d'exemption CNIL (config retenue, finalités,
  rétention, opt-out, auto-évaluation, validation requise — ST-33).

## Provisioning

```bash
docker compose up -d matomo   # instance locale (wizard : 1re fois seulement)
# Matomo → Personnel → Sécurité → Auth tokens → créer un token admin
#   (l'option « secure only » impose le POST — c'est ce que le script fait).
# Poser le token dans .env : MATOMO_TOKEN_AUTH=...
pnpm matomo:provision
```

Variables : `MATOMO_TOKEN_AUTH` (requis, jamais commité), `MATOMO_URL`
(défaut `http://localhost:${MATOMO_PORT:-8082}`), `MATOMO_ADMIN_PASSWORD`
(requis pour la rétention des logs — Matomo exige une reconfirmation du
mot de passe admin ; sans lui le provision saute ce réglage avec un
avertissement).

## Contrat front ↔ config

`idcustomdimension` est global et suit l'ordre de `config.mjs` — le tracker
JS adresse cet id (`dimension{N}`), pas l'index par portée. Le mapping
vit dans `apps/front/app/utils/matomo-dimensions.ts` : toute modification
de l'ordre ou des noms ici doit y être répercutée.

Objectifs : ceux sur URL de confirmation (`/confirmation/*`, ST-30) se
déclenchent sur la page vue trackée — aucun code front. Les objectifs
événement (`click_download_program`, `click_phone`, `session_signup`,
`click_cta_demande_formation_from_centre`) se déclenchent sur l'action
Matomo émise par `useAnalytics().pushEvent`. `session_signup` est le contrat
réservé au tunnel d'inscription session à venir.

## Hors périmètre du script

- Compte admin + site initial : créés par le wizard d'installation (une
  fois par instance — les volumes `matomodb`/`matomohtml` les conservent).
- Token auth : manuel (secret, par environnement).
- Recette/production : deux sites Matomo distincts (SITE_ID différent),
  pointer `NUXT_PUBLIC_MATOMO_SITE_ID` en conséquence.

## Recette locale (chaîne validée)

Stack : `docker compose up -d postgres redis directus directus-init minio
matomo matomo-db`, puis `pnpm directus:build` si le schéma est absent,
`pnpm seed`, API sur `API_PORT`, front avec
`NUXT_PUBLIC_MATOMO_URL=http://localhost:${MATOMO_PORT:-8082}` +
`NUXT_PUBLIC_MATOMO_SITE_ID=1`.

Vérifications acceptées en local (instance `localhost:8082`) :

- Page vues réelles : `Live.getLastVisitsDetails` remonte Gabarit
  (`dimension1`) sur chaque page, Famille (`dimension2`) sur les fiches,
  Département (`dimension3`) propagé aux événements, Landing SEO
  (`dimension5`) figée à l'entrée de visite.
- Événements réels observés : `view_formations_catalog`,
  `view_centre_detail`, `click_phone` (lien `tel:`),
  `click_cta_demande_formation_from_centre`, recherche catalogue via
  `trackSiteSearch` (mot-clé + catégorie).
- 7/7 objectifs déclenchés (URL de confirmation + actions événement) :
  conversions visibles dans `Goals.get` par `idGoal`.
- IP tronquée (`192.168.0.0`) conformément à `privacy`.
- Opt-out (ST-33) : `/confidentialite` affiche le statut et le bouton
  sous « Mesure d'audience » ; `optUserOut` pose `mtm_consent_removed`
  (seul cookie), les hits suivants ne remontent plus dans `Live.*`,
  `forgetUserOptOut` restaure la collecte.

Rapports agrégés : Matomo archive par période — si `Goals.get` renvoie 0
alors que `Live.*` montre la conversion, invalider puis archiver :
`docker exec eagle-matomo-1 php /var/www/html/console
core:invalidate-report-data --sites=1 --dates=today && php
/var/www/html/console core:archive --force-idsites=1`.

Limites connues : le tunnel d'inscription session n'existe pas encore
(l'objectif `session_signup` est provisionné comme contrat prêt à l'emploi) ;
le 100 % de Gabarit sur crawl massif reste à démontrer en recette SEO
(ticket dédié).
