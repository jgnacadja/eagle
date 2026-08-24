<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <!-- Sans ceci, Nuxt réutilise l'instance entre deux pages de la même
         route dynamique (ex: /blog/a -> /blog/b) et le setup() ne se
         relance pas : les données affichées resteraient celles du slug
         précédent. -->
    <NuxtPage :page-key="(route) => route.fullPath" />
  </NuxtLayout>
</template>
