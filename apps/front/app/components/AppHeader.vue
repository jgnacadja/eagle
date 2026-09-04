<template>
  <header class="border-b border-rule bg-paper">
    <div class="mx-auto flex max-w-container items-center px-gutter-mobile md:px-gutter py-3">
      <NuxtLink to="/" aria-label="LEARN UP ACADEMY — Accueil" class="inline-block">
        <Logo />
      </NuxtLink>

      <nav
        class="ml-7 hidden items-center gap-7 text-body font-semibold text-primary md:flex"
        aria-label="Navigation principale"
      >
        <NuxtLink to="/" class="hover:text-ink">Formations</NuxtLink>
        <NuxtLink to="/centres" class="hover:text-ink">Centres</NuxtLink>
        <NuxtLink to="/" class="hover:text-ink">À propos</NuxtLink>
        <NuxtLink to="/" class="hover:text-ink">Actualités</NuxtLink>
      </nav>

      <div class="ml-auto">
        <NuxtLink
          to="/"
          class="hidden text-body font-bold text-primary hover:text-ink md:inline underline underline-offset-4"
        >
          Rejoindre le réseau
        </NuxtLink>

        <button
          ref="openBtn"
          type="button"
          aria-controls="mobile-menu"
          :aria-expanded="isOpen"
          aria-label="Ouvrir le menu"
          class="flex h-touch w-touch items-center justify-center rounded-md border border-rule text-ink md:hidden"
          @click="openMenu"
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

  <ClientOnly>
    <dialog
      v-if="isOpen"
      id="mobile-menu"
      open
      class="fixed inset-0 z-50 m-0 flex h-screen w-screen max-w-none flex-col border-0 bg-paper p-0 md:hidden"
      aria-label="Menu principal"
    >
      <div class="flex items-center justify-between border-b border-rule px-gutter-mobile py-md">
        <NuxtLink
          to="/"
          aria-label="LEARN UP ACADEMY — Accueil"
          class="inline-block"
          @click="closeMenu"
        >
          <Logo />
        </NuxtLink>

        <button
          ref="closeBtn"
          type="button"
          aria-label="Fermer le menu"
          class="flex h-touch w-touch items-center justify-center rounded-md bg-ink text-paper"
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

      <nav class="flex-1 overflow-y-auto px-gutter-mobile" aria-label="Menu de navigation">
        <ul class="divide-y divide-rule">
          <li v-for="link in mobileLinks" :key="`${link.to}-${link.label}`">
            <NuxtLink
              :to="link.to"
              class="flex items-center justify-between py-md text-h3 text-ink"
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
          to="/"
          class="mt-lg inline-block text-body font-semibold text-ink underline underline-offset-4"
          @click="closeMenu"
        >
          Rejoindre le réseau
        </NuxtLink>
      </nav>

      <div
        class="sticky bottom-0 flex flex-col gap-sm border-t border-rule bg-surface px-gutter-mobile py-lg"
      >
        <NuxtLink
          to="/"
          class="rounded-full bg-accent px-lg py-md text-center text-small font-semibold text-ink hover:bg-accent-text"
        >
          Confier ma formation
        </NuxtLink>
        <NuxtLink
          to="/"
          class="rounded-full border border-rule bg-paper px-lg py-md text-center text-small font-semibold text-ink hover:bg-paper"
        >
          Parler à un conseiller
        </NuxtLink>
        <p class="mt-xs text-center text-small text-ink-muted">
          01 84 60 00 00 <span class="mx-1">·</span> contact@learnup.fr
        </p>
      </div>
    </dialog>
  </ClientOnly>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

const isOpen = ref(false)
const openBtn = ref<HTMLButtonElement>()
const closeBtn = ref<HTMLButtonElement>()

const mobileLinks = [
  { to: '/', label: 'Formations' },
  { to: '/centres', label: 'Centres' },
  { to: '/', label: 'À propos' },
  { to: '/', label: 'Actualités' }
]

function openMenu() {
  isOpen.value = true
  document.body.classList.add('overflow-hidden')
  nextTick(() => closeBtn.value?.focus())
}

function closeMenu() {
  isOpen.value = false
  document.body.classList.remove('overflow-hidden')
  nextTick(() => openBtn.value?.focus())
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
  document.body.classList.remove('overflow-hidden')
})
</script>
