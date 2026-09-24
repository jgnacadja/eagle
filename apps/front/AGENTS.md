# apps/front — Conventions Nuxt 4

Lire d'abord `AGENTS.md` à la racine.

## Architecture

- `app/app.vue` avec `<NuxtPage :page-key="(route) => route.path" />` — obligatoire pour que les routes dynamiques se rechargent. Query et hash exclus : ni une recherche (`?q=`) ni un clic dans un sommaire (`#section`) ne doivent remonter la page.
- `app/pages/` : routing Nuxt 4 (`index.vue`, `[famille].vue`, `[famille]/[slug].vue`).
- `app/components/` : composants Vue, nommés PascalCase.
- `app/layouts/default.vue` : layout racine.
- `app/composables/` : auto-importés par Nuxt.
- `app/utils/` : utilitaires (logger, sanitizeHtml).

## Composables existants

- `useDirectusClient()` : client Directus pointant sur le proxy `/directus` de l'API NestJS (le front ne contacte jamais Directus directement).
- `useDirectusList<T>(collection, cacheKey, query?)` : liste Directus avec dégradation gracieuse (`[]` en cas d'erreur, log serveur).
- `useDirectusItemBySlug<T>(collection, slug, cacheKey)` : fiche par slug.
- `useContentSeo(source, fallbackTitle)` : met à jour `useHead` depuis les champs SEO Directus.
- `useCatalog()` : appel API NestJS `/courses` via `useAsyncData`, clés de cache dérivées du JSON de la requête, dégradation gracieuse.

## Conventions UI

- **Tokens `@learnup/ui` uniquement** : couleurs, espacements, rayons, ombres, typographie. Pas de valeur en dur.
- Tailwind config étend `colors.primary`, `colors.ink`, `colors.surface`, `colors.paper`, `colors.rule`, `fontFamily.display/sans/mono`, `borderRadius`, `boxShadow`.
- Classes courantes : `text-ink`, `text-ink-muted`, `bg-paper`, `bg-surface`, `border-rule`, `font-display`, `font-sans`, `rounded-md`, `shadow-sm`, `hover:shadow-md`.

## Moteur IA — recherche assistée

- Route dédiée `/recherche-assistee` (`ASSISTANT_ROUTE`, `app/utils/assistant-route.ts` — seule source du libellé, arbitrage encore ouvert), requête initiale en `?q=` (deep-link partageable de l'entrée). Les échanges de la conversation ne modifient jamais l'URL.
- `layouts/assistant.vue` : vue pleine page (header du site, pas de footer). `AssistantShell` (`components/Assistant/`) porte les deux sorties : « Fermer » (retour à la page précédente) et « Nouvelle recherche » (réinitialise, reste dans le moteur).
- `useAssistantNavigation()` : `open({ query })` mémorise l'origine (`useState('assistant-origin')`) et navigue côté client ; `reset()` retire `?q=` en `replace` ; `close()` revient sur l'entrée d'historique précédente (`history.state.back`, cohérent avec le bouton précédent), sinon origine mémorisée ou Home en `replace`.
- `AssistantSearchBar` : champ d'entrée partagé (Home hero, bandeau final, page moteur) construit sur `SearchInput` taille `hero` — soumission vide = erreur de saisie liée au champ, jamais d'ouverture du moteur.
- `AssistantTrigger` : bouton « Être guidé dans mon choix » (méga-menu, menu mobile, catalogue, familles, fiches, entreprise-réseau) — `id` DOM stable et unique par emplacement (`assistant-trigger-*`), `query` optionnelle (recherche catalogue en cours), event `open` pour refermer un menu. `AssistantHeaderPill` : entrée compacte du header (pages intérieures, ≥ xl). Un lien statique (`NotFound.secondaryTo`) utilise `assistantEntryHref()`.
- Retour du focus : `open()` mémorise `triggerId` ; la page moteur appelle `restoreFocus()` en `onBeforeUnmount` → focus rendu au déclencheur après `page:finish`, uniquement si l'on revient sur la page d'origine.
- 11 états (maquette S0) : modèles de vue dans `app/types/assistant.ts`, composants `Assistant/*` (fil `AssistantThread` en `role="log"` + `aria-live="polite"`, cartes `AssistantRecommendationCard` — intitulé exact du catalogue, justification au conditionnel, disponibilité réelle uniquement, 1 CTA ambre max —, `AssistantComparison` tableau desktop / cartes mobile, `AssistantUnavailable`, etc.). Fixtures `app/data/assistant-demo.ts` servies via `/recherche-assistee?state=<id>` quand `runtimeConfig.public.assistantDemoStates` est vrai (dev par défaut, `NUXT_PUBLIC_ASSISTANT_DEMO_STATES=true` sur les previews) ; DEV-CORE branchera les données réelles.
- SEO : page en `noindex, follow` (meta via `useSeoMeta` + en-tête `X-Robots-Tag` en `routeRules`, `isr: false`), à exclure du sitemap ; la Home reste indexable avec le champ d'entrée.

## SEO

- `useContentSeo()` pour les pages dynamiques.
- `@nuxtjs/seo` à configurer : `robots`, `sitemap`, `nuxt-og-image`, `nuxt-schema-org`.
- JSON-LD `Course` sur les fiches formations.
- Sitemap incluant les routes statiques + toutes les fiches et pages familles.

## Données

- SSR : `useAsyncData` avec `cacheKey` stable. Le payload SSR n'est resservi que pendant l'hydratation (`ctx.cause === 'initial' && nuxtApp.isHydrating` dans `getCachedData`) — ensuite chaque mount/refetch repart sur des données fraîches pour ne pas figer un résultat vide ou transitoire.
- Cache ISR au niveau des routes : `nuxt.config.ts` configure `routeRules` en `isr` + `passQuery` (la query fait partie de la clé de cache — sinon les filtres serviraient du HTML non filtré).
- Gestion d'erreur : log côté serveur, retour vide/dégradé, jamais de crash silencieux.
- Appels API : `useRuntimeConfig().public.apiBase` (`http://localhost:3001`).
- Les fetches SSR passent `x-internal-ssr` via `internalSsrHeaders(config)` (`app/utils/ssrHeaders.ts`) : bypass du rate-limit public pour ne pas mutualiser tous les visiteurs sur l'IP du serveur Nuxt. Token : `NUXT_INTERNAL_API_TOKEN`.
- Sanitization : `sanitizeHtml()` de `app/utils/sanitizeHtml.ts` avant tout `v-html`.

## Tests

- Vitest + `@vue/test-utils` + `happy-dom`.
- Tests des composants page (liste, fiche, filtres).
- Mocks de `useAsyncData` et `$fetch`.

## Pas de TDD explicite

Les tests ne sont pas forcément écrits avant le code, mais chaque composant/page livré est couvert.
