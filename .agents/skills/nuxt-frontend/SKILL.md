---
name: nuxt-frontend
description: Conventions Nuxt 4 SSR pour apps/front. Utiliser pour les pages, composants, composables, SEO, appels API et utilisation des tokens UI.
license: MIT
metadata:
  author: learnup
  version: '1.0.0'
  domain: frontend
  triggers: nuxt, nuxt4, vue, apps/front, page, component, composable, useAsyncData, useContentSeo, tailwind
---

# Nuxt frontend — EAGLE

## Règles bloquantes

- Valeurs de style via `@learnup/ui` / tokens CSS. **Jamais** de couleur, espacement, rayon, ombre ou police en dur.
- Pas de `console.*` hors `app/utils/logger.ts`.
- Aucun secret côté client (env public seulement).
- `v-html` uniquement après `sanitizeHtml()`.

## Patterns

- `app/app.vue` : `<NuxtPage :page-key="(route) => route.fullPath" />` pour recharger les routes dynamiques.
- Données : `useAsyncData(cacheKey, async () => { ... })`. Gestion d'erreur : log serveur si `import.meta.server`, retour vide/dégradé.
- API NestJS : `useRuntimeConfig().public.apiBase` + `$fetch`.
- Directus : `useDirectusClient()` + `useDirectusList()` / `useDirectusItemBySlug()`.
- SEO : `useContentSeo(source, fallbackTitle)` ; pour le catalogue, étendre avec JSON-LD `Course`, sitemap, OG.

## Tailwind

- Classes issues des tokens : `text-ink`, `text-ink-muted`, `bg-paper`, `bg-surface`, `border-rule`, `font-display`, `font-sans`, `rounded-md`, `shadow-sm`.
- Nouvelle valeur de style ? L'ajouter dans `@learnup/ui` (`tokens/colors.ts`, `tokens.css`) ou `apps/front/tailwind.config.ts` s'il s'agit d'une clé Tailwind, jamais en dur.

## Tests

- Vitest + `@vue/test-utils` + `happy-dom`.
- Mocks `useAsyncData`, `$fetch`, `useRuntimeConfig`.
