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
  modules: ['shadcn-nuxt', '@nuxt/image'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  },
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui'
  },
  components: [{ path: '~/components', pathPrefix: false }],
  // SWR court : une page rendue pendant une panne API (données vides) ne doit
  // pas rester figée 10 min — 60 s max de contenu potentiellement dégradé.
  routeRules: {
    '/': { swr: 60 },
    '/formations/**': { swr: 60 },
    '/centres/**': { swr: 60 }
  },
  runtimeConfig: {
    apiBase,
    public: {
      apiBase: publicApiBase,
      siteUrl
    }
  }
})
