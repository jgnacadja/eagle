import { config } from '@vue/test-utils'
import {
  computed,
  customRef,
  defineAsyncComponent,
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  isProxy,
  isReactive,
  isReadonly,
  isRef,
  markRaw,
  nextTick,
  onActivated,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onDeactivated,
  onErrorCaptured,
  onMounted,
  onRenderTracked,
  onRenderTriggered,
  onServerPrefetch,
  onUnmounted,
  onUpdated,
  provide,
  reactive,
  readonly,
  ref,
  shallowReactive,
  shallowReadonly,
  shallowRef,
  toRaw,
  toRef,
  toRefs,
  toValue,
  triggerRef,
  unref,
  useAttrs,
  useId,
  useModel,
  useSlots,
  useTemplateRef,
  watch,
  watchEffect,
  watchPostEffect,
  watchSyncEffect,
  type Component
} from 'vue'

const vueAutoImports: Record<string, unknown> = {
  computed,
  customRef,
  defineAsyncComponent,
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  isProxy,
  isReactive,
  isReadonly,
  isRef,
  markRaw,
  nextTick,
  onActivated,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onDeactivated,
  onErrorCaptured,
  onMounted,
  onRenderTracked,
  onRenderTriggered,
  onServerPrefetch,
  onUnmounted,
  onUpdated,
  provide,
  reactive,
  readonly,
  ref,
  shallowReactive,
  shallowReadonly,
  shallowRef,
  toRaw,
  toRef,
  toRefs,
  toValue,
  triggerRef,
  unref,
  useAttrs,
  useId,
  useModel,
  useSlots,
  useTemplateRef,
  watch,
  watchEffect,
  watchPostEffect,
  watchSyncEffect
}

for (const [name, fn] of Object.entries(vueAutoImports)) {
  vi.stubGlobal(name, fn)
}

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
vi.stubGlobal('defineNuxtPlugin', <T>(plugin: T): T => plugin)

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
