# @learnup/presence

Page de présence statique LEARN UP ACADEMY — [S0-06](https://app.clickup.com/t/869eqqdj8).

Isolée à dessein : ne dépend d'aucun package du monorepo (`@learnup/ui`,
`@learnup/types`) ni du socle Nuxt 4 / NestJS / Directus / Scaleway. Vite +
TypeScript strict, zéro framework UI, deux scripts externes chargés à
l'exécution (embed natif HubSpot Forms + tracking code HubSpot).

## Lancement local

```bash
pnpm --filter @learnup/presence dev      # http://localhost:5173
pnpm --filter @learnup/presence build    # sortie dans dist/
pnpm --filter @learnup/presence test
pnpm --filter @learnup/presence test:coverage
```

## Formulaire HubSpot

Le ticket demande de **réutiliser tel quel** le formulaire HubSpot « Contact »
existant (pas de nouveau champ, pas de segmentation par profil — la logique
des 4 boutons profils initialement prévue a été abandonnée, cf. commentaires
du ticket). Le bouton CTA unique de la page est un simple lien ancre
(`<a href="#hubspot-form-target">`, scroll fluide en CSS) vers le bloc où le
formulaire est intégré **une seule fois**, au chargement de la page.

Un tracking code HubSpot est aussi injecté dans le `<head>` (requis pour un
domaine externe non hébergé par HubSpot, cf. procédure du ticket) — il
réutilise le même `portalId` que l'embed du formulaire (portalId et Hub ID
sont le même identifiant côté HubSpot).

## Variables d'environnement

Voir [`.env.example`](.env.example). `VITE_HUBSPOT_PORTAL_ID`,
`VITE_HUBSPOT_FORM_ID` et `VITE_HUBSPOT_REGION` sont obligatoires — tant
qu'elles ne sont pas renseignées (en local ou dans les env vars du projet
Vercel), la page affiche un message "indisponible" au lieu de planter ou de
simuler un CTA qui ne fait rien.

## Logo

`public/logo.png` (encre foncée, fond transparent) et `public/logo-reverse.png`
(encre blanche, fond transparent) sont dérivés du fichier fourni sur le ticket
(`LOGO MONOCHROME FOND TRANSPARENT.svg`, export Canva). Ce fichier embarquait
en réalité deux rendus **aplatis sur fond noir opaque** (pas de transparence
malgré son nom) : la version blanche a été isolée par détourage (le fond noir
pur devient alpha), et la version encre foncée est cette même forme recolorée
en `#141530` (couleur trouvée dans le fichier source). Même tracé, aucune
approximation de forme — uniquement une correction de transparence + une
recoloration unie. À faire valider par le client au même titre que le reste.

Seul `logo-reverse.png` (blanc) est affiché sur la page, dans le hero sur fond
sombre. `logo.png` (encre foncée) a été retiré du pied de page — même image
que le hero, doublon visuel pur sans second contexte de fond clair pour le
justifier. Gardé dans `public/` en cas de besoin futur (favicon, section sur
fond clair).

## Ce qui est fait vs. laissé de côté (ticket S0-06)

Fait dans cette PR : page complète (logo, slogan, bandeau "site en
développement", CTA unique, section formulaire), mobile-first, RGAA de base
(contrastes, ≥16px, cibles tactiles ≥44px), formulaire HubSpot « Contact »
existant + tracking code, pilotés par variables d'environnement.

Volontairement laissé de côté (décision produit — cf. échanges sur le
ticket) : création du projet Vercel + réglage de son "Root Directory" sur
`apps/presence`, désactivation de la protection de preview Vercel,
enregistrements DNS chez Ionos pour `www.learnupacademy.fr`, et vérification
bout-en-bout du formulaire réel (soumission → CRM). Ces points restent
ouverts dans le DoD du ticket et sont hors du périmètre code.
