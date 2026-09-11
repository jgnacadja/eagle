import type { CustomOrigin } from '@nestjs/common/interfaces/external/cors-options.interface'

export function toOriginMatcher(entry: string): RegExp | string {
  if (!entry.includes('*')) return entry
  const escaped = entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '[^.]*')
  return new RegExp(`^${escaped}$`)
}

export function makeCorsOrigin(allowedOrigins: (RegExp | string)[]): CustomOrigin {
  return (origin, callback) => {
    const allowed =
      !origin ||
      allowedOrigins.some((matcher) =>
        typeof matcher === 'string' ? matcher === origin : matcher.test(origin)
      )
    callback(null, allowed)
  }
}
