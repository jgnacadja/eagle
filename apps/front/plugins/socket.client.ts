import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '~/stores/auth'

declare module '#app' {
  interface NuxtApp {
    $socket: Socket
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const socket: Socket = io(config.public.apiBase, {
    autoConnect: false,
    auth: (cb: (data: { token: string | null }) => void) => {
      cb({ token: authStore.accessToken })
    }
  })

  return { provide: { socket } }
})
