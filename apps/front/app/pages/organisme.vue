<template>
  <div class="bg-paper">
    <section class="relative isolate overflow-hidden bg-primary-dark text-ink-inverse">
      <div
        class="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-primary-muted/60"
      />
      <div
        class="pointer-events-none absolute -bottom-48 -left-24 h-96 w-96 rounded-full bg-primary-muted/40"
      />

      <div class="relative mx-auto px-gutter-mobile py-4xl md:px-gutter md:py-4xl">
        <div class="max-w-prose">
          <span
            class="inline-block rounded-full border border-outline-inverse px-lg py-sm text-overline font-bold uppercase text-ink-inverse-muted"
          >
            ORGANISME PARTENAIRE
          </span>
          <h1 class="mt-xl font-display text-h2 font-extrabold leading-tight md:text-hero">
            Référencer vos centres,
            <span class="text-accent"> recevez des demandes qualifiées</span>.
          </h1>
          <p class="mt-lg max-w-prose text-lead text-ink-inverse-muted">
            Votre organisme de formation conserve son identité juridique et son fonctionnement. Le
            réseau LEARN UP ACADEMY qualifie les besoins des entreprises et transmet les demandes
            aux partenaires de leur territoire.
          </p>
          <div class="mt-xl flex flex-wrap gap-md">
            <Button
              as-child
              class="h-control w-full rounded-full bg-accent px-xl text-button font-bold text-ink transition-colors hover:bg-accent-text hover:text-ink-inverse sm:w-auto"
            >
              <NuxtLink to="#candidater">Référencer mon organisme</NuxtLink>
            </Button>

            <Button
              as-child
              variant="outline"
              class="h-control w-full rounded-full border-outline-inverse bg-transparent px-xl text-button font-bold text-ink-inverse transition-colors hover:bg-ink-inverse/10 hover:text-ink-inverse sm:w-auto"
            >
              <NuxtLink to="#modele">Comment fonctionne le réseau</NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <div class="mx-auto px-gutter-mobile py-section md:px-gutter md:py-4xl">
      <section aria-labelledby="options-title">
        <h2 id="options-title" class="font-display text-h2 font-extrabold text-ink">
          Comment fonctionne le partenariat
        </h2>
        <ProcessSteps :steps="steps" last-step-variant="accent" title-size="h4" class="mt-2xl" />
      </section>

      <!-- Benefits -->
      <Benefits id="modele" title="Ce que le partenariat apporte" :benefits="benefits" />

      <section id="maillage" class="mt-4xl" aria-labelledby="maillage">
        <div class="flex flex-col md:flex-row gap-14 items-start">
          <!-- Colonne gauche -->
          <div class="w-full md:w-81.75 shrink-0 pt-2">
            <h2 class="text-h2 font-extrabold leading-snug tracking-tight">
              Un maillage qui s'étend avec ses partenaires
            </h2>
            <p class="text-body text-ink-muted leading-relaxed mt-3">
              Le référencement d'un organisme étend la couverture du réseau sur son territoire et
              ses domaines. Les demandes des entreprises sont transmises au plus près.
            </p>

            <div class="flex mt-6">
              <div class="pr-5">
                <div class="text-2xl font-extrabold tracking-tight">+400</div>
                <div class="text-xs text-bayoux mt-1 leading-tight">centres partenaires</div>
              </div>
              <div class="border-l border-bunting/15 pl-5 pr-5">
                <div class="text-2xl font-extrabold tracking-tight">96</div>
                <div class="text-xs text-bayoux mt-1 leading-tight">départements<br />couverts</div>
              </div>
              <div class="border-l border-bunting/15 pl-5">
                <div class="text-2xl font-extrabold tracking-tight">+250</div>
                <div class="text-xs text-bayoux mt-1 leading-tight">
                  formations au<br />catalogue
                </div>
              </div>
            </div>
          </div>

          <!-- Carte placeholder -->
          <div
            class="flex-1 w-full h-87.5 rounded-2xl bg-linkwater border border-dashed border-biscay/30 flex items-center justify-center text-center text-bayoux text-[12.5px] font-medium leading-relaxed px-6 bg-surface"
          >
            Carte de France interactive<br />départements couverts + centres du réseau
          </div>
        </div>
      </section>
    </div>

    <div class="bg-navy-primary text-white px-12 py-9">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h3 class="text-h2 font-extrabold tracking-tight">Référencer votre organisme</h3>
          <p class="text-sm text-ink-inverse-muted mt-1.5">
            La candidature décrit vos centres, vos domaines et votre territoire. L'étude ne comporte
            aucun engagement.
          </p>
        </div>
        <Button
          type="submit"
          class="h-control w-full shrink-0 rounded-full bg-accent px-xl text-small font-semibold text-ink hover:bg-accent-text hover:text-paper sm:w-auto"
        >
          Déposer une candidature
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useContentSeo(
  {
    seo_title: 'Référencer votre centre — LEARN UP ACADEMY',
    seo_description:
      'Référencer votre centre pour recevoir des demandes qualifiées sur le réseau LEARN UP ACADEMY.'
  },
  'Référencer votre centre — LEARN UP ACADEMY'
)

const benefits = [
  {
    label: 'Demandes',
    title: 'Des besoins qualifiés, sur votre périmètre',
    body: 'Le catalogue et la recherche assistée qualifient chaque besoin avant transmission, sur vos domaines et votre territoire.'
  },
  {
    label: 'Visibilité',
    title: 'Une présence dans le catalogue national',
    body: 'Pages centre référencées, familles de formations, actualités : vos centres bénéficient de la présence de la marque.'
  },
  {
    label: 'Indépendance',
    title: 'Votre structure reste la vôtre',
    body: 'Identité juridique, équipe et locaux conservés. Vous restez maître de vos plannings et de vos sessions.'
  },
  {
    label: 'Outils',
    title: 'La gestion des sessions et des demandes',
    body: 'Publication des sessions, disponibilités en temps réel, suivi des demandes : un outillage commun au réseau.'
  }
]

const steps = [
  {
    title: 'Référencement',
    body: 'Vos centres, vos domaines et votre territoire sont enregistrés dans le réseau.'
  },
  {
    title: 'Publication',
    body: 'Vos sessions rejoignent le catalogue commun et la carte des centres.'
  },
  {
    title: 'Demandes',
    body: 'Les besoins qualifiés (formation, effectif, lieu, échéance) vous sont transmis.'
  }
]
</script>
