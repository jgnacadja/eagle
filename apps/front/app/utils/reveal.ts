const ENTER_EASE = [0.16, 1, 0.3, 1] as const
const VIEWPORT_ONCE = { once: true, margin: '0px 0px -8% 0px' } as const

const revealTransition = (delay = 0, duration = 0.56) => ({
  duration,
  ease: ENTER_EASE,
  delay
})

export const MOTION_PRESETS = {
  reveal: {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    inViewOptions: VIEWPORT_ONCE,
    transition: revealTransition()
  },
  'reveal-soft': {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    inViewOptions: VIEWPORT_ONCE,
    transition: revealTransition(0, 0.48)
  },
  'reveal-media': {
    initial: { opacity: 0, y: 18, scale: 1.035 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    inViewOptions: VIEWPORT_ONCE,
    transition: revealTransition(0, 0.7)
  },
  hero: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: revealTransition(0, 0.7)
  }
} as const

export function revealStagger(index: number, step = 0.07) {
  return { transition: revealTransition(Math.min(Math.max(index, 0), 5) * step) }
}

export function heroStagger(index: number, step = 0.09) {
  return { transition: revealTransition(Math.min(Math.max(index, 0), 6) * step, 0.7) }
}
