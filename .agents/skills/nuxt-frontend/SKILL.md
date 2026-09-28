---
name: nuxt-frontend
description: Conventions Nuxt 4 SSR pour apps/front. Utiliser pour les pages, composants, composables, SEO, appels API, animations Motion et utilisation des tokens UI.
license: MIT
metadata:
  author: learnup
  version: '1.1.0'
  domain: frontend
  triggers: nuxt, nuxt4, vue, apps/front, page, component, composable, useAsyncData, useContentSeo, tailwind, motion, animation, transition, reveal
---

# Nuxt frontend — EAGLE

## Règles bloquantes

- Valeurs de style via `@learnup/ui` / tokens CSS. **Jamais** de couleur, espacement, rayon, ombre ou police en dur.
- Pas de `console.*` hors `app/utils/logger.ts`.
- Aucun secret côté client (env public seulement).
- `v-html` uniquement après `sanitizeHtml()`.

## Patterns

- `app/app.vue` : `<NuxtPage :page-key="(route) => route.path" />` pour recharger les routes dynamiques. Query et hash exclus : ni une recherche (`?q=`) ni un clic dans un sommaire (`#section`) ne doivent remonter la page.
- Données : `useAsyncData(cacheKey, async () => { ... })`. Gestion d'erreur : log serveur si `import.meta.server`, retour vide/dégradé.
- API NestJS : `useRuntimeConfig().public.apiBase` + `$fetch`.
- Directus : `useDirectusClient()` + `useDirectusList()` / `useDirectusItemBySlug()`.
- SEO : `useContentSeo(source, fallbackTitle)` ; pour le catalogue, étendre avec JSON-LD `Course`, sitemap, OG.

## Tailwind

- Classes issues des tokens : `text-ink`, `text-ink-muted`, `bg-paper`, `bg-surface`, `border-rule`, `font-display`, `font-sans`, `rounded-md`, `shadow-sm`.
- Nouvelle valeur de style ? L'ajouter dans `@learnup/ui` (`tokens/colors.ts`, `tokens.css`) ou `apps/front/tailwind.config.ts` s'il s'agit d'une clé Tailwind, jamais en dur.

## Animations Motion

Sources de vérité — ne pas dupliquer :

- `app/utils/reveal.ts` : `MOTION_PRESETS` (`reveal`, `reveal-soft`, `reveal-media`, `hero`) + `revealStagger` / `heroStagger` (délais bornés).
- `nuxt.config.ts` : enregistrement via `motionV.presets = MOTION_PRESETS` ; `pageTransition: { name: 'page' }` sans `out-in`.
- `app/app.vue` : `MotionConfig reduced-motion="user"` centralise la désactivation.
- `app/assets/css/main.css` : transition route asymétrique (entrée `opacity + translateY` durée base/enter, sortie `opacity` fast/exit), `.motion-surface`, bloc `prefers-reduced-motion`.
- `@learnup/ui` : `tokens/motion.ts` + `tokens.css` (`--motion-duration-*`, `--motion-easing-*`).

Quelle directive utiliser :

- `v-hero` : bloc above-the-fold animé au montage (un seul bloc intro par page suffit).
- `v-hero="heroStagger(i)"` : séquence marketing hero de 4–7 éléments (badge, h1, sous-titre, formulaire, CTA…).
- `v-reveal-soft` : titres de sections et introductions éditoriales.
- `v-reveal` : cartes, listes, contenus secondaires au scroll.
- `v-reveal-media` : figures/images importantes (léger scale + translate).
- `.motion-surface` : élévation hover/focus des cartes interactives.

```vue
<h1 v-hero="heroStagger(0)">...</h1>
<p v-hero="heroStagger(1)">...</p>

<h2 v-reveal-soft>...</h2>
<ul>
  <li v-for="(item, index) in items" :key="item.id" v-reveal="revealStagger(index)">
    ...
  </li>
</ul>

<figure v-reveal-media>...</figure>

<script setup lang="ts">
import { heroStagger, revealStagger } from '~/utils/reveal'
</script>
```

Règles bloquantes :

- Ne jamais animer : maps Leaflet, barres sticky (filtres/nav), skeletons/loading, champs ou formulaires qui changent, contenu rerendu par filtres/query.
- Pas d'animation sur chaque petit élément : rester éditorial et léger ; `once: true` reste le défaut.
- Pas de duration/easing inline : utiliser preset ou tokens ; toute nouvelle valeur va dans `@learnup/ui` (`tokens/motion.ts` + `tokens.css`) puis dans le preset central.
- Ne pas contourner le reduced motion.

Piège `transform` : Motion écrit `transform` inline et annule les classes CSS `rotate-*`, `translate-*`, `scale-*` ou transforms au hover. Ne jamais mettre `v-reveal-media`/`v-hero` sur le même élément que ces classes : wrapper externe pour Motion, enfant pour le transform CSS.

Flèches : `.link-arrow` translate dès qu'un ancêtre `a`/`button` est en hover/focus. L'utiliser seulement si le mouvement est attendu sur toute la zone cliquable ; pour une flèche fixe (ex. `NetworkCard`), omettre la classe.

Cartes interactives : `class="motion-surface ..."` sur la racine. Ne pas cumuler avec `transition-all`, `hover:shadow-*` ou `hover:-translate-*` (redondants) ; les changements de couleur internes gardent leurs transitions ciblées (`transition-colors`).

Accessibilité / perf : `MotionConfig` central + CSS `prefers-reduced-motion` (animations/transitions off, `scroll-behavior: auto`) ; animer uniquement `opacity`/`transform` ; pas de `will-change` permanent ; pas de scroll animation forcée ; une animation ne doit jamais retarder l'interaction.

Checklist nouvelle page :

1. Hero : `v-hero` sur le bloc d'introduction (ou `heroStagger` si séquence marketing).
2. Titres de sections principales : `v-reveal-soft`.
3. Collections au scroll : `v-reveal="revealStagger(index)"`.
4. Médias/figures importants : `v-reveal-media`.
5. Cartes interactives : `.motion-surface`.
6. Exclusions : maps, sticky, skeletons, formulaires, contenus filtrés.
7. Vérifier mobile + `prefers-reduced-motion`.

## Tests

- Vitest + `@vue/test-utils` + `happy-dom`.
- Mocks `useAsyncData`, `$fetch`, `useRuntimeConfig`.
- Directives Motion stubbées dans `test/setup.ts` (`reveal`, `revealSoft`, `revealMedia`, `hero`).
- Helpers et presets couverts par `test/utils/reveal.spec.ts` ; les tests composant vérifient `motion-surface` si l'élévation fait partie du contrat.
- Commandes depuis la racine : `/opt/homebrew/bin/rtk pnpm --filter @learnup/front test`, `lint`, `build`.
