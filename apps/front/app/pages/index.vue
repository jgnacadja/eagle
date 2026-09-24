<template>
  <div class="bg-paper">
    <!-- ═══════════════════════════════════════════════════
         1. HERO
    ════════════════════════════════════════════════════ -->
    <section class="relative overflow-hidden bg-linear-to-b from-paper to-surface">
      <div
        class="pointer-events-none absolute -bottom-44 -left-32 h-96 w-96 rounded-full bg-primary/5"
      />
      <div
        class="pointer-events-none absolute -right-36 -top-32 h-96 w-96 rounded-full bg-accent/5"
      />

      <!-- Floating badge desktop -->
      <div
        class="pointer-events-none absolute right-6 top-8 hidden lg:block xl:right-5 xl:top-12 -rotate-3 z-10"
      >
        <div class="rounded-2xl border border-rule/50 bg-paper px-6 py-4 shadow-md text-left">
          <p class="font-display text-lead font-bold italic leading-snug text-ink">
            Des compétences aujourd'hui<br />
            pour les défis de demain
          </p>
          <div class="mt-2 h-1 w-14 rounded-full bg-accent" />
        </div>
      </div>

      <div
        class="relative mx-auto max-w-container px-gutter-mobile md:px-gutter pb-section pt-3xl md:pt-4xl text-center"
      >
        <div>
          <!-- Pill badge -->
          <span
            class="inline-block rounded-full border border-primary/25 bg-paper px-4 py-1.5 text-xs md:text-small font-bold uppercase tracking-wider text-primary shadow-xs"
          >
            Plateforme de conseil et d'orientation en formation professionnelle
          </span>

          <!-- H1 -->
          <h1
            class="mt-4 md:mt-5 font-display text-h2 md:text-h1 font-extrabold leading-tight text-ink"
          >
            Vos besoins de formation,<br />
            <span class="text-accent-text">orchestrés</span> de bout en bout.
          </h1>

          <!-- Subtitle -->
          <p class="mt-3 md:mt-4 font-sans text-body md:text-lead font-bold text-ink">
            La bonne formation. Au bon endroit. Au bon moment. Partout en France.
          </p>

          <!-- Prompt -->
          <div class="mt-6 md:mt-8">
            <h2 class="font-display text-h4 md:text-h3 font-extrabold text-ink">
              Besoin d'aide pour choisir votre formation&nbsp;?
            </h2>
            <p class="mx-auto mt-2 text-small md:text-sm text-ink-muted max-w-132.5">
              Décrivez votre besoin ou posez votre question. Nous vous guidons vers la solution
              adaptée.
            </p>
          </div>

          <!-- Search bar -->
          <form class="mx-auto mt-6 w-full max-w-prose md:max-w-170" @submit.prevent="onHeroSearch">
            <div
              class="flex h-14 md:h-16 items-center gap-3 rounded-full border-2 border-primary/75 bg-paper pl-4 md:pl-6 pr-2 shadow-sm transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
            >
              <IconSparkle :size="22" class="shrink-0 text-accent" />
              <label for="hero-search-input" class="sr-only"
                >Décrivez votre besoin de formation</label
              >
              <input
                id="hero-search-input"
                v-model="heroSearch"
                type="text"
                class="h-auto flex-1 border-0 bg-transparent px-0 text-small md:text-body text-ink placeholder:text-ink-subtle focus:outline-none"
                placeholder="Ex. : Je dois former 8 salariés au CACES près de Lyon avant septembre."
              />
              <button
                type="submit"
                aria-label="Lancer la recherche"
                class="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary text-paper transition-colors hover:bg-primary-dark"
              >
                <IconSearch :size="18" class="text-paper" />
              </button>
            </div>
            <p
              class="mt-3 text-xs md:text-small text-ink-muted whitespace-normal md:whitespace-nowrap"
            >
              Vous pouvez écrire comme vous le feriez à un conseiller.
            </p>
          </form>

          <!-- 3 Value propositions -->
          <div
            class="mx-auto mt-6 flex flex-col items-start gap-3 text-small font-bold text-ink md:w-auto md:flex-row md:items-center md:justify-center md:gap-5"
          >
            <div class="inline-flex items-center gap-2">
              <IconMessageCircle :size="18" class="shrink-0 text-accent" />
              <span>Obtenez des conseils personnalisés</span>
            </div>
            <span class="hidden text-rule md:inline" aria-hidden="true">|</span>
            <div class="inline-flex items-center gap-2">
              <IconMapPin :size="18" class="shrink-0 text-accent" />
              <span>Trouvez la formation près de chez vous</span>
            </div>
            <span class="hidden text-rule md:inline" aria-hidden="true">|</span>
            <div class="inline-flex items-center gap-2">
              <IconCalendar :size="18" class="shrink-0 text-accent" />
              <span>Consultez les prochaines sessions</span>
            </div>
          </div>

          <!-- CTA Link -->
          <div class="mt-5">
            <NuxtLink
              to="/parler-a-votre-conseiller"
              class="inline-block text-small md:text-body font-bold text-accent-text underline underline-offset-4 transition-colors hover:text-primary"
            >
              Besoin d'être accompagné&nbsp;? Parler à votre conseiller
              <span class="link-arrow">→</span>
            </NuxtLink>
            <p class="mx-auto mt-1 max-w-callout text-xs text-ink-subtle md:hidden">
              Ouvre le formulaire « Demande conseiller » — identité, contact, SIRET, nature du
              besoin.
            </p>
          </div>
        </div>

        <!-- Floating badge mobile -->
        <div class="my-6 flex justify-center lg:hidden">
          <div class="rounded-xl border border-rule/60 bg-paper px-5 py-3 shadow-md text-left">
            <p class="font-display text-sm font-extrabold italic leading-snug text-ink">
              Des compétences aujourd'hui<br />
              pour les défis de demain
            </p>
            <div class="mt-1.5 h-1 w-12 rounded-full bg-accent" />
          </div>
        </div>

        <!-- 4 Cards -->
        <div class="mt-8 md:mt-12">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-md">
            <div
              class="flex items-center gap-3.5 rounded-xl border border-rule/60 bg-paper p-4 text-left shadow-xs transition-shadow hover:shadow-sm"
            >
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-primary"
              >
                <IconUsers :size="24" />
              </div>
              <div>
                <p class="text-small font-bold text-ink">Entreprises de toutes tailles</p>
                <p class="mt-0.5 text-xs text-ink-muted">TPE, PME, ETI, grands comptes</p>
              </div>
            </div>

            <div
              class="flex items-center gap-3.5 rounded-xl border border-rule/60 bg-paper p-4 text-left shadow-xs transition-shadow hover:shadow-sm"
            >
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-primary"
              >
                <IconMapPin :size="24" />
              </div>
              <div>
                <p class="text-small font-bold text-ink">Partout en France</p>
                <p class="mt-0.5 text-xs text-ink-muted">
                  Un réseau de centres proches de vos équipes
                </p>
              </div>
            </div>

            <div
              class="flex items-center gap-3.5 rounded-xl border border-rule/60 bg-paper p-4 text-left shadow-xs transition-shadow hover:shadow-sm"
            >
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-primary"
              >
                <IconFileText :size="24" />
              </div>
              <div>
                <p class="text-small font-bold text-ink">Formations réglementaires</p>
                <p class="mt-0.5 text-xs text-ink-muted">Des solutions adaptées à vos métiers</p>
              </div>
            </div>

            <div
              class="flex items-center gap-3.5 rounded-xl border border-warning/40 bg-paper p-4 text-left shadow-xs transition-shadow hover:shadow-sm"
            >
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning"
              >
                <IconRibbon :size="24" />
              </div>
              <div>
                <p class="text-small font-bold text-ink">Certifié Qualiopi</p>
                <a
                  href="/certificat-qualiopi.pdf"
                  target="_blank"
                  rel="noopener"
                  class="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-ink underline underline-offset-2 transition-colors hover:text-accent-text"
                >
                  Télécharger le certificat (PDF)
                  <IconDownload :size="13" class="shrink-0" />
                </a>
              </div>
            </div>
          </div>

          <!-- Annotation mobile Qualiopi -->
          <p class="mx-auto mt-2 text-left text-xs text-ink-subtle md:hidden">
            Certificat Qualiopi téléchargeable (PDF) — périmètre et numéro à confirmer avant mise en
            ligne.
          </p>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         TICKER — barre de chiffres clés
    ════════════════════════════════════════════════════ -->
    <div class="bg-primary-dark">
      <div
        class="mx-auto grid grid-cols-2 gap-px md:grid-cols-4 divide-x-0 md:divide-x divide-white/10"
      >
        <div
          v-for="item in tickerItems"
          :key="item.key"
          class="flex items-center gap-3 px-gutter-mobile md:px-lg py-md"
        >
          <!-- icône -->
          <component :is="item.icon" :size="22" class="shrink-0 text-white/50" />
          <div>
            <p
              v-if="item.value"
              class="font-display text-h4 md:text-h3 font-extrabold leading-none text-white"
            >
              {{ item.value }}
            </p>
            <p class="text-xs md:text-small text-white/70 leading-tight mt-0.5">
              {{ item.label }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════
         ILS NOUS FONT CONFIANCE — logos clients
    ════════════════════════════════════════════════════ -->
    <section class="border-b border-rule bg-paper py-lg">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <p
          class="text-center text-xs font-bold uppercase tracking-widest text-ink md:text-ink-subtle"
        >
          Ils nous font confiance
        </p>

        <div
          class="mt-md grid grid-cols-4 gap-2 sm:gap-3 md:flex md:flex-wrap md:items-center md:justify-center md:gap-md"
          aria-label="Références clients"
        >
          <div
            v-for="company in techCompanyLogos"
            :key="company.name"
            class="flex h-14 items-center justify-center rounded-xl border border-dashed border-rule px-2 text-xs text-ink-subtle md:h-14 md:w-32 md:rounded md:px-3"
            :aria-label="`Logo client ${company} à fournir`"
          >
            <img
              :src="company.logoUrl"
              :alt="`Logo ${company.name}`"
              class="max-h-7 max-w-[80%] object-contain"
              loading="lazy"
            />
          </div>
        </div>

        <p class="mt-sm text-center text-xs text-ink-subtle">
          <span class="md:hidden">Sous réserve d'autorisation d'usage des logos</span>
          <span class="hidden md:inline">
            Références clients — affichage sous réserve d'autorisation écrite d'usage des logos
          </span>
        </p>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         2. FORMATIONS
    ════════════════════════════════════════════════════ -->
    <section id="formations" class="bg-surface py-section">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <div class="flex items-end justify-between">
          <div>
            <h2 class="font-display text-xl md:text-h2 font-extrabold text-ink">
              Les formations réglementaires adaptées à vos métiers
            </h2>
            <p class="mt-sm font-sans text-sm md:text-body text-ink-muted">
              CACES®, AIPR, habilitations électriques, SST, CATEC®, travail en hauteur, amiante SS4…
            </p>
          </div>
        </div>

        <div class="mt-2xl grid gap-grid grid-cols-2 lg:grid-cols-4">
          <FormationCard
            v-for="(item, i) in dernieresFormations"
            :key="item.slug"
            v-reveal="revealStagger(i)"
            :title="item.title"
            :body="item.description"
            :image-top="item.family"
            :image-bottom="item.meta"
            :image="item.image"
            :to="item.to"
          />
        </div>

        <div class="mt-lg flex flex-col gap-md sm:flex-row">
          <div class="flex flex-wrap gap-sm">
            <NuxtLink
              v-for="tag in formationTags"
              :key="tag"
              :to="`/formations?q=${encodeURIComponent(tag)}`"
              class="rounded-full border border-rule bg-paper p-3 text-meta font-medium text-ink transition-colors hover:border-primary hover:text-primary"
            >
              {{ tag }}
            </NuxtLink>
          </div>
        </div>
        <div class="flex items-center justify-center mt-xl">
          <Button as-child size="pill-lg" class="w-full sm:w-auto">
            <NuxtLink to="/formations">
              Voir tout le catalogue <span class="link-arrow">→</span>
            </NuxtLink>
          </Button>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         3. CENTRES
    ════════════════════════════════════════════════════ -->
    <section id="centres" class="mx-auto px-gutter-mobile md:px-gutter py-section">
      <div class="flex flex-col gap-md sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="font-display text-xl md:text-h2 font-extrabold text-ink">
            Trouvez le centre de formation le plus proche de chez vous
          </h2>
          <p class="mt-sm max-w-prose font-sans text-sm text-ink-muted">
            <span class="font-bold text-primary">+400 centres partenaires</span>
            dans
            <span class="font-bold text-primary">96 départements</span>
            — en centre, sur votre site ou en intra-entreprise.
          </p>
        </div>
        <NuxtLink
          to="/centres"
          class="hidden whitespace-nowrap text-body font-bold text-primary transition-colors hover:text-accent-text md:block"
        >
          Explorer la carte des centres <span class="link-arrow">→</span>
        </NuxtLink>
      </div>

      <div class="mt-xl grid gap-grid lg:grid-cols-3">
        <div
          class="h-80 overflow-hidden rounded-md border border-rule bg-surface md:h-112 lg:col-span-2"
        >
          <CenterMap
            v-if="homeMapCenters.length"
            :centers="homeMapCenters"
            :active-id="null"
            :caption="''"
            :user-position="userPosition"
          />
          <div
            v-else
            class="flex h-full items-center justify-center px-md text-center text-meta text-ink-muted"
          >
            Carte de France interactive<br />départements + pins centres — lisible, pas un outil SIG
          </div>
        </div>

        <div class="flex flex-col gap-md lg:col-span-1 h-fit">
          <SearchInput
            v-model="mapSearch"
            input-id="map-search"
            sr-label="Rechercher une ville, code postal ou département"
            placeholder="Ville, code postal ou département"
            :suggestions="mapSearchSuggestions"
            @input="onMapSearchInput"
            @submit="onMapSearch"
          >
            <template #icon>
              <IconSearch :size="20" class="shrink-0 text-primary" />
            </template>
            <template #action>
              <GeoNearMe />
            </template>
          </SearchInput>

          <CenterCard
            v-for="(centre, i) in derniersCentres"
            :key="centre.slug"
            v-reveal="revealStagger(i)"
            :name="centre.name"
            :distance="centreDistance(centre)"
            :formations="centreFormations(centre)"
            :status="centreStatus(centre)"
            :to="`/centres/${centre.slug}`"
          />

          <div>
            <Button as-child size="pill-lg" class="w-full sm:w-auto">
              <NuxtLink to="/centres">
                Explorer la carte des centres <span class="link-arrow">→</span>
              </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         4. CONFIER (section sombre)
    ════════════════════════════════════════════════════ -->
    <section id="confier" class="bg-primary-muted py-section text-ink-inverse">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <div class="grid grid-cols-1 items-center gap-xl lg:grid-cols-2 lg:gap-2xl">
          <!-- Colonne gauche : Contenu & CTA -->
          <div v-reveal class="flex flex-col items-start">
            <p class="text-overline font-extrabold uppercase tracking-wider text-accent">
              ENTREPRISES
            </p>

            <h2 class="mt-xs font-display text-xl md:text-h2 font-extrabold text-ink-inverse">
              Simplifiez la gestion de vos formations
            </h2>

            <p class="mt-sm max-w-prose text-small md:text-body text-ink-inverse-muted">
              Un interlocuteur unique pour accompagner vos besoins de formation, partout en France.
            </p>

            <!-- Checklist bénéfices -->
            <ul
              class="mt-lg flex flex-col gap-y-sm md:flex-row md:flex-wrap md:items-center md:gap-x-lg"
            >
              <li
                v-for="benefit in enterpriseBenefits"
                :key="benefit"
                class="flex items-center gap-xs text-small md:text-body font-medium text-ink-inverse"
              >
                <IconCheck :size="16" class="shrink-0 text-accent stroke-[2.5]" />
                <span>{{ benefit }}</span>
              </li>
            </ul>

            <!-- Boutons d'action -->
            <div class="mt-xl flex w-full flex-col gap-md sm:w-auto sm:flex-row sm:items-center">
              <Button as-child variant="accent" size="pill-lg" class="w-full sm:w-auto">
                <NuxtLink to="/centres/demande-de-formation">
                  Découvrir nos solutions entreprises <span class="link-arrow">→</span>
                </NuxtLink>
              </Button>
              <Button as-child variant="outline-inverse" size="pill-lg" class="w-full sm:w-auto">
                <NuxtLink to="/parler-a-votre-conseiller">Parler à votre conseiller</NuxtLink>
              </Button>
            </div>
          </div>

          <!-- Colonne droite : Placeholder visuel -->
          <div>
            <div
              class="hidden md:flex aspect-16/10 w-full items-center justify-center rounded-2xl border border-dashed border-outline-inverse/60 p-md text-center sm:p-lg h-77.25"
              role="img"
              aria-label="Photo responsable formation en entreprise"
            >
              <p class="text-xs md:text-small text-ink-inverse/60">
                Photo à fournir — responsable formation en entreprise,<br />
                contexte multi-sites (bureau / terrain)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         5. PROCHAINES SESSIONS
    ════════════════════════════════════════════════════ -->
    <section id="sessions" class="mx-auto px-gutter-mobile md:px-gutter py-section">
      <div>
        <h2 class="font-display text-xl md:text-h2 font-extrabold text-ink">
          Les prochaines sessions près de chez vous
        </h2>
        <p class="mt-xs max-w-prose text-sm text-ink-muted">
          Personnalisées selon votre localisation ou votre dernière recherche.
        </p>
      </div>

      <div class="mt-xl grid grid-cols-1 gap-md md:grid-cols-3">
        <NuxtLink
          v-for="(session, i) in displayUpcomingSessions"
          :key="session.id"
          v-reveal="revealStagger(i)"
          :to="session.to"
          class="group flex items-center gap-md rounded-2xl border border-rule bg-paper p-md transition-all duration-200 hover:border-primary/40 hover:shadow-sm sm:p-lg"
        >
          <!-- Date box -->
          <div
            class="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-alt text-center"
          >
            <span class="font-display text-xl md:text-2xl font-extrabold leading-none text-ink">
              {{ session.day }}
            </span>
            <span
              class="mt-xs text-[10px] font-extrabold uppercase tracking-wider text-accent-text"
            >
              {{ session.month }}
            </span>
          </div>

          <!-- Détails -->
          <div class="flex min-w-0 flex-1 flex-col items-start gap-1">
            <h3
              class="line-clamp-1 font-sans text-sm font-bold text-ink transition-colors group-hover:text-primary md:text-body"
            >
              {{ session.title }}
            </h3>
            <p class="line-clamp-1 text-xs text-ink-muted">
              {{ session.location }}
            </p>
            <span
              v-if="session.badgeText"
              :class="[
                'mt-xs inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                session.badgeVariant === 'warning'
                  ? 'bg-warning-soft text-warning'
                  : 'bg-success-soft text-success'
              ]"
            >
              {{ session.badgeText }}
            </span>
          </div>
        </NuxtLink>
      </div>

      <p class="mt-md text-xs text-ink-muted">
        Affichage d'exemple : en production, les sessions proviennent exclusivement des données
        réelles du réseau — aucune session fictive ; bloc masqué si aucune session à proximité.
      </p>

      <div class="mt-xl flex justify-center">
        <Button as-child variant="outline" size="pill-lg" class="w-full sm:w-auto">
          <NuxtLink to="/formations">
            Voir toutes les sessions <span class="link-arrow">→</span>
          </NuxtLink>
        </Button>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         6. POURQUOI LEARN UP ACADEMY
    ════════════════════════════════════════════════════ -->
    <section id="pourquoi" class="bg-surface py-section">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <h2 class="font-display text-xl md:text-h2 font-extrabold text-ink">
          Pourquoi Learn Up Academy ?
        </h2>

        <div class="mt-xl grid gap-md grid-cols-2 lg:grid-cols-3">
          <article
            v-for="(benefit, i) in benefits"
            :key="benefit.title"
            v-reveal="revealStagger(i)"
            class="flex flex-col items-start rounded-2xl border border-rule bg-paper p-3 md:p-5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
          >
            <div
              class="hidden md:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-primary"
            >
              <component :is="benefit.icon" :size="20" />
            </div>
            <h3 class="font-display text-small md:text-xl font-bold text-ink md:mt-3">
              {{ benefit.title }}
            </h3>
            <p class="mt-xs text-xs sm:text-small text-ink-muted leading-relaxed">
              {{ benefit.body }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         7 & 8. CE QU'EN DISENT LES ENTREPRISES (STATS & TÉMOIGNAGES)
    ════════════════════════════════════════════════════ -->
    <section class="border-b border-rule bg-paper py-section">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <h2 class="font-display text-xl md:text-h2 font-extrabold text-ink">
          Ce qu'en disent les entreprises
        </h2>

        <!-- Bandeau Stats avec séparateurs -->
        <div
          class="mt-xl grid grid-cols-2 gap-y-lg border-y border-rule py-lg md:grid-cols-4 md:py-xl"
        >
          <StatItem
            v-for="stat in stats"
            :key="stat.label"
            :value="stat.value"
            :unit="stat.unit"
            :label="stat.label"
            class="border-r border-rule even:border-r-0 md:even:border-r last:border-r-0! odd:pr-md even:pl-md md:px-lg first:pl-0"
          />
        </div>

        <!-- Témoignages -->
        <div class="mt-xl grid gap-md md:grid-cols-3 lg:gap-lg">
          <TestimonialCard
            v-for="(t, i) in testimonials"
            :key="t.author"
            v-reveal="revealStagger(i)"
            :stars="t.stars"
            :quote="t.quote"
            :author="t.author"
          />
        </div>

        <!-- Pied de section : Qualiopi & CTA -->
        <div class="mt-xl flex flex-col gap-lg sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-md">
            <div
              class="flex h-16 w-32 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-rule-strong bg-surface/50 text-center text-[11px] leading-tight text-ink-muted/80"
              role="img"
              aria-label="Logo Qualiopi à confirmer"
            >
              <span>Logo Qualiopi</span>
              <span>à confirmer</span>
            </div>
            <p class="max-w-119.25 text-xs text-ink-muted">
              Certification Qualiopi — périmètre, catégories d'actions et numéro à confirmer avant
              affichage.
            </p>
          </div>

          <div class="shrink-0">
            <Button as-child variant="outline" size="pill-lg" class="w-full sm:w-auto">
              <NuxtLink to="/"> Voir tous les avis <span class="link-arrow">→</span> </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         9. RÉSEAU (Construisons ensemble)
    ════════════════════════════════════════════════════ -->
    <section class="bg-surface py-section">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <h2 class="text-center font-display text-xl md:text-h2 font-extrabold text-ink">
          Construisons ensemble le réseau Learn Up Academy
        </h2>

        <div class="mt-xl grid gap-md text-left md:grid-cols-3 lg:gap-lg">
          <NetworkCard
            v-for="(card, i) in networkCards"
            :key="card.title"
            v-reveal="revealStagger(i)"
            :title="card.title"
            :subtitle="card.subtitle"
            :to="card.to"
          />
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         10. ACTUALITÉS ET CONSEILS
    ════════════════════════════════════════════════════ -->
    <section id="actualites" class="mx-auto px-gutter-mobile md:px-gutter py-section">
      <div>
        <h2 class="font-display text-xl md:text-h2 font-extrabold text-ink">
          Actualités et conseils
        </h2>
      </div>

      <div class="mt-xl grid gap-md md:grid-cols-3 lg:gap-lg">
        <ArticleCard
          v-for="(article, i) in articles"
          :key="article.slug"
          v-reveal="revealStagger(i)"
          variant="card"
          :category="article.category ?? 'Conseil'"
          :title="article.title"
          :date="formatArticleDate(article.publish_at)"
          :excerpt="article.excerpt ?? ''"
          :image-url="assetUrl(article.cover_image) ?? undefined"
          :to="`/actualites/${article.slug}`"
        />
      </div>

      <div class="mt-xl flex justify-center">
        <Button as-child variant="outline" size="pill-lg">
          <NuxtLink to="/actualites">
            Toutes les actualités <span class="link-arrow">→</span>
          </NuxtLink>
        </Button>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         11. CTA BANNER (final)
    ════════════════════════════════════════════════════ -->
    <section class="bg-primary py-section text-ink-inverse">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <h2
          class="mx-auto text-center font-display text-xl md:text-h2 font-extrabold leading-tight text-ink-inverse"
        >
          Un besoin de formation ? Décrivez-nous votre situation.
        </h2>

        <form class="mx-auto mt-lg w-full max-w-prose" @submit.prevent="onCtaSearch">
          <div
            class="flex h-14 md:h-16 items-center gap-3 rounded-full bg-paper pl-4 md:pl-6 pr-2 shadow-lg transition-colors focus-within:ring-2 focus-within:ring-primary/20"
          >
            <IconSparkle :size="22" class="shrink-0 text-accent" />
            <label for="cta-search-input" class="sr-only"> Décrivez votre situation </label>
            <input
              id="cta-search-input"
              v-model="ctaSearch"
              type="text"
              class="h-auto flex-1 border-0 bg-transparent px-0 text-small md:text-body text-ink placeholder:text-ink-subtle focus:outline-none"
              placeholder="Ex. : Nous devons renouveler 12 habilitations sur deux sites avant décembre."
            />
            <button
              type="submit"
              aria-label="Lancer la recherche"
              class="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary text-paper transition-colors hover:bg-primary-dark"
            >
              <IconSearch :size="18" class="text-paper" />
            </button>
          </div>
          <p class="mt-3 text-center text-xs md:text-small text-ink-inverse/70">
            Vous pouvez écrire comme vous le feriez à un conseiller.
          </p>
        </form>

        <div class="mt-lg flex justify-center">
          <Button as-child variant="outline-inverse" size="pill-lg">
            <NuxtLink to="/parler-a-votre-conseiller" class="w-full sm:w-auto"
              >Parler à votre conseiller</NuxtLink
            >
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, resolveComponent } from 'vue'
import type { Article, Centre } from '@learnup/types'
import { mapCourse, upcomingSessions, useCatalog } from '~/composables/useCatalog'
import { availabilityStatus, useCentreSessionDates } from '~/composables/useCentres'
import { useGeolocation } from '~/composables/useGeolocation'
import { useGeoSuggest } from '~/composables/useGeoSuggest'
import { distanceKm, formatDistance } from '~/utils/geo'
import { revealStagger } from '~/utils/reveal'
import { articleAssetUrl, formatArticleDate } from '~/utils/article'
import { placesLabel } from '~/utils/placesLabel'
import type { CenterResult } from '~/types/center-result'

const config = useRuntimeConfig()

function assetUrl(id: string | null): string | null {
  return articleAssetUrl(id, config.public.apiBase)
}

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

const heroSearch = ref('')

function onHeroSearch() {
  const q = heroSearch.value.trim()
  navigateTo({ path: '/formations', query: q ? { q } : {} })
}

const ctaSearch = ref('')

function onCtaSearch() {
  const q = ctaSearch.value.trim()
  navigateTo({ path: '/formations', query: q ? { q } : {} })
}

const mapSearch = ref('')

const geoSuggest = useGeoSuggest()
const mapSearchSuggestions = computed(() => geoSuggest.suggestions.value.map((s) => s.label))

function onMapSearchInput(value: string) {
  geoSuggest.request(value)
}

// Barre de stats (ticker) — fond primary-dark sous le hero
const tickerItems = [
  {
    key: 'sessions',
    icon: resolveComponent('IconCalendar'),
    value: '312',
    label: 'sessions ouvertes'
  },
  {
    key: 'places',
    icon: resolveComponent('IconTimetable'),
    value: '1 480',
    label: 'places disponibles'
  },
  {
    key: 'reseau',
    icon: resolveComponent('IconMapPin'),
    value: 'Réseau national',
    label: 'des centres partout en France'
  },
  {
    key: 'live',
    icon: resolveComponent('IconRefresh'),
    value: 'Données actualisées',
    label: 'en continu'
  }
]

// ── Données statiques ───────────────────────────────────────────────────────

const networkCards = [
  {
    title: 'Devenir franchisé',
    subtitle: "Ouvrez votre centre avec l'appui du réseau",
    to: '/centres/demande-de-formation?sujet=franchise'
  },
  {
    title: 'Organisme partenaire',
    subtitle: 'Référencez vos centres et vos sessions',
    to: '/referencer-mon-organisme'
  },
  {
    title: 'Formateur indépendant',
    subtitle: 'Intervenez sur les sessions du réseau',
    to: '/centres/demande-de-formation?sujet=formateur'
  }
]

const enterpriseBenefits = ['Interlocuteur unique', 'Gestion multi-sites', 'Suivi centralisé']

// Section "Pourquoi" — icons auto-importés via resolveComponent
const benefits = [
  {
    icon: resolveComponent('IconMessageCircle'),
    title: 'Conseil personnalisé',
    body: 'Un besoin exprimé avec vos mots, une réponse qualifiée.'
  },
  {
    icon: resolveComponent('IconUser'),
    title: 'Interlocuteur unique',
    body: "Un seul contact, de la demande jusqu'aux attestations."
  },
  {
    icon: resolveComponent('IconMapPin'),
    title: 'Proximité',
    body: 'Des centres au plus près de vos équipes.'
  },
  {
    icon: resolveComponent('IconZap'),
    title: 'Réactivité',
    body: 'Des sessions identifiées rapidement, même en urgence.'
  },
  {
    icon: resolveComponent('IconGlobe'),
    title: 'Couverture nationale',
    body: "Une présence sur l'ensemble du territoire."
  },
  {
    icon: resolveComponent('IconGrid'),
    title: 'Centralisation',
    body: 'Demandes, documents et suivi regroupés au même endroit.'
  }
]

const stats = [
  { value: '+250', unit: '', label: 'formations référencées' },
  { value: '+400', unit: '', label: 'centres partenaires' },
  { value: '+10 000', unit: '', label: 'apprenants par an' },
  { value: '4,7', unit: '/5', label: 'satisfaction stagiaires' }
]

const testimonials = [
  {
    stars: '★★★★★',
    quote:
      '« Douze habilitations à renouveler sur trois sites, une seule interlocutrice, tout était planifié en une semaine. »',
    author: 'Responsable QHSE — logistique, 240 salariés'
  },
  {
    stars: '★★★★★',
    quote: '« Je ne savais pas quel CACES demander. La description libre a suffi. »',
    author: "Directeur d'agence — intérim"
  },
  {
    stars: '★★★★☆',
    quote: '« Plan déployé sur nos quatre dépôts sans une seule relance de notre part. »',
    author: 'Responsable formation — BTP'
  }
]

// ── Catalogue (API) ─────────────────────────────────────────────────────────

// On charge 20 formations pour en extraire à la fois les 4 dernières et
// les prochaines sessions à afficher en page d'accueil.
const { data: catalogue } = await useCatalog({ limit: 20, sort: 'updatedAt', order: 'desc' })

const dernieresFormations = computed(() =>
  (catalogue.value?.items ?? []).slice(0, 4).map((c) => mapCourse(c))
)

// ── Sessions à venir ────────────────────────────────────────────────────────

const sessionDateFmt = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC'
})

interface SessionListItem {
  id: string
  day: string
  month: string
  title: string
  meta: string
  to: string | null
  places?: number
  type?: 'success' | 'warning' | 'neutral'
  price?: string
}

const upcomingSessionList = computed<SessionListItem[]>(() => {
  const items = catalogue.value?.items ?? []
  const result: SessionListItem[] = []

  for (const course of items) {
    const sessions = upcomingSessions(course)
      .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
      .slice(0, 1)

    for (const s of sessions) {
      if (!s.startDate) continue
      const date = new Date(`${s.startDate}T00:00:00Z`)
      const parts = sessionDateFmt.formatToParts(date)
      const day = parts.find((p) => p.type === 'day')?.value ?? ''
      const month = parts.find((p) => p.type === 'month')?.value ?? ''

      const mapped = mapCourse(course)
      const seats = s.seatsRemaining
      const type: 'success' | 'warning' | 'neutral' =
        seats != null && seats <= 3 ? 'warning' : 'success'

      result.push({
        id: `${course.slug}-${s.startDate}`,
        day,
        month,
        title: course.title,
        meta: mapped.meta ?? '',
        to: mapped.to,
        places: seats ?? undefined,
        type,
        price: ''
      })
    }

    if (result.length >= 4) break
  }

  return result
})

const exampleUpcomingSessions = [
  {
    id: 'caces-r489-cat-3',
    day: '22',
    month: 'SEPT.',
    title: 'CACES® R489 cat. 3',
    location: 'Centre de Créteil · à 6 km',
    badgeText: '4 places disponibles',
    badgeVariant: 'success' as const,
    to: '/formations'
  },
  {
    id: 'habilitation-electrique-bs-be',
    day: '28',
    month: 'SEPT.',
    title: 'Habilitation électrique BS-BE',
    location: 'Centre de Créteil · à 6 km',
    badgeText: 'Dernières places',
    badgeVariant: 'warning' as const,
    to: '/formations'
  },
  {
    id: 'travail-en-hauteur',
    day: '05',
    month: 'OCT.',
    title: 'Travail en hauteur — port du harnais',
    location: 'Villeneuve-le-Roi · à 14 km',
    badgeText: '6 places disponibles',
    badgeVariant: 'success' as const,
    to: '/formations'
  }
]

const displayUpcomingSessions = computed(() => {
  if (upcomingSessionList.value.length >= 3) {
    return upcomingSessionList.value.slice(0, 3).map((s) => ({
      id: s.id,
      day: s.day,
      month: s.month.endsWith('.')
        ? s.month.toUpperCase()
        : `${s.month.slice(0, 4).toUpperCase()}.`,
      title: s.title,
      location: s.meta || 'Centre partenaire',
      badgeText: s.places != null ? placesLabel(s.places, true) : 'Places disponibles',
      badgeVariant: s.type === 'warning' ? ('warning' as const) : ('success' as const),
      to: s.to ?? '/formations'
    }))
  }
  return exampleUpcomingSessions
})

// ── Centres ─────────────────────────────────────────────────────────────────

// 2 derniers centres publiés (Directus) — colonne droite de la section réseau.
const derniersCentresData = await useDirectusList<Centre>('centres', 'home-centres', {
  fields: [
    'slug',
    'name',
    'address',
    'postal_code',
    'city',
    'department',
    'region',
    'specialties',
    'latitude',
    'longitude'
  ],
  filter: { status: { _eq: 'published' } },
  sort: ['-id'],
  limit: -1
})

// Position partagée : activée via le badge « Près de moi » (ici ou sur
// /centres), jamais automatiquement.
const { position: userPosition } = useGeolocation()

// Centres « à proximité » : triés par distance quand la position est connue,
// sinon les deux plus récents (ordre Directus).
const derniersCentres = computed(() => {
  const list = [...(derniersCentresData.value ?? [])]
  const pos = userPosition.value
  if (!pos) return list.slice(0, 2)
  return list.sort((a, b) => distanceToUser(a, pos) - distanceToUser(b, pos)).slice(0, 2)
})

function distanceToUser(centre: Centre, pos: { lat: number; lng: number }): number {
  if (centre.latitude == null || centre.longitude == null) return Infinity
  return distanceKm(pos, { lat: centre.latitude, lng: centre.longitude })
}

const homeMapCenters = computed<CenterResult[]>(() =>
  (derniersCentresData.value ?? []).map((centre) => {
    const location = [centre.address, centre.postal_code, centre.city, centre.department]
      .filter(Boolean)
      .join(', ')
    const tags = (centre.specialties ?? []).join(' · ')
    return {
      id: centre.slug,
      name: centre.name,
      cp: centre.postal_code ?? '',
      address: location,
      tags,
      tagsShort: tags,
      lat: centre.latitude ?? undefined,
      lng: centre.longitude ?? undefined
    }
  })
)

function centreDistance(centre: Centre): string {
  const pos = userPosition.value
  if (pos && centre.latitude != null && centre.longitude != null) {
    return `à ${formatDistance(distanceKm(pos, { lat: centre.latitude, lng: centre.longitude }))}`
  }
  return [centre.city, centre.department].filter(Boolean).join(' · ')
}

function centreFormations(centre: Centre): string {
  return centre.specialties?.length ? centre.specialties.join(' · ') : 'Catalogue complet'
}

// Sessions à venir du catalogue agrégées par centre → badge de
// disponibilité (même sémantique `availabilityStatus` que la page /centres).
const centreSessionDates = await useCentreSessionDates()

function centreStatus(centre: Centre) {
  return availabilityStatus(centreSessionDates.value.get(centre.slug) ?? [])
}

// Soumission de la recherche réseau : ville/code postal part en query `q`
// (champ de recherche de /centres) — son département de rattachement part
// en `dept` pour présélectionner le filtre territoire ; un département
// choisi dans l'autocomplétion part seul en query `dept`.
function onMapSearch(value: string) {
  const picked = geoSuggest.byLabel(value)
  if (picked?.kind === 'department') {
    navigateTo({ path: '/centres', query: { dept: picked.term } })
    return
  }
  const q = (picked?.term ?? value).trim()
  navigateTo({
    path: '/centres',
    query: {
      ...(q ? { q } : {}),
      ...(picked?.departmentName ? { dept: picked.departmentName } : {})
    }
  })
}

// ── Actualités ──────────────────────────────────────────────────────────────

const homeArticlesData = await useDirectusList<Article>('articles', 'home-actualites-list', {
  fields: ['id', 'status', 'slug', 'title', 'excerpt', 'category', 'publish_at', 'cover_image'],
  filter: { status: { _eq: 'published' } },
  sort: ['-publish_at'],
  limit: 3
})

const articles = computed(() => (homeArticlesData.value ?? []).slice(0, 3))

const formationTags = ['AIPR', 'CATEC®', 'Amiante SS4', 'PASO', 'SECUFER', 'Gestes & postures']

const techCompanyLogos = [
  {
    name: 'Capgemini',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Capgemini_201x_logo.svg'
  },
  {
    name: 'Microsoft',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg'
  },
  {
    name: 'Google Cloud',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg'
  },
  {
    name: 'Amazon',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'
  },
  {
    name: 'IBM',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg'
  },
  {
    name: 'Oracle',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg'
  },
  {
    name: 'IBM',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg'
  },
  {
    name: 'Oracle',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg'
  }
]
</script>
