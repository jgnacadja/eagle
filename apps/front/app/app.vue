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
  </MotionConfig>
</template>

<script setup lang="ts">
const { public: publicConfig } = useRuntimeConfig()

// Image de preview par défaut (partage social) — les pages de contenu
// peuvent la surcharger via useContentSeo sans entrer en conflit ici.
useSeoMeta({
  ogImage: `${publicConfig.siteUrl}/images/learnup-review-card.png`,
  twitterCard: 'summary_large_image',
  twitterImage: `${publicConfig.siteUrl}/images/learnup-review-card.png`
})
</script>
