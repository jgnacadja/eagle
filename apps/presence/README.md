# @learnup/presence

Page de présence statique LEARN UP ACADEMY — [S0-06](https://app.clickup.com/t/869eqqdj8).

Isolée à dessein : ne dépend d'aucun package du monorepo (`@learnup/ui`,
`@learnup/types`) ni du socle Nuxt 4 / NestJS / Directus / Scaleway. Vite +
TypeScript strict, zéro framework UI, un seul appel externe (l'embed natif
HubSpot Forms).

## Lancement local

```bash
pnpm --filter @learnup/presence dev      # http://localhost:5173
pnpm --filter @learnup/presence build    # sortie dans dist/
pnpm --filter @learnup/presence test
pnpm --filter @learnup/presence test:coverage
```

## Variables d'environnement

Voir [`.env.example`](.env.example). `VITE_HUBSPOT_PORTAL_ID`,
`VITE_HUBSPOT_FORM_ID` et `VITE_HUBSPOT_REGION` sont obligatoires — tant
qu'elles ne sont pas renseignées (en local ou dans les env vars du projet
Vercel), le formulaire affiche un message "indisponible" au lieu de planter ou
de simuler un CTA qui ne fait rien.

`VITE_HUBSPOT_PROFILE_FIELD` (optionnel, défaut `profil`) est le nom interne
du champ HubSpot prérempli selon le bouton cliqué (Entreprise / Particulier /
Franchisé / Formateur) — **à vérifier contre le formulaire HubSpot réel**
avant mise en prod, ce nom est une convention de départ, pas une valeur
confirmée côté HubSpot.

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

## Ce qui est fait vs. laissé de côté (ticket S0-06)

Fait dans ce PR : page complète (logo, slogan, bandeau "site en
développement", 4 CTA profils, section formulaire), mobile-first, RGAA de
base (contrastes, ≥16px, cibles tactiles ≥44px), intégration HubSpot pilotée
par variables d'environnement.

Volontairement laissé de côté (décision produit — cf. échanges sur le
ticket) : création du projet Vercel + réglage de son "Root Directory" sur
`apps/presence`, désactivation de la protection de preview Vercel,
enregistrements DNS chez Ionos pour `www.learnupacademy.fr`, création du
formulaire HubSpot réel et vérification bout-en-bout (soumission → CRM). Ces
points restent ouverts dans le DoD du ticket et sont hors du périmètre code.
