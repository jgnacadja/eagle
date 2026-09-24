import { config } from '@vue/test-utils'
import { ref, type Component, type Ref } from 'vue'

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

// Moteur IA : champ d'entrée partagé, coquille, déclencheurs « Être guidé
// dans mon choix » et composants des 11 états (auto-importés par Nuxt).
const assistantComponents = import.meta.glob('~/components/Assistant/*.vue', {
  eager: true,
  import: 'default'
})
registerByName(assistantComponents)

config.global.stubs = {
  ...config.global.stubs,
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
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

// Auto-imports Nuxt de navigation (utilisés par useAssistantNavigation) :
// valeurs neutres par défaut — les specs qui les observent posent leurs
// propres stubs, qui priment.
const sharedStates = new Map<string, Ref<unknown>>()
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRoute', () => ({ path: '/', fullPath: '/', query: {}, params: {}, meta: {} }))
vi.stubGlobal('useRouter', () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn() }))
vi.stubGlobal('useState', (key: string, init?: () => unknown) => {
  if (!sharedStates.has(key)) sharedStates.set(key, ref(init?.()))
  return sharedStates.get(key)
})
vi.stubGlobal('useNuxtApp', () => ({ hooks: { hook: vi.fn(), hookOnce: vi.fn() } }))

// Directives motion-v (enregistrées par le module Nuxt, absentes ici) et
// utilitaires de reveal utilisés dans les templates.
config.global.directives = {
  ...config.global.directives,
  motion: {},
  reveal: {}
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
