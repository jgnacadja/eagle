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
- `useAssistantAnalytics()` : jalons analytics du moteur IA (`ai_search_start/submit`, `ai_clarification_requested/answer`, `ai_recommendation_display/select`), contrat `AssistantAnalytics`, construits sur `trackEvent()` (`app/utils/analytics.ts` → `window.dataLayer`, convention GTM, no-op côté serveur, jamais d'exception — noms d'événements dans l'union `AnalyticsEventName`). Paramètres = source, rang du tour, type de réponse, slug — **jamais le texte saisi**. Aucun conteneur GTM n'est chargé : le ticket d'intégration devra poser le Consent Mode `default: denied` avant le conteneur.
- `useAssistantTracking(assistant, context)` : classification des jalons (nouveau besoin vs réponse à une précision, message de point d'entrée = toujours un nouveau besoin, envoi ignoré pendant l'analyse, rang du tour édité, début de recherche seulement sur conversation vierge ou message d'entrée). `AssistantChat` relaie seulement ; `AssistantConversation` et les cartes émettent `send(value, via)` et `select({ slug, rank, action })`.
- `utils/assistant-handoff.ts` : le besoin décrit (+ effectif, lieu) est transmis au tunnel de demande et à la page conseiller **hors URL**, dans l'état d'historique de la navigation (`NuxtLink :to="{ path, query, state }"` → `history.state.assistantHandoff`, conservé au rechargement et au retour arrière). Les pages le lisent au montage (`readHandoff()`), jamais côté serveur. Aucun texte libre en query string : `page_location`, `Referer` et journaux restent propres (RGPD).

## Conventions UI

- **Tokens `@learnup/ui` uniquement** : couleurs, espacements, rayons, ombres, typographie. Pas de valeur en dur.
- Tailwind config étend `colors.primary`, `colors.ink`, `colors.surface`, `colors.paper`, `colors.rule`, `fontFamily.display/sans/mono`, `borderRadius`, `boxShadow`.
- Classes courantes : `text-ink`, `text-ink-muted`, `bg-paper`, `bg-surface`, `border-rule`, `font-display`, `font-sans`, `rounded-md`, `shadow-sm`, `hover:shadow-md`.

## Moteur IA — recherche assistée

- **Panneau conversationnel (en place)** : tous les points d'entrée appellent `useAssistantLauncher().open({ context, message })` ; `AssistantChat` (monté dans `app.vue`) affiche la conversation portée par `useAssistant()` (`POST /assistant/message`). `AssistantHeaderPill` est l'entrée compacte du header (≥ `xl`, pages intérieures uniquement).
- **Rendu progressif** : l'API répond une décision JSON (pas de flux de tokens — le streaming réel relève de BACKEND-A) ; le transport `useChat` l'encapsule déjà dans le protocole de flux. Le fil (`MessageScrollerContent`, `role="log"`) est la **seule** région live : polie, additions — chaque ajout (squelette d'analyse, réponse) est annoncé. Pas d'`aria-busy` (il suspendrait les annonces) ni de région imbriquée (double annonce). L'annonce d'une réponse `recommend` est longue : à valider au lecteur d'écran.
- **Escalade conseiller** : toutes les sorties « conseiller » du panneau (pied des recommandations, carte sans session, aucun résultat, hors catalogue, indisponible, comparaison, mode dégradé) pointent vers `/parler-a-votre-conseiller`, le besoin en langage naturel transmis hors URL (`assistant-handoff`, 500 caractères max) pré-remplit « Votre besoin en quelques mots » au montage sans écraser une saisie. Les CTA « Demander » pointent vers `demande-de-formation` avec les seuls identifiants en query (`famille`, `formation`, `session`) ; besoin, effectif et lieu arrivent par le même canal (bloc D1, champs pré-remplis avant le brouillon éventuel). Le clic est tracé par délégation dans `AssistantChat` : chaque lien de sortie porte `data-advisor-escalation="<état>"` (`ai_advisor_escalation`, `from` = état d'origine, jamais déduit du `href`).
- **Mode dégradé** : quand l'API répond `mode: 'fallback'` (IA indisponible → recherche déterministe, `DegradedModeService`), `AssistantChat` passe `degraded` à la conversation : bandeau `role="status"` toujours présent dans le DOM (`sr-only` hors dégradé — WCAG 4.1.3) « Recherche simplifiée » avec sortie conseiller, libellé sur chaque réponse concernée dans l'historique, jalon `ai_fallback_mode`. `reply.source` (mention RG-IA-01, sous les recommandations) et `reply.notice` (« assistant automatisé », sous le champ de saisie) sont affichés tels que renvoyés — jamais réécrits côté front.
- **États limites** : disponibilité / sans session (carte), aucun résultat, hors catalogue, indisponible (E9), comparaison (dès 2 formations), historique conservé tant que l'application vit (le widget n'est jamais démonté ; fermer puis rouvrir ne ré-accueille pas). Jalons : `ai_no_results` (kind), `ai_unavailable`, `ai_recommendation_compare`.
- **Pas de page dédiée** : l'arbitrage a retenu le panneau (modale plein écran + lanceur flottant). La page `/recherche-assistee`, son layout, les 11 états statiques (`AssistantStates/*`), `AssistantShell`, `AssistantSearchBar`, `useAssistantNavigation` et les fixtures de démo ont été retirés — les états vivent dans `AssistantConversation` (`components/Assistant/`), branchés sur les réponses réelles de l'API. Ne pas les réintroduire sans nouvel arbitrage. `/recherche-assistee` redirige en 301 vers la Home (`routeRules`) pour les liens partagés et favoris.

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
