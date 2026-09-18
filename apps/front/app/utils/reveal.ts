// Transition partagée : opacité vive, déplacement amorti et naturel.
const revealTransition = (delay = 0) => ({
  opacity: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
  y: { type: 'spring' as const, stiffness: 110, damping: 20, mass: 0.9, delay }
})

export const REVEAL_TRANSITION = revealTransition()

export function revealStagger(index: number, step = 0.08) {
  return { transition: revealTransition(Math.min(index, 5) * step) }
}
