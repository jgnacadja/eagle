# Configuration HubSpot — Formulaires LEARN UP

Guide de mise en place du portail HubSpot pour les quatre formulaires de
génération de leads du site : newsletter, demande de formation, candidature
réseau et contact conseiller.

## Architecture

```
Site Nuxt (navigateur) ──POST /leads/{form}──> API NestJS ──POST──> HubSpot Forms API v3
                     api{-eu1}.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}
```

- Le front poste le **payload métier** à l'API (`POST /leads/newsletter`,
  `/leads/demande`, `/leads/candidature`, `/leads/conseiller`) — c'est l'API
  qui mappe les
  propriétés HubSpot (`learnup_*`, split nom/prénom), ajoute le contexte
  de page et les options de consentement, puis relaie à la Forms API.
- L'endpoint Forms API n'est **pas authentifié** : `portalId` + GUIDs de
  formulaires suffisent. L'API n'a donc besoin d'aucun secret pour soumettre.
- La clé de service n'est requise **que pour l'administration** (création
  des propriétés et des formulaires, inspection) — jamais dans le front.

## 1. Prérequis

| Élément                    | Où                                                                                              | Notes                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------- |
| **Portal ID (Hub ID)**     | Settings → Account Setup → Account Defaults (ou dans l'URL du portail)                          | Valeur numérique, ex. `149356688`     |
| **Clé de service**         | Development → Keys → Service Keys                                                               | Uniquement pour le provisioning/admin |
| **Domaine du site tracké** | Settings → Tracking & Analytics → Tracking Code → Advanced tracking → _Additional site domains_ | **Critique** — voir §5                |

Scopes de la clé de service (provisioning uniquement) :

- `crm.schemas.contacts.read` + `crm.schemas.contacts.write` — propriétés
- `crm.objects.contacts.read` + `crm.objects.contacts.write` — inspection
- `forms` — formulaires et soumissions

Les Service Keys remplacent les apps privées legacy (création retirée de
l'UI fin octobre 2026 ; les apps existantes continuent de fonctionner).
La clé est un Bearer utilisable sur les REST APIs — pas de webhooks
(inutile ici).

La clé n'est affichée qu'une fois → la stocker dans `.env`
(`HUBSPOT_PRIVATE_APP_TOKEN`), jamais dans le repo.

## 2. Propriétés de contact

### Groupe

- Internal name : `learnup`
- Label : `LEARN UP — Site`

### Propriétés natives réutilisées

| Propriété                | Usage                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `email`                  | E-mail professionnel                                                                          |
| `firstname` / `lastname` | Nom et prénom (le champ unique « Nom et prénom » est découpé : 1er mot → prénom, reste → nom) |
| `phone`                  | Téléphone                                                                                     |
| `company`                | Raison sociale                                                                                |
| `jobtitle`               | Fonction                                                                                      |

### Propriétés custom (objet Contact, groupe `learnup`)

| Internal name         | Label                    | Type               | Notes              |
| --------------------- | ------------------------ | ------------------ | ------------------ |
| `learnup_siret`       | SIRET                    | Texte              | 14 chiffres        |
| `learnup_salaries`    | Salariés à former        | Nombre             |                    |
| `learnup_echeance`    | Échéance souhaitée       | Texte              |                    |
| `learnup_precisions`  | Précisions               | Texte multi-lignes |                    |
| `learnup_territoire`  | Ville ou territoire visé | Texte              |                    |
| `learnup_parcours`    | Parcours et projet       | Texte multi-lignes |                    |
| `learnup_centre`      | Centre demandé           | Texte              | Contexte, masqué   |
| `learnup_formation`   | Formation demandée       | Texte              | Contexte, masqué   |
| `learnup_session`     | Session demandée         | Texte              | Contexte, masqué   |
| `learnup_type_projet` | Type de projet           | Liste déroulante   | Options ci-dessous |

Options de `learnup_type_projet` (valeurs internes exactes — le mapping du
site dépend de ces valeurs) :

| Valeur       | Label                       |
| ------------ | --------------------------- |
| `centre`     | Ouvrir un centre            |
| `organisme`  | Référencer mon organisme    |
| `formateur`  | Formateur indépendant       |
| `conseiller` | Échanger avec un conseiller |

> Les internal names `learnup_*` et les valeurs d'enum doivent rester
> identiques d'un portail à l'autre : l'API envoie ces noms directement.

## 3. Formulaires

Quatre formulaires à créer (Marketing → Lead Capture → Forms, ou via
`POST /marketing/v3/forms` — l'API exige `createdAt`/`updatedAt` au niveau
racine et un objet `validation` par champ, même `{}`).

### 3.1 Newsletter — Site LEARN UP

| Champ  | Propriété | Visibilité | Requis |
| ------ | --------- | ---------- | ------ |
| E-mail | `email`   | visible    | oui    |

- `postSubmitAction` : message « Inscription confirmée — à très vite. »
- `createNewContactForNewEmail` : activé

### 3.2 Demande de formation — Site LEARN UP

| Champ              | Propriété             | Visibilité | Requis |
| ------------------ | --------------------- | ---------- | ------ |
| Prénom             | `firstname`           | visible    | non    |
| Nom                | `lastname`            | visible    | non    |
| E-mail             | `email`               | visible    | oui    |
| Téléphone          | `phone`               | visible    | oui    |
| Raison sociale     | `company`             | visible    | non    |
| SIRET              | `learnup_siret`       | visible    | non    |
| Fonction           | `jobtitle`            | visible    | non    |
| Salariés à former  | `learnup_salaries`    | visible    | non    |
| Échéance souhaitée | `learnup_echeance`    | visible    | non    |
| Précisions         | `learnup_precisions`  | visible    | non    |
| Centre demandé     | `learnup_centre`      | **masqué** | non    |
| Formation demandée | `learnup_formation`   | **masqué** | non    |
| Session demandée   | `learnup_session`     | **masqué** | non    |
| Sujet              | `learnup_type_projet` | **masqué** | non    |

- `postSubmitAction` : message « Votre demande est transmise — réponse sous
  24 h ouvrées. »
- Maximum 3 champs par groupe — découper en plusieurs `fieldGroups`.
- Les champs numériques exigent `minAllowedDigits`/`maxAllowedDigits` à la
  création via API.

### 3.3 Candidature réseau — Site LEARN UP

| Champ          | Propriété             | Visibilité | Requis |
| -------------- | --------------------- | ---------- | ------ |
| Prénom         | `firstname`           | visible    | non    |
| Nom            | `lastname`            | visible    | non    |
| E-mail         | `email`               | visible    | oui    |
| Téléphone      | `phone`               | visible    | oui    |
| Territoire     | `learnup_territoire`  | visible    | non    |
| Parcours       | `learnup_parcours`    | visible    | non    |
| Type de projet | `learnup_type_projet` | **masqué** | non    |

- `postSubmitAction` : message « Votre candidature est transmise. »
- Attention : un champ `hidden` **ne doit pas être `required`** (rejet à la
  création du formulaire).

### 3.4 Contact conseiller — Site LEARN UP

Formulaire unique derrière les CTA « Parler à votre conseiller » : le `besoin`
alimente le routage back-office vers l'entité compétente via
`learnup_type_projet` — jamais exposé côté client.

| Champ            | Propriété             | Visibilité | Requis |
| ---------------- | --------------------- | ---------- | ------ |
| Prénom           | `firstname`           | visible    | non    |
| Nom              | `lastname`            | visible    | non    |
| E-mail           | `email`               | visible    | oui    |
| Téléphone        | `phone`               | visible    | oui    |
| SIRET            | `learnup_siret`       | visible    | non    |
| Besoin exprimé   | `learnup_precisions`  | visible    | non    |
| Nature du besoin | `learnup_type_projet` | **masqué** | non    |

- `postSubmitAction` : message « Votre demande est transmise — un conseiller
  vous recontacte sous 24 h ouvrées. »
- La case « Un besoin de formation » envoie `learnup_type_projet` =
  `conseiller` : le conseiller route le besoin de formation vers le centre
  compétent du territoire.
- La référence de suivi affichée à l'utilisateur (`LU-AAAA-MMDD-NNN`) est
  suffixée au `message` → `learnup_precisions` : elle reste retrouvable
  dans HubSpot.

Après création, récupérer le **GUID** de chaque formulaire dans l'URL
d'édition (`app{region}.hubspot.com/.../forms/editor/{guid}`).

## 4. Variables d'environnement

```bash
# Consommées par l'API (POST /leads/*) — jamais exposées au front
HUBSPOT_PORTAL_ID=                      # Hub ID du portail
HUBSPOT_FORM_NEWSLETTER=                # GUID du form newsletter
HUBSPOT_FORM_DEMANDE=                   # GUID du form demande
HUBSPOT_FORM_CANDIDATURE=               # GUID du form candidature
HUBSPOT_FORM_CONSEILLER=                # GUID du form contact conseiller
HUBSPOT_FORMS_BASE_URL=                 # https://api-eu1.hsforms.com (portail EU)
                                        # https://api.hsforms.com sinon

# Provisioning/admin uniquement (jamais utilisée par les soumissions)
HUBSPOT_PRIVATE_APP_TOKEN=pat-...
```

- Portail **EU** (`app-eu1.hubspot.com`) → `api-eu1.hsforms.com`. Portail
  US → `api.hsforms.com`. Les deux endpoints répondent 200 quelle que soit
  la région, mais pointer la bonne région évite une redirection silencieuse.
- En cas de migration vers un autre portail : seules ces variables changent
  (les GUIDs sont différents par portail), aucun code à toucher.

## 5. Point critique — domaines trackés

**HubSpot accepte la soumission (HTTP 200 + message de confirmation) mais la
jette silencieusement si `context.pageUri` porte un domaine non tracké par
le portail.**

Le front passe `window.location.href` comme `pageUri` — l'API la relaie dans
`context.pageUri`. Il faut donc :

1. Settings → Tracking & Analytics → Tracking Code → Advanced tracking
2. Ajouter le domaine du site (ex. `learnup.fr`, `www.learnup.fr`) dans
   **Additional site domains**
3. En dev/recette : `localhost` fonctionne par défaut

Le tracking code HubSpot peut aussi être installé sur le site — le domaine
devient alors tracké automatiquement.

## 6. Consentement et mentions légales

- Les soumissions **demande**, **candidature** et **conseiller** envoient
  `legalConsentOptions.consent` (la case consentement est cochée
  explicitement par l'utilisateur). Configurer une mention de consentement
  sur ces formulaires côté HubSpot si le portail l'exige.
- La **newsletter** n'envoie **pas** `legalConsentOptions` : sur un
  formulaire sans mention de consentement configurée, l'option ferait jeter
  la soumission (même symptôme : 200 mais rien d'enregistré).
- Si un bandeau « consent to process » est activé sur les formulaires,
  vérifier que les soumissions continuent de s'enregistrer.

## 7. Recette

Pour chaque formulaire :

1. Soumettre depuis le site (ou via `curl`) avec un e-mail de test.
2. Vérifier dans le portail :
   - Marketing → Forms → formulaire → onglet **Submissions** : la soumission
     apparaît avec l'URL de la page (`pageUrl`).
   - CRM → Contacts : le contact existe, propriétés natives et `learnup_*`
     renseignées.
3. `curl` de test :

```bash
curl -X POST \
  "https://api-eu1.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}" \
  -H "Content-Type: application/json" \
  -d '{"fields":[{"objectTypeId":"0-1","name":"email","value":"test@example.com"}]}'
# → {"inlineMessage":"Inscription confirmée — à très vite."}
```

## 8. Anti-spam

Le site ne filtre pas les soumissions (validation côté client uniquement).
Options côté HubSpot :

- Activer **reCAPTCHA** sur les formulaires (configuration →
  `recaptchaEnabled`) — attention : la Forms API v3 ne transmet pas de token
  reCAPTCHA ; préférer cette option si les soumissions passent par un form
  HubSpot embarqué, sinon laisser désactivé.
- HubSpot filtre déjà une partie du spam côté plateforme (domaines
  bloquables dans la validation du champ e-mail : `blockedEmailDomains`,
  `useDefaultBlockList`).

## 9. Dépannage

| Symptôme                                  | Cause probable                                                 | Correctif                                                                            |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Soumission 200 mais rien dans Submissions | `context.pageUri` sur un domaine non tracké                    | Ajouter le domaine (§5) ou omettre `context`                                         |
| Soumission 200 mais rien enregistré (bis) | `legalConsentOptions` sur un form sans mention de consentement | Ne pas envoyer l'option (newsletter) ou configurer la mention                        |
| 400 à la création d'un champ nombre       | `minAllowedDigits`/`maxAllowedDigits` manquants                | Ajouter les deux bornes                                                              |
| 400 à la création du formulaire           | Plus de 3 champs dans un `fieldGroup`                          | Découper en plusieurs groupes                                                        |
| 400 — champ `hidden` + `required`         | Combinaison interdite                                          | `hidden: true` ⇒ `required: false`                                                   |
| Enum rejetée à la soumission              | Valeur hors options (`franchise` n'existe pas)                 | Utiliser `centre` — l'API mappe `franchise → centre` et ignore les valeurs inconnues |
| GUID introuvable                          | Form recréé (nouveau GUID)                                     | Mettre à jour `HUBSPOT_FORM_*`                                                       |

## 10. Migration vers un autre portail

1. Créer la clé de service sur le nouveau portail (mêmes scopes).
2. Recréer le groupe `learnup` + les 10 propriétés avec les **mêmes internal
   names** (et les 4 options de `learnup_type_projet`).
3. Recréer les 4 formulaires → nouveaux GUIDs.
4. Ajouter le domaine du site aux domaines trackés du nouveau portail.
5. Mettre à jour les variables `HUBSPOT_*` — aucune modification de code.

Les workflows, listes et e-mails automatisés ne sont **pas** portables —
à recréer manuellement sur le nouveau portail.
