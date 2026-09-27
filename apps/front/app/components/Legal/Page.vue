<template>
  <div class="flex flex-1 flex-col bg-paper">
    <header class="border-b border-rule bg-linear-to-b from-paper to-surface">
      <div class="mx-auto w-full px-gutter-mobile pt-2xl md:px-gutter">
        <h1 class="font-display text-h1 font-extrabold text-ink">
          {{ page.title }}
        </h1>
        <p class="mt-sm text-small text-ink-muted">Dernière mise à jour : {{ page.lastUpdated }}</p>

        <nav aria-label="Pages légales" class="mt-2xl hidden border-b border-rule pb-0 md:block">
          <ul class="-mb-px flex items-center gap-md">
            <li v-for="tab in tabs" :key="tab.slug">
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

    <div class="mx-auto w-full px-gutter-mobile pb-xl md:px-gutter">
      <!-- Mobile page selector -->
      <div class="mt-2xl md:hidden">
        <Label id="legal-page-select-label" for="legal-page-select" class="sr-only"
          >Sélecteur de page légale</Label
        >
        <Select id="legal-page-select" v-model="selectedPage">
          <SelectTrigger aria-labelledby="legal-page-select-label" variant="surface">
            <span class="truncate">{{ currentLabel }}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="tab in tabs" :key="tab.slug" :value="tab.slug" class="text-small">
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
              <AccordionTrigger variant="panel"> Sommaire </AccordionTrigger>
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
        <article class="space-y-2xl md:px-xl">
          <section
            v-for="section in page.sections"
            :id="section.id"
            :key="section.id"
            v-reveal
            class="scroll-mt-24"
          >
            <h2 class="font-display text-h3 font-extrabold text-ink">
              {{ section.number }}. {{ section.title }}
            </h2>
            <div
              v-if="section.body"
              class="legal-body mt-md text-body leading-relaxed text-ink-body"
              v-html="sanitizeHtml(section.body)"
            />
            <div v-if="section.subsections.length" class="mt-lg space-y-lg">
              <section
                v-for="subsection in section.subsections"
                :id="subsection.id"
                :key="subsection.id"
                class="scroll-mt-24"
              >
                <h3 class="font-sans text-h4 font-semibold text-ink">
                  {{ subsection.number }} {{ subsection.title }}
                </h3>
                <div
                  v-if="subsection.body"
                  class="legal-body mt-sm text-body leading-relaxed text-ink-body"
                  v-html="sanitizeHtml(subsection.body)"
                />
              </section>
            </div>
          </section>

          <div
            class="flex flex-col gap-lg border-t border-rule pt-2xl sm:flex-row sm:items-center sm:justify-between"
          >
            <p class="text-small text-ink-muted">Une question sur ces informations ?</p>
            <Button as-child variant="outline" size="pill-sm" class="w-full px-xl sm:w-auto">
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
import { sanitizeHtml } from '~/utils/sanitizeHtml'
import type { LegalPage, LegalPageTab } from '~/types/legal'

const props = defineProps<{
  page: LegalPage
  tabs: LegalPageTab[]
}>()

const route = useRoute()
const currentSlug = computed(() => (route.params.slug as string) || props.page.slug)

const selectedPage = ref(currentSlug.value)
const currentLabel = computed(
  () => props.tabs.find((p) => p.slug === currentSlug.value)?.label ?? props.page.label
)

watch(selectedPage, (newSlug) => {
  if (newSlug && newSlug !== currentSlug.value) {
    navigateTo(`/${newSlug}`)
  }
})

// Ancres suivies par le scroll-spy : sections et sous-sections aplaties,
// dans l'ordre du document.
const anchorIds = computed(() =>
  props.page.sections.flatMap((section) => [
    section.id,
    ...section.subsections.map((subsection) => subsection.id)
  ])
)

// Init vide : le serveur et le client rendent le même état (aucune section
// active), puis onMounted résout hash/première — sinon route.hash diffère
// entre SSR et hydratation et provoque un mismatch de classes.
const activeSectionId = ref('')

function resolveInitialActive() {
  const hash = route.hash.replace(/^#/, '')
  activeSectionId.value = anchorIds.value.find((id) => id === hash) || anchorIds.value[0] || ''
}

// Seuil sous l'en-tête collant : une section est active dès que son titre
// passe au-dessus. Plus stable qu'un IntersectionObserver, qui fait osciller
// l'état pendant le défilement fluide après un clic dans le sommaire.
const SCROLL_THRESHOLD = 140
const CLICK_LOCK_MS = 1000

let rafId: number | null = null
let lockUntil = 0
let lockTimer: ReturnType<typeof setTimeout> | null = null

function computeActiveSection() {
  const ids = anchorIds.value
  if (!ids.length) return

  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
  if (atBottom) {
    activeSectionId.value = ids[ids.length - 1]!
    return
  }

  let current = ids[0]!
  for (const id of ids) {
    const el = document.getElementById(id)
    if (!el) continue
    if (el.getBoundingClientRect().top <= SCROLL_THRESHOLD) {
      current = id
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
  if (!id || !anchorIds.value.includes(id)) return

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
  resolveInitialActive()
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
    resolveInitialActive()
    nextTick(computeActiveSection)
  }
)
</script>

<style scoped>
.legal-body :deep(ul),
.legal-body :deep(ol) {
  padding-left: var(--spacing-md);
}

.legal-body :deep(ul) {
  list-style: disc;
}

.legal-body :deep(ol) {
  list-style: decimal;
}

.legal-body :deep(li + li) {
  margin-top: var(--spacing-xs);
}

.legal-body :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}

.legal-body :deep(p + p),
.legal-body :deep(p + ul),
.legal-body :deep(p + ol),
.legal-body :deep(ul + p),
.legal-body :deep(ol + p) {
  margin-top: var(--spacing-sm);
}
</style>
