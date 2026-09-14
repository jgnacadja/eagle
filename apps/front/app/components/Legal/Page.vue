<template>
  <div class="flex flex-1 flex-col bg-paper">
    <header class="border-b border-rule bg-linear-to-b from-paper to-surface">
      <div class="mx-auto w-full max-w-container px-gutter-mobile pt-2xl md:px-gutter">
        <h1 class="font-display text-h1 font-extrabold text-ink">
          {{ page.title }}
        </h1>
        <p class="mt-sm text-small text-ink-muted">Dernière mise à jour : {{ page.lastUpdated }}</p>

        <nav aria-label="Pages légales" class="mt-2xl hidden border-b border-rule pb-0 md:block">
          <ul class="-mb-px flex items-center gap-md">
            <li v-for="tab in tabbedPages" :key="tab.slug">
              <NuxtLink
                :to="`/${tab.slug}`"
                :aria-current="tab.slug === currentSlug ? 'page' : undefined"
                :class="
                  cn(
                    'inline-block p-md text-small font-medium transition',
                    tab.slug === currentSlug
                      ? 'border border-rule border-b-0 rounded-t-md bg-paper text-ink'
                      : 'border-b-2 border-transparent text-ink-muted hover:text-ink'
                  )
                "
              >
                {{ tab.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <div class="mx-auto w-full max-w-container px-gutter-mobile pb-xl md:px-gutter">
      <!-- Mobile page selector -->
      <div class="mt-2xl md:hidden">
        <Label id="legal-page-select-label" for="legal-page-select" class="sr-only"
          >Sélecteur de page légale</Label
        >
        <Select id="legal-page-select" v-model="selectedPage">
          <SelectTrigger
            aria-labelledby="legal-page-select-label"
            class="h-control w-full rounded-lg border border-rule bg-surface px-lg text-small font-medium text-ink shadow-sm focus:ring-2 focus:ring-accent"
          >
            <span class="truncate">{{ currentLabel }}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="tab in tabbedPages"
              :key="tab.slug"
              :value="tab.slug"
              class="text-small"
            >
              {{ tab.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="mt-2xl md:grid md:grid-cols-[220px_1fr] md:gap-2xl">
        <!-- Sommaire -->
        <aside class="mb-2xl md:mb-0" @click.capture="onSummaryClick">
          <Accordion type="single" collapsible class="md:hidden">
            <AccordionItem value="summary" class="border-0">
              <AccordionTrigger
                class="w-full rounded-lg border border-rule bg-surface px-lg py-md text-xs font-semibold uppercase tracking-wide text-ink"
              >
                Sommaire
              </AccordionTrigger>
              <AccordionContent class="p-0">
                <LegalSummary
                  :sections="page.sections"
                  :active-id="activeSectionId"
                  class="mt-sm"
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <nav aria-label="Sommaire" class="hidden md:sticky md:top-xl md:block">
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Sommaire</p>
            <LegalSummary :sections="page.sections" :active-id="activeSectionId" class="mt-sm" />
          </nav>
        </aside>

        <!-- Article -->
        <article class="max-w-180 space-y-2xl">
          <section
            v-for="section in page.sections"
            :id="section.id"
            :key="section.id"
            class="scroll-mt-24"
          >
            <h2 class="font-display text-h3 font-extrabold text-ink">
              {{ section.title }}
            </h2>
            <div class="mt-md space-y-md">
              <p
                v-for="(paragraph, index) in section.paragraphs"
                :key="index"
                class="text-body leading-relaxed text-ink-body"
              >
                {{ paragraph }}
              </p>
            </div>
            <ul v-if="section.bullets?.length" class="mt-md space-y-sm">
              <li v-for="(bullet, index) in section.bullets" :key="index" class="flex gap-2">
                <span class="mt-sm h-1.5 w-1.5 shrink-0 rounded-full bg-ink-subtle" />
                <span class="text-body leading-relaxed text-ink-body">{{ bullet }}</span>
              </li>
            </ul>
          </section>

          <div
            class="flex flex-col gap-lg border-t border-rule pt-2xl sm:flex-row sm:items-center sm:justify-between"
          >
            <p class="text-small text-ink-muted">Une question sur ces informations ?</p>
            <Button
              as-child
              variant="outline"
              class="h-control w-full rounded-full border-outline px-xl text-small font-semibold sm:w-auto"
            >
              <a :href="page.cta.to">
                {{ page.cta.label }}
              </a>
            </Button>
          </div>

          <div class="md:hidden">
            <a
              href="#top"
              class="inline-flex items-center gap-1.5 text-small font-medium text-ink-muted hover:text-ink"
            >
              <IconChevronUp :size="16" />
              Haut de page
            </a>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { cn } from '@/lib/utils'
import { tabbedLegalPages, type LegalPage } from '~/data/legal'

const props = defineProps<{
  page: LegalPage
}>()

const route = useRoute()
const currentSlug = computed(() => (route.params.legal as string) || props.page.slug)

const tabbedPages = tabbedLegalPages

const selectedPage = ref(currentSlug.value)
const currentLabel = computed(
  () => tabbedPages.find((p) => p.slug === currentSlug.value)?.label ?? props.page.label
)

watch(selectedPage, (newSlug) => {
  if (newSlug && newSlug !== currentSlug.value) {
    navigateTo(`/${newSlug}`)
  }
})

const activeSectionId = ref<string>(
  (() => {
    const hash = route.hash.replace(/^#/, '')
    return props.page.sections.find((s) => s.id === hash)?.id || props.page.sections[0]?.id || ''
  })()
)

// Seuil sous l'en-tête collant : une section est active dès que son titre
// passe au-dessus. Plus stable qu'un IntersectionObserver, qui fait osciller
// l'état pendant le défilement fluide après un clic dans le sommaire.
const SCROLL_THRESHOLD = 140
const CLICK_LOCK_MS = 1000

let rafId: number | null = null
let lockUntil = 0
let lockTimer: ReturnType<typeof setTimeout> | null = null

function computeActiveSection() {
  const sections = props.page.sections
  if (!sections.length) return

  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
  if (atBottom) {
    activeSectionId.value = sections[sections.length - 1]!.id
    return
  }

  let current = sections[0]!.id
  for (const section of sections) {
    const el = document.getElementById(section.id)
    if (!el) continue
    if (el.getBoundingClientRect().top <= SCROLL_THRESHOLD) {
      current = section.id
    } else {
      break
    }
  }
  activeSectionId.value = current
}

function onScroll() {
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    if (Date.now() < lockUntil) return
    computeActiveSection()
  })
}

function onSummaryClick(event: MouseEvent) {
  const anchor = (event.target as HTMLElement).closest('a[href^="#"]')
  const id = anchor?.getAttribute('href')?.slice(1)
  if (!id || !props.page.sections.some((s) => s.id === id)) return

  activeSectionId.value = id
  lockUntil = Date.now() + CLICK_LOCK_MS
  if (lockTimer) clearTimeout(lockTimer)
  lockTimer = setTimeout(() => {
    lockTimer = null
    lockUntil = 0
    computeActiveSection()
  }, CLICK_LOCK_MS)
}

onMounted(() => {
  nextTick(computeActiveSection)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (rafId !== null) cancelAnimationFrame(rafId)
  if (lockTimer) clearTimeout(lockTimer)
})

watch(
  () => props.page.slug,
  () => {
    activeSectionId.value =
      props.page.sections.find((s) => s.id === route.hash.replace(/^#/, ''))?.id ||
      props.page.sections[0]?.id ||
      ''
    nextTick(computeActiveSection)
  }
)
</script>
