<template>
  <footer class="bg-ink text-ink-inverse-muted">
    <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter py-section">
      <div class="grid gap-2xl md:grid-cols-6">
        <div class="md:col-span-2">
          <div class="flex items-center gap-2">
            <Logo />
            <p class="text-overline text-ink-inverse">LEARN UP ACADEMY</p>
          </div>
          <p class="mt-md max-w-prose text-small text-ink-inverse-muted">
            La plateforme B2B qui comprend, localise et orchestre la formation professionnelle
            réglementaire.
          </p>
        </div>

        <nav class="md:col-span-1" aria-label="Formations">
          <h3 class="text-overline text-ink-inverse">Formations</h3>
          <ul class="mt-md space-y-sm text-small">
            <li>
              <NuxtLink to="/" class="hover:text-ink-inverse"
                >CACES &amp; conduite d'engins</NuxtLink
              >
            </li>
            <li>
              <NuxtLink to="/" class="hover:text-ink-inverse">Habilitations électriques</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/" class="hover:text-ink-inverse">Tout le catalogue</NuxtLink>
            </li>
          </ul>
        </nav>

        <nav class="md:col-span-1" aria-label="Entreprises">
          <h3 class="text-overline text-ink-inverse">Entreprises</h3>
          <ul class="mt-md space-y-sm text-small">
            <li>
              <NuxtLink to="/" class="hover:text-ink-inverse">Confier mes formations</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/" class="hover:text-ink-inverse"
                >Formation intra &amp; sur site</NuxtLink
              >
            </li>
            <li>
              <NuxtLink to="/" class="hover:text-ink-inverse">Gestion multi-sites</NuxtLink>
            </li>
          </ul>
        </nav>

        <nav class="md:col-span-1" aria-label="Rejoindre">
          <h3 class="text-overline text-ink-inverse">Rejoindre</h3>
          <ul class="mt-md space-y-sm text-small">
            <li>
              <NuxtLink to="/" class="hover:text-ink-inverse">Devenir franchisé</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/" class="hover:text-ink-inverse">Référencer mon organisme</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/" class="hover:text-ink-inverse">Formateur indépendant</NuxtLink>
            </li>
          </ul>
        </nav>

        <nav class="md:col-span-1" aria-label="À propos">
          <h3 class="text-overline text-ink-inverse">À propos</h3>
          <ul class="mt-md space-y-sm text-small">
            <li>
              <NuxtLink to="/" class="hover:text-ink-inverse">Qui sommes-nous</NuxtLink>
            </li>
            <li><NuxtLink to="/" class="hover:text-ink-inverse">Actualités</NuxtLink></li>
            <li><NuxtLink to="/" class="hover:text-ink-inverse">Contact</NuxtLink></li>
          </ul>
        </nav>
      </div>

      <div
        class="mt-2xl flex flex-col gap-sm border-t border-outline-inverse pt-lg text-meta text-ink-inverse-muted sm:flex-row sm:items-center sm:justify-between"
      >
        <p>© {{ year }} LEARN UP ACADEMY — Tous droits réservés</p>
        <div class="flex flex-wrap gap-x-lg gap-y-sm">
          <NuxtLink to="/" class="hover:text-ink-inverse">Mentions légales</NuxtLink>
          <NuxtLink to="/" class="hover:text-ink-inverse">Confidentialité</NuxtLink>
          <NuxtLink to="/" class="hover:text-ink-inverse">Accessibilité — RGAA AA</NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>
