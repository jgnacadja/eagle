<template>
  <ClientOnly>
    <Transition name="mobile-menu">
      <dialog
        v-if="open"
        id="mobile-menu"
        ref="dialogEl"
        class="fixed inset-0 z-50 m-0 flex h-dvh w-screen max-w-none max-h-none flex-col border-0 bg-paper p-0 md:hidden"
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
            class="flex h-touch w-touch items-center justify-center rounded-md border border-rule text-ink"
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
            <AccordionItem value="formations" variant="menu">
              <AccordionTrigger variant="menu">Formations</AccordionTrigger>
              <AccordionContent>
                <Accordion type="multiple" class="pb-sm">
                  <template v-for="famille in familles ?? []" :key="famille.slug">
                    <AccordionItem
                      v-if="sousFamillesFor(famille.slug).length"
                      :value="famille.slug"
                      variant="submenu"
                    >
                      <AccordionTrigger variant="submenu">
                        <span class="flex w-full items-center justify-between pr-2">
                          <span>{{ famille.label }}</span>
                          <span class="text-small text-ink-muted">{{ famille.count }}</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul class="px-3">
                          <li
                            v-for="sousFamille in sousFamillesFor(famille.slug)"
                            :key="sousFamille.slug"
                          >
                            <NuxtLink
                              :to="{
                                path: `/formations/${famille.slug}`,
                                query: { subFamily: sousFamille.slug }
                              }"
                              class="flex items-center justify-between py-2 text-body text-primary transition-colors hover:text-accent-text"
                              @click="closeMenu"
                            >
                              <span>{{ sousFamille.label }}</span>
                              <span class="text-small text-ink-muted">{{ sousFamille.count }}</span>
                            </NuxtLink>
                          </li>
                          <li>
                            <NuxtLink
                              :to="`/formations/${famille.slug}`"
                              class="block py-2 text-small font-semibold text-ink transition-colors hover:text-accent-text"
                              @click="closeMenu"
                            >
                              Voir la famille <span class="link-arrow">→</span>
                            </NuxtLink>
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <NuxtLink
                      v-else
                      :to="`/formations/${famille.slug}`"
                      class="flex items-center justify-between px-3 py-2 text-body text-primary transition-colors hover:text-accent-text"
                      @click="closeMenu"
                    >
                      <span>{{ famille.label }}</span>
                      <span class="text-small text-ink-muted">{{ famille.count }}</span>
                    </NuxtLink>
                  </template>

                  <div>
                    <NuxtLink
                      to="/formations"
                      class="block px-3 py-2 text-small font-semibold text-ink transition-colors hover:text-accent-text"
                      @click="closeMenu"
                    >
                      Tout le catalogue <span class="link-arrow">→</span>
                    </NuxtLink>
                  </div>
                </Accordion>
              </AccordionContent>
            </AccordionItem>

            <!-- CENTRES -->
            <AccordionItem value="centres" variant="menu">
              <AccordionTrigger variant="menu">Centres</AccordionTrigger>
              <AccordionContent>
                <Accordion type="multiple" class="pb-sm">
                  <div>
                    <NuxtLink
                      to="/centres"
                      class="flex items-center gap-2 px-3 py-2 text-body text-primary transition-colors hover:text-accent-text"
                      @click="closeMenu"
                    >
                      <IconLocate :size="16" class="text-accent" />
                      Autour de moi
                    </NuxtLink>
                  </div>

                  <template v-for="region in (regions ?? []).slice(0, 3)" :key="region.slug">
                    <AccordionItem
                      v-if="centresForRegion(region.label).length"
                      :value="region.slug"
                      variant="submenu"
                    >
                      <AccordionTrigger variant="submenu">
                        <span class="flex w-full items-center justify-between pr-2">
                          <span>{{ region.label }}</span>
                          <span class="text-small text-ink-muted">{{ region.count }}</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul class="px-3">
                          <li
                            v-for="centre in centresForRegion(region.label).slice(0, 3)"
                            :key="centre.slug"
                          >
                            <NuxtLink
                              :to="`/centres/${centre.slug}`"
                              class="flex items-center justify-between py-2 text-body text-primary transition-colors hover:text-accent-text"
                              @click="closeMenu"
                            >
                              <span>{{ centre.name }}</span>
                              <span class="text-small text-ink-muted">
                                {{ centre.department ?? centre.city }}
                              </span>
                            </NuxtLink>
                          </li>
                          <li>
                            <NuxtLink
                              :to="{ path: '/centres', query: { region: region.label } }"
                              class="block py-2 text-small font-semibold text-ink transition-colors hover:text-accent-text"
                              @click="closeMenu"
                            >
                              Tous les centres {{ region.label }}
                              <span class="link-arrow">→</span>
                            </NuxtLink>
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <NuxtLink
                      v-else
                      :to="{ path: '/centres', query: { region: region.label } }"
                      class="flex items-center justify-between px-3 py-2 text-body text-primary transition-colors hover:text-accent-text"
                      @click="closeMenu"
                    >
                      <span>{{ region.label }}</span>
                      <span class="text-small text-ink-muted">{{ region.count }}</span>
                    </NuxtLink>
                  </template>

                  <div>
                    <NuxtLink
                      to="/centres"
                      class="block px-3 py-2 text-small font-semibold text-ink transition-colors hover:text-accent-text"
                      @click="closeMenu"
                    >
                      Voir la carte de région <span class="link-arrow">→</span>
                    </NuxtLink>
                  </div>
                </Accordion>
              </AccordionContent>
            </AccordionItem>

            <!-- À PROPOS -->
            <AccordionItem value="apropos" variant="menu">
              <AccordionTrigger variant="menu">À propos</AccordionTrigger>
              <AccordionContent>
                <ul class="pb-sm px-3">
                  <li v-for="lien in aproposLiens" :key="lien.slug">
                    <NuxtLink
                      :to="`/${lien.slug}`"
                      class="block py-2 text-body text-primary transition-colors hover:text-accent-text"
                      @click="closeMenu"
                    >
                      {{ lien.label }}
                    </NuxtLink>
                  </li>
                </ul>
                <ul class="rounded-md bg-surface p-3">
                  <li v-for="lien in legalLiens" :key="lien.slug">
                    <NuxtLink
                      :to="`/${lien.slug}`"
                      class="block py-2 text-body text-primary transition-colors hover:text-accent-text"
                      @click="closeMenu"
                    >
                      {{ lien.label }}
                    </NuxtLink>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <!-- ACTUALITÉS -->
            <AccordionItem value="actualites" variant="menu">
              <AccordionTrigger variant="menu">Actualités</AccordionTrigger>
              <AccordionContent>
                <ul class="pb-sm px-3">
                  <li v-for="rubrique in actualitesRubriques" :key="rubrique.slug">
                    <NuxtLink
                      to="/actualites"
                      class="block py-2 text-body text-primary transition-colors hover:text-accent-text"
                      @click="closeMenu"
                    >
                      {{ rubrique.label }}
                    </NuxtLink>
                  </li>
                </ul>
                <ul class="rounded-md bg-surface p-3">
                  <p class="pb-1 text-small font-bold text-ink-muted uppercase">Par région</p>
                  <li v-for="region in actualitesRegions.slice(0, 2)" :key="region.slug">
                    <NuxtLink
                      to="/actualites"
                      class="block py-2 text-body text-primary transition-colors hover:text-accent-text"
                      @click="closeMenu"
                    >
                      {{ region.label }}
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink
                      to="/actualites"
                      class="block py-2 text-small font-semibold text-ink transition-colors hover:text-accent-text"
                      @click="closeMenu"
                    >
                      Toutes les régions <span class="link-arrow">→</span>
                    </NuxtLink>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </nav>

        <div
          class="sticky bottom-0 flex flex-col gap-sm border-t border-rule px-gutter-mobile py-md"
        >
          <NuxtLink
            to="/rejoindre-le-reseau"
            class="inline-block text-body font-semibold text-ink transition-colors hover:text-accent-text underline"
            @click="closeMenu"
          >
            Rejoindre le réseau
          </NuxtLink>
          <Button as-child variant="accent" size="pill" class="w-full">
            <NuxtLink to="/etre-guide" @click="closeMenu">Être guidé dans mon choix</NuxtLink>
          </Button>
        </div>
      </dialog>
    </Transition>
  </ClientOnly>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '~/components/ui/accordion'
import IconLocate from '~/components/icons/IconLocate.vue'
import { aproposLiens } from '~/data/navigation'
import {
  useMenuActualites,
  useMenuCentres,
  useMenuFamilles,
  useMenuLegalPages,
  useMenuSousFamillesParFamille
} from '~/composables/useMenuData'

const open = defineModel<boolean>('open', { default: false })
const dialogEl = ref<HTMLDialogElement>()
const closeBtn = ref<HTMLButtonElement>()
let previousFocus: Element | null = null

const familles = useMenuFamilles()
const sousFamillesParFamille = useMenuSousFamillesParFamille()
const { regions, centresParRegion } = useMenuCentres()
const { rubriques: actualitesRubriques, regions: actualitesRegions } = useMenuActualites()
const legalLiens = useMenuLegalPages()

function centresForRegion(label: string) {
  return centresParRegion.value.get(label) ?? []
}

function sousFamillesFor(familleSlug: string) {
  return sousFamillesParFamille.value[familleSlug] ?? []
}

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
