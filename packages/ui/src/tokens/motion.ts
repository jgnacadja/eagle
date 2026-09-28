export const motion = {
  duration: {
    fast: '160ms',
    base: '280ms',
    slow: '560ms'
  },
  easing: {
    enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
    standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)'
  }
} as const
