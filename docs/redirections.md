# Redirections 301/410 — Guide référent SEO (ST-03)

Le site maintient une table `redirects` dans Directus. Elle couvre deux cas :

- les redirections **automatiques** écrites quand une URL publique change ou
  disparaît (renommage de slug, dépublication) ;
- les redirections **manuelles** saisies par le référent SEO (restructuration,
  migration, campagnes).

Avant chaque affichage, le site demande à l'API si l'adresse appelée figure
dans la table : `301` renvoie vers la nouvelle adresse, `410` répond « page
supprimée définitivement » (Google déréférence), aucun enregistrement laisse
la page s'afficher.

## Collection `redirects`

| Champ       | Rôle                                                                |
| ----------- | ------------------------------------------------------------------- |
| `from_path` | Ancienne adresse, sans domaine (`/formations/gestion/ancien`).      |
| `to_path`   | Nouvelle adresse. Vide pour une suppression définitive (410).       |
| `status`    | `301` (redirection permanente) ou `410` (page supprimée).           |
| `origin`    | `manual` (saisie à la main), `auto` (écrite par le hook), `import`. |

Règles d'édition : un chemin est **unique**, minuscules, sans slash final —
la validation le refuse sinon (`from_path` et `to_path` n'acceptent que des
chemins internes normalisés, `/` comprise ; `to_path` vide = 410). Une ligne
**manuelle n'est jamais modifiée** par les automatismes — si une URL doit
pointer ailleurs qu'un renommage automatique, créer la ligne en `manual`
avant ou la passer en `manual` après.

## Ce que fait l'automatisme (hook `slug-redirects`)

Sur les collections porteuses d'URL — `formations`, `familles_formation`,
`articles`, `centres`, `pages_legales` :

| Événement                          | Effet dans la table                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Renommage de slug (page publiée)   | 301 ancienne → nouvelle adresse.                                                                            |
| Deuxième renommage                 | Les 301 pointant vers l'ancienne adresse sont **mis à jour** vers la plus récente — jamais de chaîne A→B→C. |
| Retour à un ancien slug (A→B→A)    | Le 301 inverse auto est supprimé — pas de boucle.                                                           |
| Dépublication ou suppression       | 410 sur l'adresse.                                                                                          |
| Republication d'une adresse en 410 | Le 410 auto est retiré.                                                                                     |
| Renommage d'une **famille**        | 301 pour la famille **et** chacune de ses formations publiées.                                              |

Cas hors automatisation : un contenu **brouillon** n'a pas d'adresse publique
— son renommage ne crée rien ; sa première publication retire un éventuel 410.

### Bonnes pratiques manuelles

- **301 sans `to_path` est ignorée** (traitée comme inexistante) ; vérifier la
  cible avant d'enregistrer.
- Une ligne `manual` prime l'automatisation : pour « détourner » une adresse
  vers un contenu sans rapport (fusion de pages), saisir la ligne en manuel.
- Pas besoin de maintenir les enchaînements : l'automatisme garde les
  redirections à un saut, les imports de masse doivent faire de même.

## Chaîne technique

```
URL demandée → middleware Nuxt → GET /seo/resolve?path=…
   → ligne redirects ? 301/410 → fin de requête
   → sinon résolution contenu {type,id} → rendu normal
```

- Réponses mises en cache Redis (`seo:resolve:*`, 1 h) ; chaque écriture
  `redirects` déclenche le flow « Invalidate redirect resolution » qui purge
  ces clés **et** la page `from_path` côté ISR — une adresse encore en cache
  edge serait sinon servie sans passer par la redirection jusqu'au TTL.
- API indisponible : le middleware laisse passer (fail-open) — une panne de
  résolution ne rend jamais le site indisponible.
- Méthodes non GET, routes `/api`, `/_nuxt`, fichiers : exclus, jamais
  interrogés.
