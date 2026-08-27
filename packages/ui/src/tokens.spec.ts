import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { colors, radii, shadows, spacing, typography } from './tokens/index.js'

/**
 * tokens.css mirrors these TS values by hand (no build-time generator —
 * placeholder palette, see tokens/colors.ts). This test sources its
 * expectations from the TS tokens so an edit there that isn't mirrored into
 * the CSS fails here instead of drifting silently into the design tokens
 * apps/front actually renders with.
 */
const expected: Record<string, string> = {
  'color-primary': colors.primary.default,
  'color-primary-dark': colors.primary.dark,
  'color-primary-soft': colors.primary.soft,
  'color-ink': colors.ink.default,
  'color-ink-muted': colors.ink.muted,
  'color-surface': colors.surface,
  'color-paper': colors.paper,
  'color-rule': colors.rule,
  'color-danger': colors.danger.default,
  'color-danger-soft': colors.danger.soft,

  'font-display': typography.fontFamily.display.join(', '),
  'font-sans': typography.fontFamily.sans.join(', '),
  'font-mono': typography.fontFamily.mono.join(', '),

  'spacing-xs': spacing.xs,
  'spacing-sm': spacing.sm,
  'spacing-md': spacing.md,
  'spacing-lg': spacing.lg,
  'spacing-xl': spacing.xl,
  'spacing-2xl': spacing['2xl'],

  'radius-sm': radii.sm,
  'radius-md': radii.md,
  'radius-lg': radii.lg,
  'radius-full': radii.full,

  'shadow-sm': shadows.sm,
  'shadow-md': shadows.md
}

function parseCssCustomProperties(css: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const match of css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    result[match[1]] = match[2].trim()
  }
  return result
}

describe('tokens.css', () => {
  const cssPath = fileURLToPath(new URL('./tokens.css', import.meta.url))
  const actual = parseCssCustomProperties(readFileSync(cssPath, 'utf-8'))

  it('declares exactly the custom properties mirrored from the TS tokens', () => {
    expect(Object.keys(actual).sort()).toEqual(Object.keys(expected).sort())
  })

  it.each(Object.entries(expected))('--%s matches the TS token value', (name, value) => {
    expect(actual[name]).toBe(value)
  })
})
