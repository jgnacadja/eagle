<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <!-- route.path (et non fullPath) : on veut un remount quand le slug
         change (ex: /formations/a -> /formations/b) mais PAS quand seuls
         les query params changent (filtres, pagination) — sinon chaque
         frappe dans la recherche remonte la page (focus perdu, scroll
         réinitialisé). -->
    <NuxtPage :page-key="(route) => route.path" />
  </NuxtLayout>
</template>
