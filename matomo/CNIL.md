# Dossier d'exemption CNIL — mesure d'audience Matomo

Document de travail pour l'exemption de consentement de la mesure
d'audience (référentiel CNIL « cookies — mesure d'audience » et guide
Matomo « Consent Manager / CNIL »). **La position juridique n'est pas
actée** : elle attend la validation écrite du référentiel conformité et
les textes légaux définitifs du client (D1). Ce fichier décrit la
configuration technique retenue et l'auto-évaluation associée.

## Outil et finalités

- **Outil** Matomo 5 auto-hébergé (VM dédiée, `analytics.*`
  sous-domaine). Aucune donnée n'est envoyée à un prestataire tiers — la
  donnée ne quitte pas l'infrastructure du projet.
- **Finalités** : production de statistiques de fréquentation (pages
  vues, provenance SEO, clics sur les actions principales — devis, RDV,
  téléphone, téléchargement, recherche interne) pour évaluer les contenus
  et le parcours. Attribution SEO→lead **agrégée uniquement** : aucun
  identifiant individuel ni donnée d'attribution n'est transmis à
  HubSpot (le tunnel lead conserve sa CMP dédiée).
- **Pas de croisement** : pas d'user-id, pas de fingerprinting, pas de
  recoupement avec les fichiers clients (CRM, Digiforma). Les données
  Matomo ne sont ni croisées ni transmises à d'autres traitements.

## Configuration retenue

Versionnée dans `matomo/config.mjs`, appliquée par
`pnpm matomo:provision` (`matomo/provision.mjs`) :

| Réglage                                     | Valeur                                                                                                               | Où                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Cookies de mesure                           | **aucun** — le plugin front (`matomo.client.ts`) n'active pas `setCookie*` et Matomo ne dépose aucun cookie de suivi | `apps/front/app/plugins/matomo.client.ts`                          |
| Anonymisation IP                            | activée, masque `/16` (2 derniers octets tronqués) avant traitement                                                  | `privacy.ipAddressMaskLength`                                      |
| Enrichissement par IP                       | désactivé (pas de géoloc approximative depuis l'IP tronquée)                                                         | `privacy.useAnonymizedIpForVisitEnrichment`                        |
| Anonymisation user-id / referrer / order-id | activée                                                                                                              | `privacy.anonymizeUserId`, `anonymizeReferrer`, `anonymizeOrderId` |
| Rétention des logs bruts                    | **13 mois** — purge automatique (`PrivacyManager.setDeleteLogsSettings`)                                             | `retention.deleteLogsOlderThan`                                    |
| Rapports agrégés                            | conservés au-delà (données anonymes)                                                                                 | non purgés                                                         |
| Opt-out                                     | marqueur first-party `mtm_consent_removed` via `optUserOut` — seul cookie posé, il matérialise le choix d'opposition | `useAnalytics().optOut()`                                          |

Le réglage de rétention exige `MATOMO_ADMIN_PASSWORD`
(`passwordConfirmation` côté API) ; sans lui le provision saute l'appel
avec un avertissement — à appliquer alors à la main dans Matomo
(Vie privée → Purge des données) avant la recette.

## Mécanisme d'opposition (opt-out)

Composant `apps/front/app/components/Legal/AnalyticsOptOut.vue` injecté
par `Legal/Page.vue` sur la page `confidentialite`, sous la section
« Mesure d'audience » (ancre `mesure-audience` du contenu Directus) ou
en fin d'article en repli :

- lecture du statut via la commande fonction `isUserOptedOut` (contexte
  tracker) ;
- `optOut()` → `optUserOut` (pose `mtm_consent_removed`, cookie first-party
  technique de choix — le seul cookie toléré par l'exemption) ;
- `optIn()` → `forgetUserOptOut` (supprime le marqueur) ;
- statut annoncé en `aria-live="polite"`, bouton `aria-pressed` ;
- tracker absent (script bloqué, environnement sans Matomo) : bloc
  informatif, pas d'action.

## Auto-évaluation — conditions de l'exemption CNIL

| Condition                                                | État          | Preuve                                                                                                     |
| -------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
| Outil auto-hébergé ou données non transmises à des tiers | ✅            | VM dédiée, aucun appel sortant de la donnée                                                                |
| Pas de cookie de suivi                                   | ✅            | aucun `setCookie*` ; recette : aucun cookie Matomo hors `mtm_consent_removed`                              |
| IP anonymisée avant tout usage                           | ✅            | masque `/16`, enrichissement IP coupé ; recette : `192.168.0.0` en log                                     |
| Finalité limitée aux statistiques d'audience             | ✅            | pas de profilage ni de ciblage                                                                             |
| Pas de croisement avec d'autres traitements              | ✅            | pas d'user-id, pas d'export vers HubSpot/CRM                                                               |
| Durée de vie des données brutes ≤ 13 mois                | ✅            | purge configurée (13 mois)                                                                                 |
| Information de l'utilisateur                             | ⚠️ en attente | section « Mesure d'audience » rédigée dans le seed ; **textes D1 du client requis** pour la version finale |
| Mécanisme d'opposition accessible                        | ✅            | bloc opt-out sur `confidentialite`, testé                                                                  |
| Pas de suivi sans cookie par fingerprinting de secours   | ✅            | `forceAnonymousVisitTracking` à 0 ; Matomo ne retombe pas sur un fingerprint                               |

## Ce qui reste à valider (pré-prod)

- **Textes légaux** : contenu définitif de la politique de
  confidentialité fourni par le client (D1) — le texte seed actuel est
  un placeholder de travail.
- **Validation écrite** du référentiel conformité sur ce dossier.
- **CMP** : toujours requise pour HubSpot (hors exemption) — le retrait
  de GTM ne couvre que Matomo ; si des balises HubSpot passaient par
  GTM, leur recettage relève du ticket CMP.
- **Recette navigateur** : aucun cookie Matomo au chargement,
  `mtm_consent_removed` posé après opt-out, hits absents ensuite, IP
  anonymisée en log.
