<template>
  <footer class="bg-ink text-ink-inverse-muted">
    <div class="mx-auto max-w-container px-6 py-16">
      <div class="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
        <div>
          <div class="flex items-center gap-2">
            <AppLogo />
            <p class="text-xs font-bold tracking-wide text-ink-inverse">LEARN UP ACADEMY</p>
          </div>
          <p class="mt-4 max-w-xs text-sm text-ink-inverse-muted">
            La plateforme B2B qui comprend, localise et orchestre la formation professionnelle
            réglementaire.
          </p>
        </div>

        <nav>
          <h3 class="text-xs font-bold tracking-wide text-ink-inverse">Formations</h3>
          <ul class="mt-4 space-y-2 text-sm">
            <li>
              <NuxtLink to="/formations/caces-conduite-engins" class="hover:text-ink-inverse"
                >CACES &amp; conduite d'engins</NuxtLink
              >
            </li>
            <li>
              <NuxtLink to="/formations/habilitation-electrique" class="hover:text-ink-inverse"
                >Habilitations électriques</NuxtLink
              >
            </li>
            <li>
              <NuxtLink to="/formations" class="hover:text-ink-inverse">Tout le catalogue</NuxtLink>
            </li>
          </ul>
        </nav>

        <nav>
          <h3 class="text-xs font-bold tracking-wide text-ink-inverse">Entreprises</h3>
          <ul class="mt-4 space-y-2 text-sm">
            <li>
              <NuxtLink to="/confier" class="hover:text-ink-inverse"
                >Confier mes formations</NuxtLink
              >
            </li>
            <li>
              <NuxtLink to="/formation-intra" class="hover:text-ink-inverse"
                >Formation intra &amp; sur site</NuxtLink
              >
            </li>
            <li>
              <NuxtLink to="/multi-sites" class="hover:text-ink-inverse"
                >Gestion multi-sites</NuxtLink
              >
            </li>
          </ul>
        </nav>

        <nav>
          <h3 class="text-xs font-bold tracking-wide text-ink-inverse">Rejoindre</h3>
          <ul class="mt-4 space-y-2 text-sm">
            <li>
              <NuxtLink to="/franchise" class="hover:text-ink-inverse">Devenir franchisé</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/referencer" class="hover:text-ink-inverse"
                >Référencer mon organisme</NuxtLink
              >
            </li>
            <li>
              <NuxtLink to="/formateur" class="hover:text-ink-inverse"
                >Formateur indépendant</NuxtLink
              >
            </li>
          </ul>
        </nav>

        <nav>
          <h3 class="text-xs font-bold tracking-wide text-ink-inverse">À propos</h3>
          <ul class="mt-4 space-y-2 text-sm">
            <li>
              <NuxtLink to="/a-propos" class="hover:text-ink-inverse">Qui sommes-nous</NuxtLink>
            </li>
            <li><NuxtLink to="/actualites" class="hover:text-ink-inverse">Actualités</NuxtLink></li>
            <li><NuxtLink to="/contact" class="hover:text-ink-inverse">Contact</NuxtLink></li>
          </ul>
        </nav>
      </div>

      <div
        class="mt-12 flex flex-col gap-3 border-t border-outline-inverse pt-6 text-xs text-ink-inverse-muted sm:flex-row sm:items-center sm:justify-between"
      >
        <p>© {{ year }} LEARN UP ACADEMY — Tous droits réservés</p>
        <div class="flex flex-wrap gap-x-6 gap-y-2">
          <NuxtLink to="/mentions-legales" class="hover:text-ink-inverse"
            >Mentions légales</NuxtLink
          >
          <NuxtLink to="/confidentialite" class="hover:text-ink-inverse">Confidentialité</NuxtLink>
          <NuxtLink to="/accessibilite" class="hover:text-ink-inverse"
            >Accessibilité — RGAA AA</NuxtLink
          >
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>
