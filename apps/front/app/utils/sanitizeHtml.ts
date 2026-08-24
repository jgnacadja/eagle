import DOMPurify from 'isomorphic-dompurify'

/**
 * Contenu WYSIWYG Directus — saisi par des éditeurs authentifiés, pas de
 * l'input utilisateur direct, mais sanitizé quand même avant `v-html` :
 * un compte éditeur compromis ou un futur champ moins fiable ne doit pas
 * devenir un vecteur XSS. Fonctionne côté SSR et navigateur (isomorphic).
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html)
}
