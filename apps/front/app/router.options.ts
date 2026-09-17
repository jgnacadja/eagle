import type { RouterConfig } from '@nuxt/schema'

// Position restaurée par le router (back/forward) — null sinon.
type SavedPosition = { top: number; left: number } | null

// Types structurels : le module 'vue-router' est remplacé par le resolver
// typé de Nuxt et n'expose pas RouteLocationNormalized.
type RouteTarget = { hash: string; path: string }

// `scroll-behavior: smooth` (main.css) transforme la restauration native en
// animation : la nouvelle page se monte pendant que le scroll remonte et
// l'utilisateur atterrit au milieu. On attend `page:finish` puis on force
// `instant` pour le haut de page et la position sauvegardée ; les ancres
// gardent le smooth.
// Exception : un hash sur la même page ne déclenche pas `page:finish` — la
// cible existe déjà dans le DOM, on résout tout de suite.
const scrollBehavior = (to: RouteTarget, from: RouteTarget, savedPosition: SavedPosition) => {
  const nuxtApp = useNuxtApp()
  return new Promise<{
    el?: string
    top?: number
    left?: number
    behavior?: 'auto' | 'instant' | 'smooth'
  }>((resolve) => {
    if (to.hash && to.path === from.path) {
      // Back/forward vers une ancre même-page : la position sauvegardée
      // prime — scroller à l'élément ignorerait le point de départ réel.
      if (savedPosition) {
        resolve({ top: savedPosition.top, left: savedPosition.left, behavior: 'instant' })
      } else {
        resolve({ el: to.hash, behavior: 'smooth' })
      }
      return
    }
    nuxtApp.hooks.hookOnce('page:finish', () => {
      if (to.hash) {
        resolve({ el: to.hash, behavior: 'smooth' })
      } else if (savedPosition) {
        resolve({ top: savedPosition.top, left: savedPosition.left, behavior: 'instant' })
      } else {
        resolve({ top: 0, left: 0, behavior: 'instant' })
      }
    })
  })
}

export default <RouterConfig>{ scrollBehavior }
