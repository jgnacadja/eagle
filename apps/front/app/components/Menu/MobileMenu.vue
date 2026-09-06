<template>
  <ClientOnly>
    <dialog
      v-if="open"
      id="mobile-menu"
      ref="dialogEl"
      class="fixed inset-0 z-50 m-0 flex h-dvh w-screen max-w-none flex-col border-0 bg-paper p-0 md:hidden"
      aria-label="Menu principal"
      aria-modal="true"
      @cancel.prevent="closeMenu"
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
        <Accordion type="multiple" class="divide-y divide-rule">
          <!-- FORMATIONS -->
          <AccordionItem value="formations" class="border-b-0">
            <AccordionTrigger class="py-md text-h3 text-ink hover:no-underline"
              >Formations</AccordionTrigger
            >
            <AccordionContent>
              <Accordion type="multiple" class="pb-sm pl-2">
                <div
                  v-for="famille in familles.filter((f) => f.slug !== 'caces-conduite-engins')"
                  :key="famille.slug"
                >
                  <NuxtLink
                    :to="`/formations/${famille.slug}`"
                    class="flex items-center justify-between py-2 text-body text-primary"
                    @click="closeMenu"
                  >
                    <span>{{ famille.label }}</span>
                    <span class="text-small text-ink-muted">{{ famille.count }}</span>
                  </NuxtLink>
                </div>

                <AccordionItem value="caces" class="border-b-0">
                  <AccordionTrigger class="py-2 text-body text-primary hover:no-underline">
                    <span class="flex w-full items-center justify-between pr-2">
                      <span>CACES & conduite d’engins</span>
                      <span class="text-small text-ink-muted">{{ cacesCount }}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul class="pl-2">
                      <li v-for="engin in enginsCaces" :key="engin.slug">
                        <NuxtLink
                          :to="`/formations/caces-conduite-engins/${engin.slug}`"
                          class="block py-2 text-body text-primary"
                          @click="closeMenu"
                        >
                          {{ engin.label }}
                        </NuxtLink>
                      </li>
                      <li>
                        <NuxtLink
                          to="/formations/caces-conduite-engins"
                          class="block py-2 text-small font-semibold text-ink underline underline-offset-4"
                          @click="closeMenu"
                        >
                          Voir la famille +
                        </NuxtLink>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <div>
                  <NuxtLink
                    to="/formations"
                    class="block py-2 text-small font-semibold text-ink underline underline-offset-4"
                    @click="closeMenu"
                  >
                    Tout le catalogue +
                  </NuxtLink>
                </div>
              </Accordion>
            </AccordionContent>
          </AccordionItem>

          <!-- CENTRES -->
          <AccordionItem value="centres" class="border-b-0">
            <AccordionTrigger class="py-md text-h3 text-ink hover:no-underline"
              >Centres</AccordionTrigger
            >
            <AccordionContent>
              <Accordion type="multiple" class="pb-sm pl-2">
                <div>
                  <NuxtLink
                    to="/centres"
                    class="flex items-center gap-2 py-2 text-body text-primary"
                    @click="closeMenu"
                  >
                    <svg
                      class="h-4 w-4 text-accent"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    Autour de moi
                  </NuxtLink>
                </div>

                <AccordionItem
                  v-for="region in regions.slice(0, 3)"
                  :key="region.slug"
                  :value="region.slug"
                  class="border-b-0"
                >
                  <AccordionTrigger class="py-2 text-body text-primary hover:no-underline">
                    <span class="flex w-full items-center justify-between pr-2">
                      <span>{{ region.label }}</span>
                      <span class="text-small text-ink-muted">{{ region.count }}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul class="pl-2">
                      <li
                        v-for="centre in (centresParRegion[region.slug] ?? []).slice(0, 3)"
                        :key="centre.slug"
                      >
                        <NuxtLink
                          :to="`/centres/${centre.slug}`"
                          class="flex items-center justify-between py-2 text-body text-primary"
                          @click="closeMenu"
                        >
                          <span>{{ centre.name }}</span>
                          <span class="text-small text-ink-muted">{{ centre.departement }}</span>
                        </NuxtLink>
                      </li>
                      <li>
                        <NuxtLink
                          to="/centres"
                          class="block py-2 text-small font-semibold text-ink underline underline-offset-4"
                          @click="closeMenu"
                        >
                          Tous les centres {{ region.label }} +
                        </NuxtLink>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <div>
                  <NuxtLink
                    to="/centres"
                    class="block py-2 text-small font-semibold text-ink underline underline-offset-4"
                    @click="closeMenu"
                  >
                    Voir la carte de région +
                  </NuxtLink>
                </div>
              </Accordion>
            </AccordionContent>
          </AccordionItem>

          <!-- À PROPOS -->
          <AccordionItem value="apropos" class="border-b-0">
            <AccordionTrigger class="py-md text-h3 text-ink hover:no-underline"
              >À propos</AccordionTrigger
            >
            <AccordionContent>
              <ul class="pb-sm pl-2">
                <li v-for="lien in aproposLiens" :key="lien.slug">
                  <NuxtLink
                    :to="`/a-propos/${lien.slug}`"
                    class="block py-2 text-body text-primary"
                    @click="closeMenu"
                  >
                    {{ lien.label }}
                  </NuxtLink>
                </li>
                <li v-for="lien in legalLiens" :key="lien.slug">
                  <NuxtLink
                    :to="`/legal/${lien.slug}`"
                    class="block py-2 text-body text-primary"
                    @click="closeMenu"
                  >
                    {{ lien.label }}
                  </NuxtLink>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <!-- ACTUALITÉS -->
          <AccordionItem value="actualites" class="border-b-0">
            <AccordionTrigger class="py-md text-h3 text-ink hover:no-underline"
              >Actualités</AccordionTrigger
            >
            <AccordionContent>
              <ul class="pb-sm pl-2">
                <li v-for="rubrique in rubriquesActualites" :key="rubrique.slug">
                  <NuxtLink to="/blog" class="block py-2 text-body text-primary" @click="closeMenu">
                    {{ rubrique.label }}
                  </NuxtLink>
                </li>
              </ul>
              <p class="pb-1 pl-2 text-small font-semibold text-ink-muted">Par région</p>
              <ul class="pb-sm pl-2">
                <li v-for="region in regions.slice(0, 2)" :key="region.slug">
                  <NuxtLink to="/blog" class="block py-2 text-body text-primary" @click="closeMenu">
                    {{ region.label }}
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink
                    to="/centres"
                    class="block py-2 text-small font-semibold text-ink underline underline-offset-4"
                    @click="closeMenu"
                  >
                    Toutes les régions +
                  </NuxtLink>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <NuxtLink
          to="/rejoindre-le-reseau"
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
          to="/etre-guide"
          class="rounded-full bg-accent px-lg py-md text-center text-small font-semibold text-ink hover:bg-accent-text"
          @click="closeMenu"
        >
          Être guidé dans mon choix
        </NuxtLink>
        <NuxtLink
          to="/confier-ma-formation"
          class="rounded-full bg-accent px-lg py-md text-center text-small font-semibold text-ink hover:bg-accent-text"
          @click="closeMenu"
        >
          Confier ma formation
        </NuxtLink>
        <NuxtLink
          to="/contact"
          class="rounded-full border border-rule bg-paper px-lg py-md text-center text-small font-semibold text-ink hover:bg-paper"
          @click="closeMenu"
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '~/components/ui/accordion'
import {
  familles,
  enginsCaces,
  regions,
  centresParRegion,
  aproposLiens,
  legalLiens,
  rubriquesActualites
} from '~/data/navigation'

const open = defineModel<boolean>('open', { default: false })
const dialogEl = ref<HTMLDialogElement>()
const closeBtn = ref<HTMLButtonElement>()
let previousFocus: Element | null = null

const cacesCount = computed(
  () => familles.find((f) => f.slug === 'caces-conduite-engins')?.count ?? 0
)

function closeMenu() {
  open.value = false
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value) closeMenu()
}

watch(
  open,
  (value) => {
    if (typeof document === 'undefined') return // SSR
    document.body.classList.toggle('overflow-hidden', value)
    if (value) {
      previousFocus = document.activeElement
      nextTick(() => {
        // showModal : focus trap + Échap natifs du <dialog>
        if (dialogEl.value && !dialogEl.value.open) dialogEl.value.showModal?.()
        closeBtn.value?.focus()
      })
    } else {
      nextTick(() => (previousFocus as HTMLElement | null)?.focus?.())
    }
  },
  { immediate: true }
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('overflow-hidden')
  ;(previousFocus as HTMLElement | null)?.focus?.()
})
</script>
