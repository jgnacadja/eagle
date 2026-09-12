import { config } from '@vue/test-utils'
import { type Component } from 'vue'

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

config.global.stubs = {
  ...config.global.stubs,
  NuxtLink: { template: '<a :href="to"><slot /></a>' },
  CenterMap: {
    props: ['centers', 'activeId', 'caption', 'mode'],
    template: '<div class="center-map" />'
  },
  CenterFormationCard: {
    props: ['title', 'subFamily'],
    template: '<div class="formation-card">{{ subFamily }} — {{ title }}</div>'
  }
}

// Auto-imports Nuxt absents sous Vitest : le header interne SSR n'a pas à
// exister en environnement de test.
vi.stubGlobal('internalSsrHeaders', () => undefined)

// Directives motion-v (enregistrées par le module Nuxt, absentes ici) et
// utilitaires de reveal utilisés dans les templates.
config.global.directives = {
  ...config.global.directives,
  motion: {},
  reveal: {}
}

// happy-dom n'expose pas IntersectionObserver (requis par motion-v/inView).
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
