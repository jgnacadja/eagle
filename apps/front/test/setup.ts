import { config } from '@vue/test-utils'
import { defineComponent, reactive, ref, type Component } from 'vue'

function registerByName(modules: Record<string, unknown>) {
  for (const [path, component] of Object.entries(modules)) {
    const base = path.slice(path.lastIndexOf('/') + 1)
    const name = base.endsWith('.vue') ? base.slice(0, -4) : undefined
    if (name) {
      config.global.components[name] = component as Component
    }
  }
}

const icons = import.meta.glob('~/components/icons/*.vue', { eager: true, import: 'default' })
const uiComponents = import.meta.glob('~/components/ui/**/*.vue', {
  eager: true,
  import: 'default'
})

registerByName(icons)
registerByName(uiComponents)

// Enregistré explicitement : les autres composants Map/ sont stubbés par spec.
import GeoNearMe from '~/components/Map/GeoNearMe.vue'
config.global.components.GeoNearMe = GeoNearMe

import ClientLogoWall from '~/components/Brand/ClientLogoWall.vue'
config.global.components.ClientLogoWall = ClientLogoWall

// Racine de components/ (hors glob ui/**) : partagé par les formulaires de lead.
import ConsentField from '~/components/ConsentField.vue'
config.global.components.ConsentField = ConsentField

// Recherche assistée : entrée compacte du header (préfixe `Assistant` de
// l'auto-import Nuxt).
import AssistantHeaderPill from '~/components/Assistant/HeaderPill.vue'
config.global.components.AssistantHeaderPill = AssistantHeaderPill

// NuxtLink : href résolu depuis une chaîne ou un objet de route (path +
// query) ; l'état d'historique transmis (`state` — besoin de la recherche
// assistée, hors URL) est exposé en `data-state` pour les assertions.
const NuxtLinkStub = defineComponent({
  props: { to: { type: [String, Object], required: true } },
  computed: {
    href(): string {
      const to = this.to as string | { path?: string; query?: Record<string, string> }
      if (typeof to === 'string') return to
      const query =
        to.query && Object.keys(to.query).length ? `?${new URLSearchParams(to.query)}` : ''
      return `${to.path ?? ''}${query}`
    },
    state(): string | undefined {
      const to = this.to as string | { state?: unknown }
      return typeof to === 'object' && to.state ? JSON.stringify(to.state) : undefined
    }
  },
  template: '<a :href="href" :data-state="state"><slot /></a>'
})

config.global.stubs = {
  ...config.global.stubs,
  NuxtLink: NuxtLinkStub,
  CenterMap: {
    props: ['centers', 'activeId', 'caption', 'mode'],
    // Le pied « adresse + itinéraire » du mode single fait partie du
    // contrat du composant : le stub le reproduit pour les assertions.
    template: `<div class="center-map">
      <template v-if="mode === 'single' && centers.length">
        <span>{{ centers[0].address }}</span>
        <a v-if="centers[0].lat != null">Ouvrir l'itinéraire →</a>
      </template>
    </div>`
  },
  CenterFormationCard: {
    props: ['title', 'subFamily'],
    template: '<div class="formation-card">{{ subFamily }} — {{ title }}</div>'
  }
}

// Auto-imports Nuxt absents sous Vitest : le header interne SSR n'a pas à
// exister en environnement de test.
vi.stubGlobal('internalSsrHeaders', () => undefined)

// useState (auto-import Nuxt) : store ref partagé par clé, nécessaire aux
// composables d'état global (ex : useAssistantLauncher).
const nuxtState = new Map<string, unknown>()
vi.stubGlobal('useState', (key: string, init: () => unknown) => {
  if (!nuxtState.has(key)) nuxtState.set(key, ref(init()))
  return nuxtState.get(key)
})

// useRoute (auto-import Nuxt) : route réactive partagée — les specs peuvent
// muter `fullPath` pour déclencher les watchers de navigation (ex : fermeture
// du panneau AssistantChat au changement de route).
const routeState = reactive({
  path: '/',
  fullPath: '/',
  hash: '',
  params: {} as Record<string, string>,
  query: {} as Record<string, string>,
  meta: {} as Record<string, unknown>
})
vi.stubGlobal('useRoute', () => routeState)

// Directives motion-v (enregistrées par le module Nuxt, absentes ici) et
// utilitaires de reveal utilisés dans les templates.
config.global.directives = {
  ...config.global.directives,
  motion: {},
  reveal: {},
  hero: {},
  revealSoft: {},
  revealMedia: {}
}

// happy-dom n'expose pas IntersectionObserver (requis par motion-v/inView).
const noop = () => undefined
class IntersectionObserverStub {
  observe = noop
  unobserve = noop
  disconnect = noop
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)

// Pointer capture absent de happy-dom : requis par reka-ui (SelectTrigger
// appelle hasPointerCapture au pointerdown).
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.setPointerCapture ??= noop
  Element.prototype.releasePointerCapture ??= noop
}
