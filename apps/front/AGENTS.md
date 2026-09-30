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
- `useAssistant(context, { onReply })` : machine à états de la recherche assistée (`POST /assistant/message`). Fil de conversation, envoi/réessai/reset, chips de contexte et slots (effectif, lieu) agrégés pour pré-remplir `demande-de-formation` (`besoin`, `salaries`, `lieu`). `onReply(reply, { turn })` est appelé pour chaque réponse réelle de l'API (jamais l'accueil local).
- `useAssistantLauncher()` : ouverture du widget `AssistantChat` (panneau bas-droite, monté dans `app.vue`). Les points d'entrée appellent `open({ context, message })` — jamais de navigation dédiée.
- `useAssistantAnalytics()` : jalons analytics du moteur IA (`ai_search_start/submit`, `ai_clarification_requested/answer`, `ai_recommendation_display/select`), construits sur `trackEvent()` (`app/utils/analytics.ts` → `window.dataLayer`, convention GTM, no-op côté serveur). Paramètres = source, rang du tour, type de réponse, slug — **jamais le texte saisi**. Câblés dans `AssistantChat` (le seul orchestrateur) ; `AssistantConversation` et les cartes se contentent d'émettre `send(value, via)` et `select({ slug, rank, action })`.

## Conventions UI

- **Tokens `@learnup/ui` uniquement** : couleurs, espacements, rayons, ombres, typographie. Pas de valeur en dur.
- Tailwind config étend `colors.primary`, `colors.ink`, `colors.surface`, `colors.paper`, `colors.rule`, `fontFamily.display/sans/mono`, `borderRadius`, `boxShadow`.
- Classes courantes : `text-ink`, `text-ink-muted`, `bg-paper`, `bg-surface`, `border-rule`, `font-display`, `font-sans`, `rounded-md`, `shadow-sm`, `hover:shadow-md`.

## Moteur IA — recherche assistée

- **Panneau conversationnel (en place)** : tous les points d'entrée appellent `useAssistantLauncher().open({ context, message })` ; `AssistantChat` (monté dans `app.vue`) affiche la conversation portée par `useAssistant()` (`POST /assistant/message`). `AssistantHeaderPill` est l'entrée compacte du header (≥ `xl`, pages intérieures uniquement).
- **Rendu progressif** : l'API répond une décision JSON (pas de flux de tokens — le streaming réel relève de BACKEND-A) ; le transport `useChat` l'encapsule déjà dans le protocole de flux, et le fil (`MessageScrollerContent`) est une région `role="log"` + `aria-live="polite"` marquée `aria-busy` pendant l'analyse : chaque réponse est annoncée à son arrivée.
- **Escalade conseiller** : toutes les sorties « conseiller » du panneau (pied des recommandations, carte sans session, aucun résultat, hors catalogue, indisponible, comparaison) pointent vers `/parler-a-votre-conseiller?q=<besoin>` — le besoin en langage naturel (messages utilisateur agrégés, 500 caractères max) pré-remplit « Votre besoin en quelques mots ». Les CTA « Demander » gardent `demande-de-formation` (`famille`, `formation`, `session`, `besoin`, `salaries`, `lieu`).
- **Page dédiée (coquille, pas encore reliée aux points d'entrée)** : route `/recherche-assistee` (`ASSISTANT_ROUTE`, `app/utils/assistant-route.ts` — seule source du libellé, arbitrage encore ouvert), requête initiale en `?q=` (deep-link partageable de l'entrée). L'arbitrage panneau / page reste à prendre : le lanceur flottant est masqué sur cette page.
- `layouts/assistant.vue` : vue pleine page (header du site, pas de footer). `AssistantShell` (`components/Assistant/`) porte les deux sorties : « Fermer » (retour à la page précédente) et « Nouvelle recherche » (réinitialise, reste dans le moteur).
- `useAssistantNavigation()` : `open({ query })` mémorise l'origine (`useState('assistant-origin')`) et navigue côté client ; `reset()` retire `?q=` en `replace` ; `close()` revient sur l'entrée d'historique précédente (`history.state.back`, cohérent avec le bouton précédent), sinon origine mémorisée ou Home en `replace`.
- `AssistantSearchBar` : champ d'entrée de la page moteur, construit sur `SearchInput` taille `hero` — soumission vide = erreur de saisie liée au champ (`emptyErrorMessage`), jamais d'ouverture du moteur.
- 11 états statiques (maquette S0, revue design) : composants `components/AssistantStates/*` — distincts des composants du panneau (`components/Assistant/`) —, modèles de vue dans `app/types/assistant.ts` (fil `AssistantThread` en `role="log"` + `aria-live="polite"`, cartes `AssistantStaticRecommendationCard` — intitulé exact du catalogue, justification au conditionnel, disponibilité réelle uniquement, 1 CTA ambre max —, `AssistantComparison` tableau desktop / cartes mobile, `AssistantUnavailable`, etc.). Fixtures `app/data/assistant-demo.ts` servies via `/recherche-assistee?state=<id>` quand `runtimeConfig.public.assistantDemoStates` est vrai (dev par défaut, `NUXT_PUBLIC_ASSISTANT_DEMO_STATES=true` sur les previews).
- SEO : page en `noindex, follow` (meta via `useSeoMeta` + en-tête `X-Robots-Tag` en `routeRules`, `isr: false`), exclue du sitemap (`sitemap.exclude`).

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
