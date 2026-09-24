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
const { origin } = useRequestURL()

// Image de preview par défaut (partage social)
useSeoMeta({
  ogImage: `${origin}/images/learnup-preview-card.png`,
  twitterCard: 'summary_large_image',
  twitterImage: `${origin}/images/learnup-preview-card.png`
})
</script>
