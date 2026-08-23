import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  const config = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    credentials: 'include',
    onRequest({ options }) {
      if (auth.accessToken) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${auth.accessToken}`
        }
      }
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        auth.accessToken = null
        await navigateTo('/login')
      }
    }
  })

  return { provide: { api } }
})
