# apps/front — Conventions Nuxt 4

Lire d'abord `AGENTS.md` à la racine.

## Architecture

- `app/app.vue` avec `<NuxtPage :page-key="(route) => route.fullPath" />` — obligatoire pour que les routes dynamiques se rechargent.
- `app/pages/` : routing Nuxt 4 (`index.vue`, `[famille].vue`, `[famille]/[slug].vue`).
- `app/components/` : composants Vue, nommés PascalCase.
- `app/layouts/default.vue` : layout racine.
- `app/composables/` : auto-importés par Nuxt.
- `app/utils/` : utilitaires (logger, sanitizeHtml).

## Composables existants

- `useDirectusClient()` : client Directus (URL distincte selon SSR/navigateur).
- `useDirectusList<T>(collection, cacheKey, query?)` : liste Directus avec dégradation gracieuse (`[]` en cas d'erreur, log serveur).
- `useDirectusItemBySlug<T>(collection, slug, cacheKey)` : fiche par slug.
- `useContentSeo(source, fallbackTitle)` : met à jour `useHead` depuis les champs SEO Directus.
- `useCatalog()` à créer : appel API NestJS via `useAsyncData`, dégradation gracieuse similaire.

## Conventions UI

- **Tokens `@learnup/ui` uniquement** : couleurs, espacements, rayons, ombres, typographie. Pas de valeur en dur.
- Tailwind config étend `colors.primary`, `colors.ink`, `colors.surface`, `colors.paper`, `colors.rule`, `fontFamily.display/sans/mono`, `borderRadius`, `boxShadow`.
- Classes courantes : `text-ink`, `text-ink-muted`, `bg-paper`, `bg-surface`, `border-rule`, `font-display`, `font-sans`, `rounded-md`, `shadow-sm`, `hover:shadow-md`.

## SEO

- `useContentSeo()` pour les pages dynamiques.
- `@nuxtjs/seo` à configurer : `robots`, `sitemap`, `nuxt-og-image`, `nuxt-schema-org`.
- JSON-LD `Course` sur les fiches formations.
- Sitemap incluant les routes statiques + toutes les fiches et pages familles.

## Données

- SSR : `useAsyncData` avec `cacheKey` stable. Gestion d'erreur : log côté serveur, retour vide/dégradé, jamais de crash silencieux.
- Appels API : `useRuntimeConfig().public.apiBase` (`http://localhost:3001`).
- Sanitization : `sanitizeHtml()` de `app/utils/sanitizeHtml.ts` avant tout `v-html`.

## Tests

- Vitest + `@vue/test-utils` + `happy-dom`.
- Tests des composants page (liste, fiche, filtres).
- Mocks de `useAsyncData` et `$fetch`.

## Pas de TDD explicite

Les tests ne sont pas forcément écrits avant le code, mais chaque composant/page livré est couvert.
