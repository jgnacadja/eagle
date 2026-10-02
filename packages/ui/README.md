# @learnup/ui

Design system token-driven pour LEARN UP ACADEMY.

## État actuel — charte graphique v1.0 (ST-13)

Les valeurs de `src/tokens/` et `src/tokens.css` implémentent la **charte
graphique v1.0 (septembre 2026)** validée par LEARN UP PRIME : thème
« bleu marine & ambre », typographie Figtree, passe de référence 9a.

Sources de vérité :

- Claude Design — projet LEARNUP PRIME, fichier `Charte standalone-src.html`
  (7 sections : logo, couleurs, typographie, boutons & liens, composants,
  imagerie & ton, grille & espacements).
- Figma — fichier « Website », node `8-4994` (export de la charte, variables
  listées ci-dessous).

Les noms de tokens n'ont pas changé depuis les placeholders (ST-12) : le
re-skin d'`apps/front` s'est fait par configuration, sans toucher à la
structure des composants. Les nouveaux tokens (marines, ambre, sémantiques,
échelle de texte, mise en page, breakpoints) sont additifs.

## Usage

```ts
import { colors, spacing, typography } from '@learnup/ui'
```

```css
@import '@learnup/ui/tokens.css';
```

Figtree se charge depuis Google Fonts : déclarer `typography.googleFontsUrl`
dans le `<head>` (précédé des `preconnect` vers `fonts.googleapis.com` et
`fonts.gstatic.com`), comme le fait `apps/front/nuxt.config.ts`.

## Convention

Toute nouvelle valeur de style (couleur, espacement, rayon, ombre, typographie)
doit être ajoutée ici — jamais écrite en dur dans un composant ou une config
Tailwind consommatrice. `tokens.css` est le miroir manuel de `tokens/*.ts` ;
`tokens.spec.ts` échoue à la moindre dérive (`default` → suffixe omis,
camelCase → kebab-case).

## Mapping Figma → token → usage

### Couleurs

Répartition cible : blanc & fonds clairs ~62 % · marines ~30 % · ambre ~8 %.
Un seul CTA ambre visible par écran. Vert et orangé réservés aux états.

| Variable Figma                   | Valeur                   | Token TS                  | CSS                         | Tailwind                  | Usage composant                              |
| -------------------------------- | ------------------------ | ------------------------- | --------------------------- | ------------------------- | -------------------------------------------- |
| `color/azure/18` (Bunting)       | `#14264A`                | `colors.navy.deep`        | `--color-navy-deep`         | `navy-deep`               | Titres, footer, bandeau chiffres, hero       |
| `color/azure/27` (Biscay)        | `#1E3A6E`                | `colors.navy.primary`     | `--color-navy-primary`      | `navy-primary`, `primary` | Boutons secondaires, liens, bordures actives |
| `color/azure/32` (San Juan)      | `#2E4A76`                | `colors.navy.muted`       | `--color-navy-muted`        | `navy-muted`              | Blocs immersifs                              |
| `color/azure/36` (Chambray)      | `#395680`                | `colors.navy.card`        | `--color-navy-card`         | `navy-card`               | Cartes posées sur fond marine                |
| `color/azure/18`                 | `#14264A`                | `colors.primary.dark`     | `--color-primary-dark`      | `primary-dark`            | Survol des boutons marine                    |
| `color/grey/95`                  | `#EDF2FA`                | `colors.primary.soft`     | `--color-primary-soft`      | `primary-soft`            | Fond des états info / sélection              |
| `color/orange/56` (Fuel Yellow)  | `#F0A030`                | `colors.accent.default`   | `--color-accent`            | `accent`                  | CTA principal, étoiles, étincelle IA         |
| `color/orange/38` (Pumpkin Skin) | `#B4700F`                | `colors.accent.text`      | `--color-accent-text`       | `accent-text`             | Surtitres, liens ambre sur blanc             |
| `color/orange/56 16%`            | `rgb(240 160 48 / 16%)`  | `colors.accent.soft`      | `--color-accent-soft`       | `accent-soft`             | Fond du badge échéance                       |
| `color/azure/18`                 | `#14264A`                | `colors.ink.default`      | `--color-ink`               | `ink`                     | Texte principal, titres                      |
| `Fiord`                          | `#44526B`                | `colors.ink.body`         | `--color-ink-body`          | `ink-body`                | Corps de texte long                          |
| `color/azure/44` (Blue Bayoux)   | `#5A6B85`                | `colors.ink.muted`        | `--color-ink-muted`         | `ink-muted`               | Texte secondaire, corps 14–15 px             |
| `color/azure/60` (Regent Gray)   | `#8A94A8`                | `colors.ink.subtle`       | `--color-ink-subtle`        | `ink-subtle`              | Méta (voir « Contrastes »)                   |
| `color/azure/49` (Slate Gray)    | `#6B7890`                | `colors.ink.placeholder`  | `--color-ink-placeholder`   | `ink-placeholder`         | Placeholders de champs                       |
| `color/white/solid`              | `#FFFFFF`                | `colors.ink.inverse`      | `--color-ink-inverse`       | `ink-inverse`             | Texte sur fond marine                        |
| `color/white/ 72%`               | `rgb(255 255 255 / 72%)` | `colors.ink.inverseMuted` | `--color-ink-inverse-muted` | `ink-inverse-muted`       | Chapeau sur fond marine                      |
| `color/white/solid`              | `#FFFFFF`                | `colors.paper`            | `--color-paper`             | `paper`                   | Fond blanc, cartes catalogue, header         |
| `color/grey/97`                  | `#F4F7FC`                | `colors.surface`          | `--color-surface`           | `surface`                 | Fond de section bleuté, cartes profil        |
| `color/grey/95` (Link Water)     | `#EDF2FA`                | `colors.surfaceAlt`       | `--color-surface-alt`       | `surface-alt`             | Réserves images                              |
| `color/azure/20 12%`             | `rgb(20 42 82 / 12%)`    | `colors.rule`             | `--color-rule`              | `rule`                    | Bordures de cartes, séparateurs              |
| `color/azure/20 15%`             | `rgb(20 42 82 / 15%)`    | `colors.ruleStrong`       | `--color-rule-strong`       | `rule-strong`             | Bordures appuyées                            |
| `color/azure/27 45%`             | `rgb(30 58 110 / 45%)`   | `colors.outline`          | `--color-outline`           | `outline`                 | Contour du bouton tertiaire                  |
| `color/azure/27 30%`             | `rgb(30 58 110 / 30%)`   | `colors.outlineSoft`      | `--color-outline-soft`      | `outline-soft`            | Contour des champs au repos                  |
| `color/white/ 40%`               | `rgb(255 255 255 / 40%)` | `colors.outlineInverse`   | `--color-outline-inverse`   | `outline-inverse`         | Pilules contour sur fond marine              |
| `color/spring green/34`          | `#2E7D5B`                | `colors.success.default`  | `--color-success`           | `success`                 | Disponibilité, pastille d'étape finale       |
| `color/spring green/34 12%`      | `rgb(46 125 91 / 12%)`   | `colors.success.soft`     | `--color-success-soft`      | `success-soft`            | Fond du badge disponibilité                  |
| `color/orange/38`                | `#B4700F`                | `colors.warning.default`  | `--color-warning`           | `warning`                 | Échéance, prochaine session                  |
| `color/orange/56 16%`            | `rgb(240 160 48 / 16%)`  | `colors.warning.soft`     | `--color-warning-soft`      | `warning-soft`            | Fond du badge échéance                       |
| — (charte §01, pictogramme ✗)    | `#B03A2E`                | `colors.danger.default`   | `--color-danger`            | `danger`                  | Erreurs, interdits                           |
| —                                | `rgb(176 58 46 / 10%)`   | `colors.danger.soft`      | `--color-danger-soft`       | `danger-soft`             | Fond des messages d'erreur                   |
| `color/azure/27`                 | `#1E3A6E`                | `colors.info.default`     | `--color-info`              | `info`                    | Messages d'information                       |
| `color/grey/95`                  | `#EDF2FA`                | `colors.info.soft`        | `--color-info-soft`         | `info-soft`               | Fond des messages d'information              |

### Typographie

| Variable Figma                                                  | Token TS                     | CSS                             | Tailwind        | Usage                                           |
| --------------------------------------------------------------- | ---------------------------- | ------------------------------- | --------------- | ----------------------------------------------- |
| `font family/Font 2` = Figtree                                  | `typography.fontFamily.sans` | `--font-sans`, `--font-display` | `font-sans`     | Toute la typographie (repli sans-serif)         |
| `font weight/500 · 700 · 800`, `font/heading-weight`            | `typography.fontWeight.*`    | `--font-weight-*`               | `font-medium`…  | 400 corps · 500 méta · 700 boutons · 800 titres |
| `font size/46`, `line height/50_6`, `letter spacing/-0_92`      | `typography.scale.hero`      | `--text-hero-*`                 | `text-hero`     | H1 hero (46/1.1, -.02em, 800)                   |
| `font size/40`, `line height/44`, `letter spacing/-0_8`         | `typography.scale.h1`        | `--text-h1-*`                   | `text-h1`       | H1 de page (40/1.1)                             |
| `font size/26`–`27`, `line height/31_2`, `letter spacing/-0_31` | `typography.scale.h2`        | `--text-h2-*`                   | `text-h2`       | H2 de section (26/1.2, -.012em)                 |
| `font size/18`, `line height/22_5`, `letter spacing/0_18`       | `typography.scale.h3`        | `--text-h3-*`                   | `text-h3`       | H3 de carte profil (18/1.25, +.01em)            |
| `font size/16`, `line height/20_8`                              | `typography.scale.h4`        | `--text-h4-*`                   | `text-h4`       | Titre de carte catalogue (16/1.3, 700)          |
| `font size/11`, `letter spacing/1_21`                           | `typography.scale.overline`  | `--text-overline-*`             | `text-overline` | Surtitre ambre (11/1, +.11em, 800)              |
| `font size/15_5`, `line height/24`                              | `typography.scale.lead`      | `--text-lead-*`                 | `text-lead`     | Chapeau hero                                    |
| `font size/14_5`, `line height/22_48`                           | `typography.scale.body`      | `--text-body-*`                 | `text-body`     | Corps (14.5/1.55, `ink-muted`)                  |
| `font size/13`, `line height/19_5`                              | `typography.scale.small`     | `--text-small-*`                | `text-small`    | Légendes, aides                                 |
| `font size/12_5`, `line height/12_5`                            | `typography.scale.meta`      | `--text-meta-*`                 | `text-meta`     | Dates, durées (`ink-subtle`)                    |
| `font size/15`, `line height/14`                                | `typography.scale.button`    | `--text-button-*`               | `text-button`   | Libellés de boutons (700)                       |
| `font size/11_5`, `line height/16_1`                            | `typography.scale.badge`     | `--text-badge-*`                | `text-badge`    | Badges d'état (700)                             |

### Espacements, mise en page, breakpoints

| Charte / Figma                       | Token TS                      | CSS                       | Tailwind                        | Usage                                         |
| ------------------------------------ | ----------------------------- | ------------------------- | ------------------------------- | --------------------------------------------- |
| `item spacing/*` (base 4 px)         | `spacing.xs`…`spacing.4xl`    | `--spacing-*`             | `p-xs`… `gap-4xl`               | Échelle 4 · 8 · 16 · 24 · 32 · 48 · 56 · 64   |
| Gabarit desktop 1280 px              | `layout.containerMax`         | `--layout-container-max`  | `max-w-container`               | Conteneur principal                           |
| `width/640`                          | `layout.proseMax`             | `--layout-prose-max`      | `max-w-prose`                   | Colonne de lecture                            |
| Marges latérales 48 px / 20 px       | `layout.gutterDesktop/Mobile` | `--layout-gutter-*`       | `px-gutter`, `px-gutter-mobile` | Marges de page                                |
| Padding vertical de section 52–62 px | `layout.sectionY`             | `--layout-section-y`      | `py-section`                    | Sections (alternance blanc / bleuté / marine) |
| Gap des grilles 16 px                | `layout.gridGap`              | `--layout-grid-gap`       | `gap-grid`                      | Grilles de cartes 3–4 colonnes                |
| Cible tactile 44 px                  | `layout.touchTarget`          | `--layout-touch-target`   | `min-h-touch`, `min-w-touch`    | Tout élément interactif                       |
| Hauteur de bouton 48–52 px           | `layout.controlHeight`        | `--layout-control-height` | `h-control`                     | Boutons, bouton icône recherche               |
| Mobile 390 px → desktop 1280 px      | `breakpoints.sm/md/lg/xl`     | `--breakpoint-*`          | `sm:` `md:` `lg:` `xl:`         | 640 · 768 · 1024 · 1280                       |

### Rayons et ombres

| Variable Figma           | Token TS     | CSS             | Tailwind       | Usage                                |
| ------------------------ | ------------ | --------------- | -------------- | ------------------------------------ |
| `radius/sm` = 8          | `radii.xs`   | `--radius-xs`   | `rounded-xs`   | Petits éléments                      |
| `corner radius/10`       | `radii.sm`   | `--radius-sm`   | `rounded-sm`   | Images dans les cartes               |
| `radius/md` = 16         | `radii.md`   | `--radius-md`   | `rounded-md`   | Cartes, blocs de section             |
| `radius/lg` = 28         | `radii.lg`   | `--radius-lg`   | `rounded-lg`   | Grands panneaux immersifs            |
| `corner radius/999`      | `radii.full` | `--radius-full` | `rounded-full` | Pilules : boutons, badges, recherche |
| —                        | `shadows.sm` | `--shadow-sm`   | `shadow-sm`    | Cartes au repos                      |
| —                        | `shadows.md` | `--shadow-md`   | `shadow-md`    | Cartes au survol                     |
| Charte §05 (0 16 34 .13) | `shadows.lg` | `--shadow-lg`   | `shadow-lg`    | Recherche IA, éléments flottants     |

### Recettes de composants (charte §04–05)

| Composant           | Tokens                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------- |
| Bouton primaire     | `bg-accent text-navy-deep text-button rounded-full h-control px-lg` — 1 max par écran        |
| Bouton secondaire   | `bg-primary text-ink-inverse hover:bg-primary-dark text-button rounded-full h-control px-lg` |
| Bouton tertiaire    | `border border-outline text-primary rounded-full h-control px-lg` (blanc 50 % sur marine)    |
| Lien de carte       | `text-primary font-bold` + flèche « → » (signe tous les liens internes)                      |
| Carte profil        | `bg-surface rounded-md p-lg` — titre `text-h3 text-ink`, accroche `text-accent-text`         |
| Carte catalogue     | `bg-paper border border-rule rounded-md` — image `rounded-sm bg-surface-alt`                 |
| Recherche IA        | `border-2 border-primary rounded-full shadow-lg` — étincelle `text-accent`                   |
| Badge disponibilité | `bg-success-soft text-success text-badge rounded-full`                                       |
| Badge échéance      | `bg-warning-soft text-warning text-badge rounded-full`                                       |
| Champ simple        | `border border-outline-soft rounded-full h-control text-ink-placeholder`                     |
| Pastille d'étape    | `bg-primary text-ink-inverse` (36 px) — `bg-success` pour l'étape finale                     |

## Contrastes RGAA AA (revérifiés — `src/contrast.spec.ts`)

Calcul WCAG 2.1 sur les couples réellement rendus (couleurs translucides
composées sur leur fond). Seuils : 4.5:1 texte courant, 3:1 texte large
(≥ 24 px ou ≥ 18.66 px gras) et composants d'interface.

Conformes : titres et corps marine sur blanc / bleuté (≥ 5.0), liens marine
(≥ 10), blanc sur les trois marines (≥ 7.4), chapeau blanc 72 % sur marine
(8.4), CTA marine profond sur ambre (6.95), vert et rouge sur blanc (≥ 5.0).

Écarts constatés sur la charte v1.0, **à arbitrer avec LEARN UP PRIME** :

| Couple                                   | Mesuré | Attendu | Statut / recommandation                                                     |
| ---------------------------------------- | ------ | ------- | --------------------------------------------------------------------------- |
| Surtitre ambre texte `#B4700F` sur blanc | 3.99   | 4.5     | Non conforme en 11 px. Passer à `#9C600C` (5.13) ou réserver au texte large |
| Méta `#8A94A8` sur blanc                 | 3.05   | 4.5     | Non conforme en 12.5 px. Utiliser `ink-muted` (5.42) pour les dates/durées  |
| Placeholder `#6B7890` sur blanc          | 4.45   | 4.5     | Limite. `ink-muted` (5.42) recommandé                                       |
| Badge vert sur vert 12 %                 | 4.28   | 4.5     | Limite en 11.5 px gras. Éclaircir le fond (8 %) ou passer le texte en 13 px |
| Badge ambre texte sur ambre 16 %         | 3.54   | 4.5     | Non conforme. Fond 8 % ou texte `#9C600C`                                   |
| Contour bouton tertiaire (marine 45 %)   | 2.44   | 3       | Composant non conforme (WCAG 1.4.11). Contour 60 % (≈ 3.4) ou 1.5 px pleins |
| Contour de champ au repos (marine 30 %)  | 1.76   | 3       | Composant non conforme. Contour 55 % ou `rule-strong` + libellé visible     |

Les tokens conservent les valeurs validées de la charte ; le test fige les
ratios mesurés pour signaler toute dégradation supplémentaire.
