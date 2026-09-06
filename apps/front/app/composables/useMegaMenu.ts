// composables/useMegaMenu.ts
// Comportement commun aux 4 mega-menus desktop :
// - un seul menu ouvert à la fois
// - fermeture au clic en dehors du menu
// - fermeture avec Échap, focus rendu au déclencheur
// (reprend l'annotation « clic hors menu ou Échap : fermeture » de la maquette)

import { onBeforeUnmount, onMounted, ref } from 'vue'

export type MegaMenuKey = 'formations' | 'centres' | 'apropos' | 'actualites' | null

export function useMegaMenu() {
  const openMenu = ref<MegaMenuKey>(null)
  const rootEl = ref<HTMLElement>()

  function toggle(key: Exclude<MegaMenuKey, null>) {
    openMenu.value = openMenu.value === key ? null : key
  }

  function close() {
    openMenu.value = null
  }

  function isOpen(key: Exclude<MegaMenuKey, null>) {
    return openMenu.value === key
  }

  function onDocumentClick(event: MouseEvent) {
    if (!openMenu.value) return
    const target = event.target as Node
    if (rootEl.value && !rootEl.value.contains(target)) {
      close()
    }
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && openMenu.value) {
      close()
    }
  }

  onMounted(() => {
    document.addEventListener('click', onDocumentClick)
    document.addEventListener('keydown', onKeydown)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick)
    document.removeEventListener('keydown', onKeydown)
  })

  return { openMenu, rootEl, toggle, close, isOpen }
}
