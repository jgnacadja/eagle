<template>
  <header class="relative z-50 border-b border-rule bg-paper">
    <div
      ref="rootEl"
      class="relative mx-auto flex items-center px-gutter-mobile md:px-gutter py-3 text-sm"
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
            <NavigationMenuTrigger variant="header"> Formations </NavigationMenuTrigger>
            <NavigationMenuContent>
              <MegaMenuFormations @close="close" />
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem value="centres">
            <NavigationMenuTrigger variant="header"> Trouver un Centre </NavigationMenuTrigger>
            <NavigationMenuContent>
              <MegaMenuCentres @close="close" />
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem value="entreprise">
            <NuxtLink
              to="/entreprise"
              :class="
                cn(
                  navigationMenuTriggerStyle({ variant: 'header' }),
                  '[&.router-link-active]:border-accent'
                )
              "
            >
              Entreprise
            </NuxtLink>
          </NavigationMenuItem>

          <NavigationMenuItem value="apropos">
            <NavigationMenuTrigger variant="header"> À propos </NavigationMenuTrigger>
            <NavigationMenuContent>
              <MegaMenuAPropos @close="close" />
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem value="actualites">
            <NavigationMenuTrigger variant="header"> Actualités </NavigationMenuTrigger>
            <NavigationMenuContent>
              <MegaMenuActualites @close="close" />
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div class="ml-auto flex items-center gap-sm">
        <AssistantHeaderPill class="hidden xl:inline-flex" />
        <Button as-child variant="outline" size="pill-sm" class="lg:inline-flex gap-xs">
          <NuxtLink to="/rejoindre-le-reseau">
            Rejoindre le réseau <span class="link-arrow">→</span>
          </NuxtLink>
        </Button>

        <button
          type="button"
          :aria-controls="isMobileOpen ? 'mobile-menu' : undefined"
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

  <Transition name="menu-overlay">
    <div
      v-if="openMenu"
      class="fixed inset-0 z-40 hidden bg-ink/40 md:block"
      aria-hidden="true"
      @click="close"
    />
  </Transition>

  <MobileMenu v-model:open="isMobileOpen" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { cn } from '@/lib/utils'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '~/components/ui/navigation-menu'
import { useMegaMenu, type MegaMenuKey } from '~/composables/useMegaMenu'
import { useMenuPreload } from '~/composables/useMenuData'
import MegaMenuFormations from '~/components/Menu/mega-menu/MegaMenuFormations.vue'
import MegaMenuCentres from '~/components/Menu/mega-menu/MegaMenuCentres.vue'
import MegaMenuAPropos from '~/components/Menu/mega-menu/MegaMenuAPropos.vue'
import MegaMenuActualites from '~/components/Menu/mega-menu/MegaMenuActualites.vue'
import MobileMenu from '~/components/Menu/MobileMenu.vue'

const { openMenu, rootEl, close } = useMegaMenu()
useMenuPreload()
const isMobileOpen = ref(false)

// reka-ui gère l'ouverture des triggers (clic/survol) : on synchronise
// simplement l'état partagé, '' signifiant « tout est fermé ».
function onMenuUpdate(value: string) {
  openMenu.value = (value || null) as MegaMenuKey
}
</script>
