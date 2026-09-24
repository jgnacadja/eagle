<template>
  <!-- Vue de discussion pleine page : en-tête du site (logo = sortie vers la
       Home), pas de pied de page — le contenu du moteur occupe tout l'écran. -->
  <div class="flex min-h-screen flex-col bg-paper">
    <AppHeader />
    <main class="flex flex-1 flex-col">
      <slot />
    </main>
  </div>
</template>
