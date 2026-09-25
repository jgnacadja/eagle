import { decodeHTML } from 'entities'
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
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.target === '_blank' ? { ...attribs, rel: 'noopener noreferrer' } : attribs
      })
    }
  })

  const sanitizedHtml = insertHeadingIds(clean)

  return {
    html: sanitizedHtml,
    headings: extractHeadings(sanitizedHtml)
  }
}

// Une valeur d'attribut peut contenir « > » : le motif accepte les chaînes
// quotées dans les attributs au lieu d'un simple [^>]*.
const HEADING_PATTERN = /<h([1-3])((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/h\1>/gi

// Extrait le texte brut d'un champ riche Directus (WYSIWYG) : balises
// retirées puis entités décodées — « &amp;lt; » devient le littéral
// « &lt; » (le &amp; est décodé sans re-scanner le résultat). Le motif
// accepte les « > » dans les valeurs d'attribut quotées.
export function htmlToText(html?: string | null): string {
  return decodeHTML((html ?? '').replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function headingText(inner: string): string {
  return htmlToText(inner)
}

function insertHeadingIds(html: string): string {
  const seen = new Set<string>()

  return html.replace(HEADING_PATTERN, (match, level, attrs, inner) => {
    const label = headingText(inner)
    const base = slugifyHeading(label) || `heading-${level}`

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
  return Array.from(html.matchAll(HEADING_PATTERN)).flatMap((match) => {
    const level = match[1]
    const attrs = match[2]
    const inner = match[3]
    if (!level || attrs === undefined || inner === undefined) return []

    const id = attrs.match(/\sid="([^"]+)"/i)?.[1]
    if (!id) return []

    return [{ id, label: headingText(inner), level: Number(level) }]
  })
}
