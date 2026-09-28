<template>
  <NuxtRouteAnnouncer />
  <MotionConfig reduced-motion="user">
    <NuxtLayout>
      <!-- route.path (et non fullPath) : on veut un remount quand le slug
         change (ex: /formations/a -> /formations/b) mais PAS quand seuls
         les query params changent (filtres, pagination) — sinon chaque
         frappe dans la recherche remonte la page (focus perdu, scroll
         réinitialisé). -->
      <NuxtPage :page-key="(route) => route.path" />
    </NuxtLayout>
    <AssistantChat />
  </MotionConfig>
</template>

<script setup lang="ts">
const route = useRoute()
const { origin } = useRequestURL()

// L'image vit dans public/ du même déploiement : l'URL absolue est résolue
// depuis l'origine de la requête (pas siteUrl) pour qu'elle existe toujours,
// y compris sur les previews Vercel où siteUrl peut pointer ailleurs.
const ogImage = `${origin}/images/learnup-preview-card.png`

// Métadonnées OG/Twitter par défaut — les pages de contenu surchargent
// title/description/canonical via useContentSeo ; les clés non définies
// (type, site_name, image…) héritent de ces valeurs.
useSeoMeta({
  description:
    'La plateforme B2B qui comprend, localise et orchestre la formation professionnelle réglementaire.',
  ogType: 'website',
  ogSiteName: 'LEARN UP ACADEMY',
  ogLocale: 'fr_FR',
  ogUrl: computed(() => `${origin}${route.path}`),
  ogImage,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'LEARN UP ACADEMY — plateforme de conseil en formation professionnelle',
  twitterCard: 'summary_large_image',
  twitterImage: ogImage
})
</script>
