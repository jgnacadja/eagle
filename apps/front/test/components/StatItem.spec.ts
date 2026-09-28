import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, type Ref } from 'vue'
import StatItem from '~/components/Stats/StatItem.vue'

// État pilotable : useInView et useReducedMotion sont mockés pour décider
// du déclenchement de l'animation de compteur.
const motionState = vi.hoisted(() => ({
  inView: null as Ref<boolean> | null,
  reduced: null as Ref<boolean> | null,
  listeners: [] as ((v: number) => void)[]
}))

vi.mock('motion-v', async (importOriginal) => {
  const { ref } = await import('vue')
  const mod = await importOriginal<typeof import('motion-v')>()
  motionState.inView = ref(false)
  motionState.reduced = ref(false)
  motionState.listeners = []
  return {
    ...mod,
    Motion: { template: '<div><slot /></div>' },
    useInView: () => motionState.inView,
    useReducedMotion: () => motionState.reduced,
    useMotionValue: (v: number) => ref(v),
    useMotionValueEvent: (_value: unknown, _event: string, cb: (v: number) => void) => {
      motionState.listeners.push(cb)
    },
    animate: vi.fn((_mv: unknown, target: number) => {
      motionState.listeners.forEach((cb) => cb(target))
      return { stop: vi.fn() }
    })
  }
})

function mountItem(props: { value: string; label: string; unit?: string; size?: 'lg' | 'sm' }) {
  return mount(StatItem, { props })
}

describe('StatItem', () => {
  beforeEach(() => {
    motionState.inView!.value = false
    motionState.reduced!.value = false
    motionState.listeners.length = 0
  })

  it('renders value, unit, and label correctly', () => {
    const wrapper = mountItem({
      value: '+250',
      unit: ' %',
      label: 'formations référencées'
    })

    expect(wrapper.text()).toContain('+250')
    expect(wrapper.text()).toContain('%')
    expect(wrapper.text()).toContain('formations référencées')
  })

  it('anime le compteur quand l’élément entre dans le viewport', async () => {
    const wrapper = mountItem({ value: '+10 000', label: 'apprenants formés' })
    motionState.inView!.value = true
    await nextTick()
    await flushPromises()

    expect(motionState.listeners.length).toBeGreaterThan(0)
    // fr-FR groupe les milliers avec une espace fine insécable.
    expect(wrapper.text()).toMatch(/\+10\s000/)
  })

  it('formate les décimales en français pendant l’animation', async () => {
    const wrapper = mountItem({ value: '4,7', label: 'note moyenne' })
    motionState.inView!.value = true
    await nextTick()
    await flushPromises()

    expect(wrapper.text()).toContain('4,7')
  })

  it('n’anime pas quand la valeur n’est pas numérique', async () => {
    const wrapper = mountItem({ value: 'bientôt', label: 'disponibilité' })
    motionState.inView!.value = true
    await nextTick()
    await flushPromises()

    expect(wrapper.text()).toContain('bientôt')
    expect(motionState.listeners.length).toBeGreaterThan(0)
  })

  it('applique les classes compactes en taille sm', () => {
    const wrapper = mountItem({ value: '98', label: 'satisfaction', size: 'sm' })

    expect(wrapper.text()).toContain('98')
    expect(wrapper.find('.text-h2').exists()).toBe(true)
  })

  it('affiche la valeur brute quand le préfixe est absent', () => {
    const wrapper = mountItem({ value: '75', label: 'centres' })

    expect(wrapper.text()).toContain('75')
  })

  it('respecte la préférence de mouvement réduit', async () => {
    motionState.reduced!.value = true
    const wrapper = mountItem({ value: '+250', label: 'formations' })
    motionState.inView!.value = true
    await nextTick()

    expect(wrapper.text()).toContain('+250')
  })
})
