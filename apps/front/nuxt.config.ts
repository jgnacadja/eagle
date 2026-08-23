// https://nuxt.com/docs/api/configuration/nuxt-config

const backendUrl = process.env.NUXT_API_BASE ?? 'http://localhost:3001'
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    apiBase: backendUrl,
    public: {
      apiBase: backendUrl
    }
  }
})
