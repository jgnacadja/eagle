import sanitize from 'sanitize-html'
import { slugifyHeading } from './article'

/**
 * Contenu WYSIWYG Directus — saisi par des éditeurs authentifiés, pas de
 * l'input utilisateur direct, mais sanitizé quand même avant `v-html` :
 * un compte éditeur compromis ou un futur champ moins fiable ne doit pas
 * devenir un vecteur XSS. Fonctionne côté SSR et navigateur (pas de DOM requis).
 */
export function sanitizeHtml(html: string): string {
  return sanitizeHtmlWithHeadings(html).html
}

export interface SanitizedHeading {
  id: string
  label: string
  level: number
}

export function sanitizeHtmlWithHeadings(html: string): {
  html: string
  headings: SanitizedHeading[]
} {
  const clean = sanitize(html, {
    allowedTags: [...sanitize.defaults.allowedTags, 'img', 'h1', 'h2', 'u'],
    allowedAttributes: {
      ...sanitize.defaults.allowedAttributes,
      '*': ['class'],
      h1: ['id'],
      h2: ['id'],
      h3: ['id'],
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading']
    },
    allowedSchemes: ['https', 'http', 'mailto', 'tel']
  })

  const sanitizedHtml = insertHeadingIds(clean)

  return {
    html: sanitizedHtml,
    headings: extractHeadings(sanitizedHtml)
  }
}

function insertHeadingIds(html: string): string {
  const seen = new Set<string>()

  return html.replace(/<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, inner) => {
    const label = inner
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const base = slugifyHeading(label || `heading-${level}`)

    let id = base
    let counter = 2
    while (seen.has(id)) {
      id = `${base}-${counter++}`
    }
    seen.add(id)

    // On retire un éventuel id existant dans attrs pour éviter les doublons
    const cleanAttrs = attrs.replace(/\s+id="[^"]*"/i, '')

    return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`
  })
}

function extractHeadings(html: string): SanitizedHeading[] {
  return Array.from(html.matchAll(/<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/gi)).flatMap((match) => {
    const level = match[1]
    const attrs = match[2]
    const inner = match[3]
    if (!level || attrs === undefined || inner === undefined) return []

    const id = attrs.match(/\sid="([^"]+)"/i)?.[1]
    if (!id) return []

    const label = inner
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return [{ id, label, level: Number(level) }]
  })
}
