import type { RouterConfig } from '@nuxt/schema'

type ScrollBehavior = NonNullable<RouterConfig['scrollBehavior']>
type ScrollParams = Parameters<ScrollBehavior>
type ScrollPosition = Awaited<ReturnType<ScrollBehavior>>

// `scroll-behavior: smooth` (main.css) transforme la restauration native en
// animation : la nouvelle page se monte pendant que le scroll remonte et
// l'utilisateur atterrit au milieu. On attend `page:finish` puis on force
// `instant` pour le haut de page et la position sauvegardée ; les ancres
// gardent le smooth.
const scrollBehavior: ScrollBehavior = (
  to: ScrollParams[0],
  _from: ScrollParams[1],
  savedPosition: ScrollParams[2]
) => {
  const nuxtApp = useNuxtApp()
  return new Promise<ScrollPosition>((resolve) => {
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
