// Conversion du contenu de section de page légale vers le HTML WYSIWYG
// (champ `body` de pages_legales_sections / pages_legales_subsections).
// Partagé entre la migration de build.mjs (JSON historique → lignes) et le
// seed (paragraphes/puces déclaratifs dans data.mjs).

const escapeHtml = (value) =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

/**
 * @param {{ paragraphs?: string[], bullets?: string[] }} section
 * @returns {string | null} HTML ou null si la section est vide.
 */
export function legalSectionToHtml(section) {
  const parts = (section?.paragraphs ?? [])
    .filter((p) => typeof p === 'string' && p.trim())
    .map((p) => `<p>${escapeHtml(p)}</p>`)

  const bullets = (section?.bullets ?? []).filter((b) => typeof b === 'string' && b.trim())
  if (bullets.length) {
    const items = bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')
    parts.push(`<ul>${items}</ul>`)
  }

  return parts.length ? parts.join('') : null
}

/** Retire le préfixe numérique historique (« 1. Objet » → « Objet »). */
export function stripSectionNumber(title) {
  return String(title ?? '')
    .replace(/^\s*\d+([.)]|\s+-\s+)\s*/u, '')
    .trim()
}
