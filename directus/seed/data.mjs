// Données de démonstration — noms et contenus fictifs, pour développer en
// local sans dépendre des accès client. Ne pas utiliser en recette/prod.
// status: 'published' — sinon invisible pour le rôle Public (accès du
// site), qui ne lit que le contenu publié.

export const centres = [
  { slug: 'paris', name: 'Centre Paris', status: 'published' },
  { slug: 'lyon', name: 'Centre Lyon', status: 'published' },
  { slug: 'marseille', name: 'Centre Marseille', status: 'published' }
]

export const famillesFormation = Array.from({ length: 11 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0')
  return { slug: `famille-${n}`, name: `Famille de formation ${n}`, status: 'published' }
})

export const formations = [
  { slug: 'formation-temoin-1', name: 'Formation témoin 1', famille_slug: 'famille-01' },
  { slug: 'formation-temoin-2', name: 'Formation témoin 2', famille_slug: 'famille-02' },
  { slug: 'formation-temoin-3', name: 'Formation témoin 3', famille_slug: 'famille-03' }
]

export const articles = [
  { slug: 'article-demo-1', title: 'Article de démonstration 1', status: 'published' },
  { slug: 'article-demo-2', title: 'Article de démonstration 2', status: 'published' },
  { slug: 'article-demo-3', title: 'Article de démonstration 3', status: 'published' }
]
