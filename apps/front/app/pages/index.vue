<template>
  <main class="bg-paper">
    <SectionHero />
    <SectionStatsTicker />
    <SectionNetwork />
    <SectionHowItWorks />
    <SectionFormations />
    <SectionCentres />
    <SectionConfier />
    <SectionStats />
    <SectionTestimonials />
    <SectionNews />
  </main>
</template>

<script setup lang="ts">
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
