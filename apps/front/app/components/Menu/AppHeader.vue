<template>
  <header class="border-b border-rule bg-paper">
    <div
      ref="rootEl"
      class="relative mx-auto flex max-w-container items-center px-gutter-mobile md:px-gutter py-3"
    >
      <NuxtLink to="/" aria-label="LEARN UP ACADEMY — Accueil" class="inline-block">
        <Logo />
      </NuxtLink>

      <NavigationMenu
        class="ml-7 hidden md:flex"
        :model-value="openMenu ?? ''"
        aria-label="Navigation principale"
        disable-hover-trigger
        disable-pointer-leave-close
        @update:model-value="onMenuUpdate"
      >
        <NavigationMenuList class="gap-1">
          <NavigationMenuItem value="formations">
            <NavigationMenuTrigger
              class="border-b-2 border-transparent text-body font-semibold text-primary data-[state=open]:border-accent"
            >
              Formations
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <MegaMenuFormations @close="close" />
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem value="centres">
            <NavigationMenuTrigger
              class="border-b-2 border-transparent text-body font-semibold text-primary data-[state=open]:border-accent"
            >
              Centres
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <MegaMenuCentres @close="close" />
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem value="apropos">
            <NavigationMenuTrigger
              class="border-b-2 border-transparent text-body font-semibold text-primary data-[state=open]:border-accent"
            >
              À propos
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <MegaMenuAPropos @close="close" />
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem value="actualites">
            <NavigationMenuTrigger
              class="border-b-2 border-transparent text-body font-semibold text-primary data-[state=open]:border-accent"
            >
              Actualités
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <MegaMenuActualites @close="close" />
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div class="ml-auto flex items-center gap-sm">
        <NuxtLink
          to="/rejoindre-le-reseau"
          class="hidden text-body font-bold text-primary hover:text-ink md:inline underline underline-offset-4"
        >
          Rejoindre le réseau
        </NuxtLink>

        <button
          type="button"
          aria-controls="mobile-menu"
          :aria-expanded="isMobileOpen"
          aria-label="Ouvrir le menu"
          class="flex h-touch w-touch items-center justify-center rounded-md border border-rule text-ink md:hidden"
          @click="isMobileOpen = true"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
    </div>
  </header>

  <MobileMenu v-model:open="isMobileOpen" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger
} from '~/components/ui/navigation-menu'
import { useMegaMenu, type MegaMenuKey } from '~/composables/useMegaMenu'
import MegaMenuFormations from '~/components/Menu/mega-menu/MegaMenuFormations.vue'
import MegaMenuCentres from '~/components/Menu/mega-menu/MegaMenuCentres.vue'
import MegaMenuAPropos from '~/components/Menu/mega-menu/MegaMenuAPropos.vue'
import MegaMenuActualites from '~/components/Menu/mega-menu/MegaMenuActualites.vue'
import MobileMenu from '~/components/Menu/MobileMenu.vue'

const { openMenu, rootEl, close } = useMegaMenu()
const isMobileOpen = ref(false)

// reka-ui gère l'ouverture des triggers (clic/survol) : on synchronise
// simplement l'état partagé, '' signifiant « tout est fermé ».
function onMenuUpdate(value: string) {
  openMenu.value = (value || null) as MegaMenuKey
}
</script>
