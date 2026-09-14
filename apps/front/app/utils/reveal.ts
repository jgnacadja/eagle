// Transition partagée : opacité vive, déplacement amorti et naturel.
const revealTransition = (delay = 0) => ({
  opacity: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
  y: { type: 'spring' as const, stiffness: 170, damping: 24, mass: 0.8, delay }
})

export const REVEAL_TRANSITION = revealTransition()

export function revealStagger(index: number, step = 0.055) {
  return { transition: revealTransition(Math.min(index, 5) * step) }
}
