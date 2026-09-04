// https://nuxt.com/docs/api/configuration/nuxt-config
import { typography } from '@learnup/ui'

const apiBase = process.env.NUXT_API_BASE ?? 'http://localhost:3001'
// Deux valeurs distinctes : le rendu SSR tourne dans le conteneur front et
// doit joindre Directus via le nom de service Docker (`directus`), alors que
// le navigateur (hydratation, navigation client) ne connaît que l'URL
// publique. Sans Docker, les deux valeurs par défaut sont identiques.
const directusUrlServer = process.env.NUXT_DIRECTUS_URL ?? 'http://localhost:8055'
const directusUrlPublic = process.env.NUXT_PUBLIC_DIRECTUS_URL ?? 'http://localhost:8055'

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
  modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt'],
  css: ['~/assets/css/main.css'],
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css'
  },
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui'
  },
  runtimeConfig: {
    directusUrl: directusUrlServer,
    public: {
      apiBase,
      directusUrl: directusUrlPublic
    }
  }
})
