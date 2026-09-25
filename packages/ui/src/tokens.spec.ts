import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { breakpoints, colors, layout, radii, shadows, spacing, typography } from './tokens/index.js'

/**
 * tokens.css mirrors the TS tokens by hand (no build-time generator yet).
 * This test derives its expectations from the TS tokens so an edit there
 * that isn't mirrored into the CSS fails here instead of drifting silently
 * into what apps/front actually renders with.
 *
 * Naming convention: `<prefix>-<path>` in kebab-case, `default` keys dropped
 * (`colors.primary.default` → `--color-primary`).
 */
type TokenTree = { readonly [key: string]: string | TokenTree }

function kebab(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function flatten(prefix: string, tree: TokenTree): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(tree)) {
    const name = key === 'default' ? prefix : `${prefix}-${kebab(key)}`
    if (typeof value === 'string') {
      result[name] = value
    } else {
      Object.assign(result, flatten(name, value))
    }
  }
  return result
}

const textScale: Record<string, string> = {}
for (const [name, style] of Object.entries(typography.scale)) {
  textScale[`text-${name}-size`] = style.fontSize
  textScale[`text-${name}-line`] = style.lineHeight
  textScale[`text-${name}-tracking`] = style.letterSpacing
  textScale[`text-${name}-weight`] = style.fontWeight
}

const expected: Record<string, string> = {
  ...flatten('color', colors),

  'font-display': typography.fontFamily.display.join(', '),
  'font-sans': typography.fontFamily.sans.join(', '),
  'font-mono': typography.fontFamily.mono.join(', '),
  ...flatten('font-weight', typography.fontWeight),
  ...textScale,

  ...flatten('spacing', spacing),
  ...flatten('layout', layout),
  ...flatten('radius', radii),
  ...flatten('shadow', shadows),
  ...flatten('breakpoint', breakpoints)
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

describe('typography', () => {
  it('loads Figtree from Google Fonts with the 400–800 weights the charte uses', () => {
    const url = new URL(typography.googleFontsUrl)
    expect(url.hostname).toBe('fonts.googleapis.com')
    expect(url.searchParams.get('family')).toBe('Figtree:wght@400;500;600;700;800')
    expect(url.searchParams.get('display')).toBe('swap')
    expect(typography.fontFamily.sans[0]).toBe('Figtree')
    expect(typography.fontFamily.display[0]).toBe('Figtree')
  })
})
