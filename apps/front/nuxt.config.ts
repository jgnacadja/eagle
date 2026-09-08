// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'
import { typography } from '@learnup/ui'

const apiBase = process.env.NUXT_API_BASE ?? 'http://localhost:3001'
// Deux valeurs distinctes : le rendu SSR tourne dans le conteneur front et
// doit joindre l'API via le nom de service Docker (`api`), alors que le
// navigateur (hydratation, navigation client) ne connaît que l'URL publique.
// Directus n'est jamais contacté directement : l'API expose un proxy
// `/directus` (apps/api/src/directus).
const publicApiBase = process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001'
const directusUrlPublic = process.env.NUXT_PUBLIC_DIRECTUS_URL ?? 'http://localhost:8055'
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ?? 'https://learnup.fr'

export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      link: [
        // Figtree (charte §03) — l'URL vit dans @learnup/ui avec les autres tokens.
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: typography.googleFontsUrl }
      ]
    }
  },
  modules: ['shadcn-nuxt', '@nuxt/image', '@stefanobartoletti/nuxt-social-share'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  },
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui'
  },
  components: [{ path: '~/components', pathPrefix: false }],
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
    '/centres/**': { isr: { expiration: 600, passQuery: true } }
  },
  runtimeConfig: {
    apiBase,
    public: {
      apiBase: publicApiBase,
      siteUrl,
      directusUrl: directusUrlPublic,
      socialShare: {
        baseUrl: siteUrl
      }
    }
  }
})
