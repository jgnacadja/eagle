import sanitize from 'sanitize-html'

/**
 * Contenu WYSIWYG Directus — saisi par des éditeurs authentifiés, pas de
 * l'input utilisateur direct, mais sanitizé quand même avant `v-html` :
 * un compte éditeur compromis ou un futur champ moins fiable ne doit pas
 * devenir un vecteur XSS. Fonctionne côté SSR et navigateur (pas de DOM requis).
 */
export function sanitizeHtml(html: string): string {
  const clean = sanitize(html, {
    allowedTags: [...sanitize.defaults.allowedTags, 'img', 'h1', 'h2', 'u'],
    allowedAttributes: {
      ...sanitize.defaults.allowedAttributes,
      '*': ['class', 'id'],
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading']
    },
    allowedSchemes: ['https', 'http', 'mailto', 'tel']
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

    // On retire un éventuel id existant dans attrs pour éviter les doublons
    const cleanAttrs = attrs.replace(/\s+id="[^"]*"/i, '')

    return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`
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
