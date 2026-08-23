export function useAuthSubmit(fallbackMessage: string) {
  const error = ref('')
  const loading = ref(false)

  async function handleSubmit(fn: () => Promise<void>): Promise<void> {
    error.value = ''
    loading.value = true
    try {
      await fn()
    } catch (e: unknown) {
      error.value =
        (e as { data?: { message?: string | string[] } })?.data?.message?.toString() ??
        fallbackMessage
    } finally {
      loading.value = false
    }
  }

  return { error, loading, handleSubmit }
}
