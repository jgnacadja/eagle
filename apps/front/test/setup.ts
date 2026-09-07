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
  CenterFormationCard: {
    props: ['title', 'family'],
    template: '<div class="formation-card">{{ family }} — {{ title }}</div>'
  }
}
