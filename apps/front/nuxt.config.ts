// https://nuxt.com/docs/api/configuration/nuxt-config

const apiBase = process.env.NUXT_API_BASE ?? 'http://localhost:3001'

export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },
  app: {
    head: {
      htmlAttrs: { lang: 'fr' }
    }
  },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBase
    }
  }
})
