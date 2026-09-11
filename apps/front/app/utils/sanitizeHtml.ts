import sanitize from 'sanitize-html'

/**
 * Contenu WYSIWYG Directus — saisi par des éditeurs authentifiés, pas de
 * l'input utilisateur direct, mais sanitizé quand même avant `v-html` :
 * un compte éditeur compromis ou un futur champ moins fiable ne doit pas
 * devenir un vecteur XSS. Fonctionne côté SSR et navigateur (pas de DOM requis).
 */
export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: [...sanitize.defaults.allowedTags, 'img', 'h1', 'h2', 'u'],
    allowedAttributes: {
      ...sanitize.defaults.allowedAttributes,
      '*': ['class'],
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading']
    },
    allowedSchemes: ['https', 'http', 'mailto', 'tel']
  })
}
