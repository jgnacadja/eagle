export default defineNuxtPlugin(() => {
  // `NUXT_*` peut porter un `/` final (copier-coller dashboard) — les appels
  // `${apiBase}/directus` donneraient `//directus`. La normalisation de
  // nuxt.config.ts ne couvre que le build ; le runtime override d'env arrive
  // tel quel ici, d'où la double sécurité.
  const config = useRuntimeConfig()
  config.apiBase = config.apiBase.replace(/\/+$/, '')
  config.public.apiBase = config.public.apiBase.replace(/\/+$/, '')
})
