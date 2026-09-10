import DOMPurify from 'isomorphic-dompurify'

/**
 * Contenu WYSIWYG Directus — saisi par des éditeurs authentifiés, pas de
 * l'input utilisateur direct, mais sanitizé quand même avant `v-html` :
 * un compte éditeur compromis ou un futur champ moins fiable ne doit pas
 * devenir un vecteur XSS. Fonctionne côté SSR et navigateur (isomorphic).
 */
export function sanitizeHtml(html: string): string {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'id'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|#):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
  })

  return insertHeadingIds(clean)
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

    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`
  })
}

function slugifyHeading(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
