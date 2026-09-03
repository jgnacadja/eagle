export function useDirectusAsset(fileId: string | null | undefined): string | null {
  if (!fileId) return null
  try {
    const config = useRuntimeConfig()
    const baseUrl = import.meta.server ? config.directusUrl : config.public.directusUrl
    return `${baseUrl}/assets/${fileId}`
  } catch {
    return null
  }
}
