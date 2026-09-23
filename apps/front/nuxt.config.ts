// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'
import { typography } from '@learnup/ui'
import { REVEAL_TRANSITION } from './app/utils/reveal'

const apiBase = process.env.NUXT_API_BASE ?? 'http://localhost:3001'
// Deux valeurs distinctes : le rendu SSR tourne dans le conteneur front et
// doit joindre l'API via le nom de service Docker (`api`), alors que le
// navigateur (hydratation, navigation client) ne connaît que l'URL publique.
// Directus n'est jamais contacté directement : l'API expose un proxy
// `/directus` (apps/api/src/directus).
const publicApiBase = process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001'
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ?? 'https://learnup.fr'

export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'fr' },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        // Figtree (charte §03) — l'URL vit dans @learnup/ui avec les autres tokens.
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: typography.googleFontsUrl }
      ]
    }
  },
  modules: ['shadcn-nuxt', '@nuxt/image', 'motion-v/nuxt'],
  motionV: {
    directives: true,
    presets: {
      reveal: {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        inViewOptions: { once: true, margin: '0px 0px -6% 0px' },
        transition: REVEAL_TRANSITION
      }
    }
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  },
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui'
  },
  components: [
    { path: '~/components/Legal', prefix: 'Legal' },
    { path: '~/components', pathPrefix: false, pattern: ['**/*.vue', '!Legal/**/*.vue'] }
  ],
  nitro: {
    externals: {
      // Bundler plutôt que tracer dans node_modules : le runtime Vercel
      // bloque require() de modules ESM (htmlparser2 est ESM-only).
      inline: [
        'sanitize-html',
        'htmlparser2',
        'entities',
        'domutils',
        'domhandler',
        'dom-serializer'
      ]
    }
  },
  routeRules: {
    // isr + passQuery (pas swr) : sans ça, Vercel met en cache par path en
    // ignorant la query — /formations?q=x servirait le HTML/payload non
    // filtré et la recherche/filtres/pagination ne feraient rien. Pas de
    // passQuery sur '/' : la home n'a pas de query, chaque paramètre
    // arbitraire (?utm_*, …) créerait une entrée ISR distincte.
    '/': { isr: { expiration: 600 } },
    '/formations': { isr: { expiration: 600, passQuery: true } },
    '/formations/**': { isr: { expiration: 600, passQuery: true } },
    '/centres': { isr: { expiration: 600, passQuery: true } },
    '/centres/**': { isr: { expiration: 600, passQuery: true } },
    '/actualites': { isr: { expiration: 600, passQuery: true } },
    '/actualites/**': { isr: { expiration: 600, passQuery: true } },
    '/rejoindre-le-reseau': { prerender: true },
    '/referencer-mon-organisme': { prerender: true },
    // Pages légales et tout slug racine ([slug]) — impossible à cibler par
    // préfixe. Une page fraîchement publiée apparaît grâce à la purge complète
    // déclenchée par le flow Directus (pages_legales non mappée côté front).
    '/**': { isr: { expiration: 600 } },
    '/api/**': { isr: false }
  },
  runtimeConfig: {
    apiBase,
    // Secret serveur → API : bypass du rate-limit public pour les fetches SSR
    // (sans ça, tous les visiteurs partagent le bucket de l'IP du front).
    internalApiToken: process.env.NUXT_INTERNAL_API_TOKEN ?? '',
    // Secret Directus → front : purge du cache ISR (x-cache-secret).
    cachePurgeSecret: process.env.NUXT_CACHE_PURGE_SECRET ?? '',
    public: {
      apiBase: publicApiBase,
      siteUrl
    }
  }
})
