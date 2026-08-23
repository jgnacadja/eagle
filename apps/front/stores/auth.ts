import { defineStore } from 'pinia'

interface AuthUser {
  id: string
  firstname: string
  lastname: string
  email: string
}

interface RegisterPayload {
  firstname: string
  lastname: string
  email: string
  confirmEmail: string
  password: string
  confirmPassword: string
}

interface LoginPayload {
  email: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(null)
  const isAuthenticated = computed(() => !!accessToken.value)

  const userEmail = computed<string | null>(() => {
    if (!accessToken.value) return null
    try {
      const b64 = accessToken.value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(b64)) as { email?: string }
      return payload.email ?? null
    } catch {
      return null
    }
  })

  async function register(payload: RegisterPayload): Promise<void> {
    const config = useRuntimeConfig()
    const data = await $fetch<{ accessToken: string }>('/auth/register', {
      method: 'POST',
      baseURL: config.public.apiBase,
      body: payload,
      credentials: 'include'
    })
    accessToken.value = data.accessToken
  }

  async function login(payload: LoginPayload): Promise<void> {
    const config = useRuntimeConfig()
    const data = await $fetch<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      baseURL: config.public.apiBase,
      body: payload,
      credentials: 'include'
    })
    accessToken.value = data.accessToken
  }

  async function refresh(): Promise<boolean> {
    try {
      const config = useRuntimeConfig()
      const data = await $fetch<{ accessToken: string }>('/auth/refresh', {
        method: 'POST',
        baseURL: config.public.apiBase,
        credentials: 'include'
      })
      accessToken.value = data.accessToken
      return true
    } catch {
      accessToken.value = null
      user.value = null
      return false
    }
  }

  async function logout(): Promise<void> {
    const config = useRuntimeConfig()
    await $fetch('/auth/logout', {
      method: 'POST',
      baseURL: config.public.apiBase,
      headers: accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {},
      credentials: 'include'
    }).catch(() => null)
    accessToken.value = null
    user.value = null
    await navigateTo('/login')
  }

  return { user, accessToken, isAuthenticated, userEmail, register, login, refresh, logout }
})
