import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import App from '~/app.vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('useRoute', () => ({ path: '/formations', fullPath: '/formations' }))
vi.stubGlobal('useRequestURL', () => ({ origin: 'https://learnup.fr' }))
vi.stubGlobal('useSeoMeta', vi.fn())

const NuxtPageStub = {
  name: 'NuxtPage',
  props: ['pageKey'],
  template: '<main />'
}

describe('app.vue', () => {
  it('clé les pages sur route.path (query ignorée)', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          NuxtRouteAnnouncer: true,
          MotionConfig: { template: '<div><slot /></div>' },
          NuxtLayout: { template: '<div><slot /></div>' },
          NuxtPage: NuxtPageStub
        }
      }
    })

    const pageKey = wrapper.findComponent(NuxtPageStub).props('pageKey') as (route: {
      path: string
    }) => string
    expect(pageKey({ path: '/formations/caces' })).toBe('/formations/caces')
  })
})
