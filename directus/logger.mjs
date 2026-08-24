// Wrapper minimal autour de console — un seul point d'exception ESLint
// (no-console) au lieu d'une exemption sur tout directus/**/*.mjs.
export function log(message) {
  console.log(message)
}

export function logError(message, ...args) {
  console.error(message, ...args)
}
