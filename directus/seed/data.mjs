// Données de démonstration — noms et contenus fictifs, pour développer en
// local sans dépendre des accès client. Ne pas utiliser en recette/prod.

export const centres = [
  { slug: 'paris', name: 'Centre Paris' },
  { slug: 'lyon', name: 'Centre Lyon' },
  { slug: 'marseille', name: 'Centre Marseille' }
]

export const famillesFormation = Array.from({ length: 11 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0')
  return { slug: `famille-${n}`, name: `Famille de formation ${n}` }
})

export const formations = [
  { slug: 'formation-temoin-1', name: 'Formation témoin 1', famille_slug: 'famille-01' },
  { slug: 'formation-temoin-2', name: 'Formation témoin 2', famille_slug: 'famille-02' },
  { slug: 'formation-temoin-3', name: 'Formation témoin 3', famille_slug: 'famille-03' }
]

export const articles = [
  { slug: 'article-demo-1', name: 'Article de démonstration 1' },
  { slug: 'article-demo-2', name: 'Article de démonstration 2' },
  { slug: 'article-demo-3', name: 'Article de démonstration 3' }
]
