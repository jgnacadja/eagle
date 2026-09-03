<template>
  <main class="bg-paper">
    <HomeHero />
    <HomeStatsTicker :items="stats" />
    <HomeNetwork />
    <HomeHowItWorks />
    <HomeFormations :familles="familles" />
    <HomeCenters :centres="centres" />
    <HomeConfier />
    <HomeStats :items="stats" />
    <HomeTestimonials />
    <HomeNews :articles="articles" />
  </main>
</template>

<script setup lang="ts">
import type { Article, Centre, FamilleFormation, Stat } from '@learnup/types'

const familles = await useDirectusList<FamilleFormation>('familles_formation', 'home-familles', {
  limit: 4,
  filter: { status: { _eq: 'published' } }
})

const centres = await useDirectusList<Centre>('centres', 'home-centres', {
  limit: 2,
  filter: { status: { _eq: 'published' } }
})

const articles = await useDirectusList<Article>('articles', 'home-articles', {
  limit: 3,
  filter: { status: { _eq: 'published' } },
  sort: ['-publish_at']
})

const stats = await useDirectusList<Stat>('stats', 'home-stats', {
  filter: { status: { _eq: 'published' } },
  sort: ['sort']
})

useContentSeo(
  {
    seo_title: 'LEARN UP ACADEMY — Plateforme de conseil en formation professionnelle',
    seo_description:
      'Trouvez et organisez la formation réglementaire adaptée à vos équipes. +400 centres partenaires, CACES, habilitations électriques, secours, incendie.'
  },
  'LEARN UP ACADEMY'
)

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            name: 'LEARN UP ACADEMY',
            url: 'https://learnup.fr',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://learnup.fr/formations?search={search_term_string}',
              'query-input': 'required name=search_term_string'
            }
          },
          {
            '@type': 'Organization',
            name: 'LEARN UP ACADEMY',
            url: 'https://learnup.fr',
            description: 'Plateforme de conseil en formation professionnelle réglementaire.'
          }
        ]
      })
    }
  ]
})
</script>
