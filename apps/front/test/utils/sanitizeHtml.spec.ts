import { describe, expect, it } from 'vitest'
import { sanitizeHtml, sanitizeHtmlWithHeadings } from '~/utils/sanitizeHtml'

describe('sanitizeHtml', () => {
  it('supprime les balises et attributs dangereux', () => {
    const dirty =
      '<p onclick="alert(1)">Texte<script>alert(2)</script></p><iframe src="https://evil.test"></iframe><a href="javascript:alert(3)">lien</a>'

    const clean = sanitizeHtml(dirty)

    expect(clean).not.toContain('<script')
    expect(clean).not.toContain('<iframe')
    expect(clean).not.toContain('onclick')
    expect(clean).not.toContain('javascript:')
    expect(clean).toContain('Texte')
    expect(clean).toContain('lien')
  })

  it('retire les id arbitraires du contenu hors titres', () => {
    const clean = sanitizeHtml('<p id="ancre-piege">Texte</p><span id="x">s</span>')

    expect(clean).not.toContain('ancre-piege')
    expect(clean).not.toContain('id="x"')
  })

  it('ajoute rel="noopener noreferrer" aux liens target="_blank"', () => {
    const clean = sanitizeHtml(
      '<a href="https://exemple.fr" target="_blank">lien</a><a href="https://exemple.fr">autre</a>'
    )

    expect(clean).toContain('target="_blank" rel="noopener noreferrer"')
    expect(clean).toContain('<a href="https://exemple.fr">autre</a>')
  })
})

describe('sanitizeHtmlWithHeadings', () => {
  it('injecte des ids slugifiés sur les titres et les expose', () => {
    const { html, headings } = sanitizeHtmlWithHeadings(
      '<h2>Pourquoi 2027 ?</h2><p>Texte</p><h3>Échéances CACES</h3>'
    )

    expect(html).toContain('id="pourquoi-2027"')
    expect(html).toContain('id="echeances-caces"')
    expect(headings).toEqual([
      { id: 'pourquoi-2027', label: 'Pourquoi 2027 ?', level: 2 },
      { id: 'echeances-caces', label: 'Échéances CACES', level: 3 }
    ])
  })

  it('dédoublonne les titres identiques pour éviter les ancres mortes', () => {
    const { html, headings } = sanitizeHtmlWithHeadings('<h2>Section</h2><h2>Section</h2>')

    expect(headings.map((h) => h.id)).toEqual(['section', 'section-2'])
    expect(html).toContain('id="section-2"')
  })

  it('réécrit un id existant en incohérent avec le sommaire', () => {
    const { html, headings } = sanitizeHtmlWithHeadings('<h2 id="autre">Mon titre</h2>')

    expect(html).not.toContain('id="autre"')
    expect(headings[0]?.id).toBe('mon-titre')
    expect(html).toContain('id="mon-titre"')
  })

  it('utilise un id de secours quand le titre ne produit pas de slug', () => {
    const { html, headings } = sanitizeHtmlWithHeadings('<h2>！！！</h2><h2>？？？</h2>')

    expect(headings.map((h) => h.id)).toEqual(['heading-2', 'heading-2-2'])
    expect(html).toContain('id="heading-2"')
    expect(html).not.toContain('id=""')
  })

  it('décode les entités HTML dans les libellés du sommaire', () => {
    const { headings } = sanitizeHtmlWithHeadings('<h2>R&amp;D &#8212; l&apos;essentiel</h2>')

    expect(headings[0]?.label).toBe("R&D — l'essentiel")
  })

  it('conserve un titre dont un attribut contient un « > »', () => {
    const { html, headings } = sanitizeHtmlWithHeadings('<h2 class="a&gt;b">Titre piégé</h2>')

    expect(headings).toEqual([{ id: 'titre-piege', label: 'Titre piégé', level: 2 }])
    expect(html).toContain('id="titre-piege"')
  })
})
