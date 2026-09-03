<template>
  <header class="border-b border-rule bg-paper">
    <div class="mx-auto flex max-w-container items-center justify-between px-6 py-4">
      <NuxtLink to="/" class="flex items-center gap-2">
        <AppLogo />
        <div class="leading-tight">
          <p class="text-xs font-extrabold tracking-wide text-ink">LEARN UP ACADEMY</p>
          <p class="text-[9px] tracking-widest text-ink-subtle uppercase">Réseau de formation</p>
        </div>
      </NuxtLink>

      <nav class="hidden items-center gap-8 text-sm font-medium text-ink-muted md:flex">
        <NuxtLink to="/formations" class="hover:text-ink">Formations</NuxtLink>
        <NuxtLink to="/centres" class="hover:text-ink">Centres</NuxtLink>
        <NuxtLink to="/a-propos" class="hover:text-ink">À propos</NuxtLink>
        <NuxtLink to="/actualites" class="hover:text-ink">Actualités</NuxtLink>
      </nav>

      <NuxtLink
        to="/rejoindre"
        class="hidden text-sm font-semibold text-accent-text hover:text-accent md:inline underline underline-offset-4"
      >
        Rejoindre le réseau
      </NuxtLink>

      <button
        type="button"
        aria-controls="mobile-menu"
        aria-expanded="false"
        aria-label="Ouvrir le menu"
        class="flex h-11 w-11 items-center justify-center rounded-md border border-rule text-ink md:hidden"
        @click="openMenu"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
    </div>
  </header>

  <ClientOnly>
    <div
      v-if="isOpen"
      id="mobile-menu"
      class="fixed inset-0 z-50 flex flex-col bg-paper md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu principal"
    >
      <div class="flex items-center justify-between border-b border-rule px-6 py-4">
        <NuxtLink to="/" class="flex items-center gap-2" @click="closeMenu">
          <AppLogo />
          <div class="leading-tight">
            <p class="text-xs font-extrabold tracking-wide text-ink">LEARN UP ACADEMY</p>
            <p class="text-[9px] tracking-widest text-ink-subtle uppercase">Réseau de formation</p>
          </div>
        </NuxtLink>

        <button
          type="button"
          aria-label="Fermer le menu"
          class="flex h-11 w-11 items-center justify-center rounded-md bg-ink text-paper"
          @click="closeMenu"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto px-6">
        <ul class="divide-y divide-rule">
          <li v-for="link in mobileLinks" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="flex items-center justify-between py-5 text-xl font-bold text-ink"
              @click="closeMenu"
            >
              {{ link.label }}
              <svg
                class="h-5 w-5 text-accent"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </NuxtLink>
          </li>
        </ul>

        <NuxtLink
          to="/rejoindre"
          class="mt-6 inline-block text-base font-semibold text-ink underline underline-offset-4"
          @click="closeMenu"
        >
          Rejoindre le réseau
        </NuxtLink>
      </nav>

      <div class="sticky bottom-0 flex flex-col gap-3 border-t border-rule bg-surface px-6 py-6">
        <NuxtLink
          to="/confier"
          class="rounded-full bg-accent px-6 py-3.5 text-center text-sm font-semibold text-ink hover:bg-accent-text"
        >
          Confier ma formation
        </NuxtLink>
        <NuxtLink
          to="/contact"
          class="rounded-full border border-rule bg-paper px-6 py-3.5 text-center text-sm font-semibold text-ink hover:bg-paper"
        >
          Parler à un conseiller
        </NuxtLink>
        <p class="mt-1 text-center text-sm text-ink-muted">
          01 84 60 00 00 <span class="mx-1">·</span> contact@learnup.fr
        </p>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isOpen = ref(false)

const mobileLinks = [
  { to: '/formations', label: 'Formations' },
  { to: '/centres', label: 'Centres' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/actualites', label: 'Actualités' }
]

function openMenu() {
  isOpen.value = true
}

function closeMenu() {
  isOpen.value = false
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isOpen.value) {
    closeMenu()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>
