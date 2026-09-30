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
        class="pointer-events-none absolute right-6 top-8 hidden lg:block xl:right-3 xl:top-12 -rotate-3 z-10"
      >
        <div
          v-reveal-media
          class="rounded-2xl border border-rule/50 bg-paper px-6 py-4 shadow-md text-left"
        >
          <p class="font-display text-lead font-bold italic leading-snug text-ink">
            Elargissez vos compétences<br />
            aujourd'hui pour les défis de demain
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
            v-hero="heroStagger(0)"
            class="inline-block rounded-full border border-primary/25 bg-paper px-4 py-1.5 text-xs md:text-small font-bold uppercase tracking-wider text-primary shadow-xs"
            >Réseau national d'organismes de formation et plateforme de conseil
          </span>

          <!-- H1 -->
          <h1
            v-hero="heroStagger(1)"
            class="mt-4 md:mt-5 font-display text-h2 md:text-h1 font-extrabold leading-tight text-ink"
          >
            Vos besoins de formation,<br />
            <span class="text-accent-text">orchestrés</span> de bout en bout.
          </h1>

          <!-- Subtitle -->
          <p
            v-hero="heroStagger(2)"
            class="mt-3 md:mt-4 font-sans text-body md:text-lead font-bold text-ink"
          >
            La bonne formation. Au bon endroit. Au bon moment.
            <span class="text-accent-text">Partout en France.</span>
          </p>

          <!-- Prompt -->
          <div v-hero="heroStagger(3)" class="mt-6 md:mt-8">
            <h2 class="font-display text-h4 md:text-h3 font-extrabold text-ink">
              Besoin d'aide pour choisir votre formation&nbsp;?
            </h2>
            <p class="mx-auto mt-2 text-small md:text-sm text-ink-muted max-w-prose">
              Décrivez votre besoin ou posez votre question. Nous vous guidons vers la solution
              adaptée.
            </p>
          </div>

          <!-- Search bar -->
          <form
            v-hero="heroStagger(4)"
            class="mx-auto mt-6 w-full max-w-prose"
            @submit.prevent="onHeroSearch"
          >
            <SearchInput
              v-model="heroSearch"
              input-id="hero-search-input"
              sr-label="Besoin d'aide pour choisir votre formation"
              placeholder="Ex. : Je dois former 8 salariés au CACES près de Lyon avant septembre."
              @submit="onHeroSearch"
            >
              <template #icon>
                <IconSparkle :size="20" class="shrink-0 text-accent" />
              </template>
            </SearchInput>
            <p
              class="mt-3 text-xs md:text-small text-ink-muted whitespace-normal md:whitespace-nowrap"
            >
              Vous pouvez écrire comme vous le feriez à votre conseiller.
            </p>
          </form>

          <!-- 3 Value propositions -->
          <div
            v-hero="heroStagger(5)"
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
          <div v-hero="heroStagger(6)" class="mt-5">
            <NuxtLink
              to="/parler-a-votre-conseiller"
              class="inline-block text-small md:text-body font-bold text-accent-text underline underline-offset-4 transition-colors hover:text-primary"
            >
              Besoin d'être accompagné&nbsp;? Parler à votre conseiller
              <span class="link-arrow">→</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Floating badge mobile -->
        <div class="my-6 flex justify-center -rotate-3 lg:hidden">
          <div
            v-reveal-media
            class="rounded-xl border border-rule/60 bg-paper px-5 py-3 shadow-md text-left"
          >
            <p class="font-display text-sm font-extrabold italic leading-snug text-ink">
              Elargissez vos compétences aujourd'hui<br />
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
              class="flex items-center gap-3.5 rounded-xl border border-warning/40 bg-accent/10 p-4 text-left shadow-xs transition-shadow hover:shadow-sm"
            >
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning"
              >
                <IconRibbon :size="24" />
              </div>
              <div>
                <p class="text-small font-bold text-ink">Certifié Qualiopi</p>
                <a
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
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         TICKER — barre de chiffres clés
    ════════════════════════════════════════════════════ -->
    <div class="bg-primary-dark">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <div class="grid grid-cols-2 gap-px py-sm md:grid-cols-3 md:divide-x md:divide-rule-strong">
          <div
            v-for="item in tickerItems"
            :key="item.key"
            class="flex items-center justify-center gap-3 py-md"
          >
            <!-- icône -->
            <component :is="item.icon" :size="22" class="shrink-0 text-ink-inverse/50" />
            <div>
              <p
                class="font-display text-h4 font-extrabold leading-none text-ink-inverse md:text-h3"
              >
                {{ item.value }}
              </p>
              <p class="mt-xs text-xs leading-tight text-ink-inverse-muted md:text-small">
                {{ item.label }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════
         ILS NOUS FONT CONFIANCE — logos clients
    ════════════════════════════════════════════════════ -->
    <section class="border-b border-rule bg-paper py-lg">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <ClientLogoWall variant="marquee" :logos="homeLogos" />
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         2. FORMATIONS
    ════════════════════════════════════════════════════ -->
    <section id="formations" class="bg-surface py-section">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <div class="flex items-end justify-between">
          <div>
            <h2 v-reveal-soft class="font-display text-xl md:text-h2 font-extrabold text-ink">
              Les formations réglementaires adaptées à vos métiers
            </h2>
            <p class="mt-sm font-sans text-sm md:text-body text-ink-muted">
              CACES®, AIPR, habilitations électriques, SST, CATEC®, travail en hauteur, amiante SS4…
            </p>
          </div>
        </div>

        <div
          v-if="dernieresFormations.length"
          class="mt-2xl grid gap-grid grid-cols-2 lg:grid-cols-4"
        >
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
        <div v-else class="mt-2xl rounded-xl border border-dashed border-rule p-xl text-center">
          <p class="text-small text-ink-muted">
            Aucune formation trouvée pour
            <strong class="text-ink">« {{ selectedTag }} »</strong>.
          </p>
        </div>

        <div class="mt-lg flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-wrap items-center gap-sm">
            <Badge
              v-for="tag in formationTags"
              :key="tag"
              as="button"
              type="button"
              :variant="selectedTag === tag ? 'default' : 'outline'"
              :class="[
                'cursor-pointer font-medium transition-colors select-none',
                selectedTag === tag
                  ? 'border-primary bg-primary text-ink-inverse'
                  : 'hover:border-primary hover:text-primary'
              ]"
              :aria-pressed="selectedTag === tag"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </Badge>

            <button
              v-if="selectedTag"
              type="button"
              class="text-xs text-ink-muted underline hover:text-primary cursor-pointer ml-1"
              @click="selectedTag = null"
            >
              Effacer le filtre
            </button>
          </div>
        </div>

        <div class="flex items-center justify-center mt-xl">
          <Button as-child size="pill-lg" class="lg:inline-flex gap-xs">
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
          <h2 v-reveal-soft class="font-display text-xl md:text-h2 font-extrabold text-ink">
            Trouvez le centre de formation le plus proche de chez vous
          </h2>
          <p class="mt-sm max-w-prose font-sans text-sm text-ink-muted">
            <span class="font-bold text-primary">+400 centres partenaires</span>
            — en centre, sur votre site ou en intra-entreprise.
          </p>
        </div>
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
            class="flex h-full items-center justify-center px-md text-center text-small text-ink-muted"
          >
            La carte des centres est temporairement indisponible.
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
    <section id="confier" class="bg-primary-muted py-9.75 text-ink-inverse">
      <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter">
        <div class="grid grid-cols-1 items-center gap-lg md:grid-cols-2 md:gap-xl lg:gap-2xl">
          <!-- Colonne gauche : Contenu & CTA -->
          <div v-reveal class="flex flex-col items-start">
            <p class="text-overline font-extrabold uppercase tracking-wider text-accent">
              ENTREPRISES
            </p>

            <h2 class="mt-xs font-display text-h3 md:text-h2 font-extrabold text-ink-inverse">
              Simplifiez la gestion de vos formations
            </h2>

            <p class="mt-sm max-w-prose text-small md:text-body text-ink-inverse-muted">
              Un interlocuteur unique pour accompagner vos besoins de formation, partout en France.
            </p>

            <!-- Checklist bénéfices -->
            <ul class="mt-md flex flex-wrap items-center gap-x-md gap-y-xs sm:gap-x-lg">
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
            <div class="mt-lg flex w-full flex-col gap-sm sm:w-auto sm:flex-row sm:items-center">
              <Button as-child variant="accent" size="pill" class="w-full sm:w-auto">
                <NuxtLink to="/centres/demande-de-formation">
                  Découvrir nos solutions entreprises <span class="link-arrow">→</span>
                </NuxtLink>
              </Button>
              <Button as-child variant="outline-inverse" size="pill" class="w-full sm:w-auto">
                <NuxtLink to="/parler-a-votre-conseiller">Parler à votre conseiller</NuxtLink>
              </Button>
            </div>
          </div>

          <!-- Colonne droite : Visuel formation entreprise -->
          <div v-reveal class="hidden md:flex justify-end items-center">
            <img
              src="/images/formation2.webp"
              alt="Responsable formation en entreprise"
              class="h-56 sm:h-64 md:h-72 lg:h-76 w-full rounded-xl object-cover shadow-md"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         5. PROCHAINES SESSIONS
    ════════════════════════════════════════════════════ -->
    <section
      v-if="displayUpcomingSessions.length"
      id="sessions"
      class="mx-auto px-gutter-mobile md:px-gutter py-section"
    >
      <div>
        <h2 v-reveal-soft class="font-display text-xl md:text-h2 font-extrabold text-ink">
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
              class="mt-xs text-overline font-extrabold uppercase tracking-wider text-accent-text"
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
              :class="[
                'mt-xs inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                session.badgeVariant === 'warning'
                  ? 'bg-warning-soft text-warning'
                  : session.badgeVariant === 'neutral'
                    ? 'bg-surface-alt text-ink-muted'
                    : 'bg-success-soft text-success'
              ]"
            >
              {{ session.badgeText }}
            </span>
          </div>
        </NuxtLink>
      </div>

      <div class="mt-xl flex justify-center">
        <Button as-child variant="outline" size="pill-lg" class="lg:inline-flex gap-xs">
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
        <h2 v-reveal-soft class="font-display text-xl md:text-h2 font-extrabold text-ink">
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
    <section v-if="testimonials.length" class="border-b border-rule bg-paper py-section">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <h2 v-reveal-soft class="font-display text-xl md:text-h2 font-extrabold text-ink">
          Les clients parlent de nous
        </h2>

        <!-- Bandeau Stats avec séparateurs -->
        <div
          class="mt-xl grid grid-cols-2 gap-y-lg border-y border-rule py-lg md:gap-y-xl md:py-xl lg:grid-cols-4"
        >
          <StatItem
            v-for="stat in stats"
            :key="stat.label"
            :value="stat.value"
            :unit="stat.unit"
            :label="stat.label"
            class="border-r border-rule even:border-r-0 lg:even:border-r lg:last:border-r-0! odd:pr-md even:pl-md md:odd:pr-lg md:even:pl-lg lg:px-lg lg:first:pl-0 lg:last:pr-0"
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

        <!-- Pied de section : Témoignages & CTA -->
        <div class="mt-xl flex flex-col gap-lg sm:flex-row sm:items-center sm:justify-between">
          <div class="shrink-0">
            <Button as-child variant="outline" size="pill-lg" class="lg:inline-flex gap-xs">
              <NuxtLink to="/formations"> Consulter <span class="link-arrow">→</span></NuxtLink>
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
        <h2
          v-reveal-soft
          class="text-center font-display text-xl md:text-h2 font-extrabold text-ink"
        >
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
    <section
      v-if="articles.length"
      id="actualites"
      class="mx-auto px-gutter-mobile md:px-gutter py-section"
    >
      <div>
        <h2 v-reveal-soft class="font-display text-xl md:text-h2 font-extrabold text-ink">
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
        <Button as-child variant="outline" size="pill-lg" class="lg:inline-flex gap-xs">
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
          v-reveal-soft
          class="mx-auto text-center font-display text-xl md:text-h2 font-extrabold leading-tight text-ink-inverse"
        >
          Un besoin de formation ? Décrivez-nous votre situation.
        </h2>

        <form class="mx-auto mt-lg w-full max-w-prose" @submit.prevent="onCtaSearch">
          <SearchInput
            v-model="ctaSearch"
            input-id="cta-search-input"
            sr-label="Décrivez votre situation"
            placeholder="Ex. : Nous devons renouveler 12 habilitations sur deux sites avant décembre."
            @submit="onCtaSearch"
          >
            <template #icon>
              <IconSparkle :size="20" class="shrink-0 text-accent" />
            </template>
          </SearchInput>
          <p class="mt-3 text-center text-xs md:text-small text-ink-inverse-muted">
            Vous pouvez écrire comme vous le feriez à votre conseiller.
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
import type { Article, Avis, Centre } from '@learnup/types'
import { mapCourse, upcomingSessions, useCatalog } from '~/composables/useCatalog'
import { useTagFilter } from '~/composables/useTagFilter'
import { availabilityStatus, useCentreSessionDates } from '~/composables/useCentres'
import { useGeolocation } from '~/composables/useGeolocation'
import { useGeoSuggest } from '~/composables/useGeoSuggest'
import { distanceKm, formatDistance } from '~/utils/geo'
import { useAssistantLauncher } from '~/composables/useAssistantLauncher'
import { heroStagger, revealStagger } from '~/utils/reveal'
import { articleAssetUrl, formatArticleDate } from '~/utils/article'
import { mapAvis } from '~/utils/avis'
import { placesLabel, sessionSeatType } from '~/utils/placesLabel'
import type { CenterResult } from '~/types/center-result'
import { homeLogos } from '~/data/companies'

const config = useRuntimeConfig()

function assetUrl(id: string | null): string | null {
  return articleAssetUrl(id, config.public.apiBase)
}

const siteUrl = config.public.siteUrl

useContentSeo(
  {
    seo_title: 'LEARN UP ACADEMY — Plateforme de conseil en formation professionnelle',
    seo_description:
      'Trouvez et organisez la formation réglementaire adaptée à vos équipes. +400 centres partenaires, CACES, habilitations électriques, secours, incendie.'
  },
  'LEARN UP ACADEMY',
  {
    // Données structurées site-wide. `sameAs` omis : aucune URL de profil
    // officiel n'est versionnée — à ajouter quand elles seront confirmées.
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: 'LEARN UP ACADEMY',
          url: siteUrl,
          potentialAction: {
            '@type': 'SearchAction',
            // Le catalogue filtre sur ?q= (searchQuery) — pas ?search=.
            target: `${siteUrl}/formations?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        },
        {
          '@type': 'Organization',
          name: 'LEARN UP ACADEMY',
          url: siteUrl,
          description: 'Plateforme de conseil en formation professionnelle réglementaire.',
          logo: `${siteUrl}/images/learn-up-academy.svg`,
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            email: 'contact@learnup.fr',
            availableLanguage: 'French'
          }
        }
      ]
    }
  }
)

const heroSearch = ref('')
const assistant = useAssistantLauncher()

// C1 — point d'entrée principal : le besoin saisi ouvre le panneau de
// recherche assistée et est envoyé comme premier message.
function onHeroSearch() {
  const q = heroSearch.value.trim()
  assistant.open({ context: { source: 'home' }, message: q || undefined })
  heroSearch.value = ''
}

const ctaSearch = ref('')

// C1 — même point d'entrée que le hero : le besoin saisi ouvre le panneau de
// recherche assistée (pas de redirection vers le catalogue).
function onCtaSearch() {
  const q = ctaSearch.value.trim()
  assistant.open({ context: { source: 'home' }, message: q || undefined })
  ctaSearch.value = ''
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

const homeAvisData = await useDirectusList<Avis>('avis', 'home-avis', {
  fields: ['slug', 'author', 'quote', 'stars', 'published_at'],
  filter: {
    status: { _eq: 'published' },
    centre: { _null: true }
  },
  sort: ['sort', '-published_at'],
  limit: 3
})

const testimonials = computed(() => (homeAvisData.value ?? []).map(mapAvis))

// ── Catalogue (API) ─────────────────────────────────────────────────────────

// On charge jusqu'à 50 formations pour en extraire à la fois les 4 dernières
// (ou filtrées par tag) et les prochaines sessions à afficher en page d'accueil.
const { data: catalogue } = await useCatalog({ limit: 50, sort: 'updatedAt', order: 'desc' })

const { selectedTag, apiTagResults, formationTags, toggleTag, matchesTag } = useTagFilter(
  () => catalogue.value?.items
)

const dernieresFormations = computed(() => {
  const all = catalogue.value?.items ?? []
  if (selectedTag.value) {
    const tag = selectedTag.value
    const fromApi = apiTagResults.value[tag]
    if (fromApi?.length) {
      return fromApi.slice(0, 4).map((c) => mapCourse(c))
    }
    const filtered = all.filter((c) => matchesTag(c, tag))
    return filtered.slice(0, 4).map((c) => mapCourse(c))
  }
  return all.slice(0, 4).map((c) => mapCourse(c))
})

// ── Sessions à venir ────────────────────────────────────────────────────────

const MONTH_ABBR_FR: Record<number, string> = {
  0: 'JANV.',
  1: 'FÉVR.',
  2: 'MARS',
  3: 'AVR.',
  4: 'MAI',
  5: 'JUIN',
  6: 'JUIL.',
  7: 'AOÛT',
  8: 'SEPT.',
  9: 'OCT.',
  10: 'NOV.',
  11: 'DÉC.'
}

const displayUpcomingSessions = computed(() => {
  const items = catalogue.value?.items ?? []

  const candidates: {
    course: (typeof items)[0]
    session: NonNullable<ReturnType<typeof upcomingSessions>[0]>
  }[] = []

  for (const course of items) {
    for (const s of upcomingSessions(course)) {
      if (s.startDate) {
        candidates.push({ course, session: s })
      }
    }
  }

  candidates.sort((a, b) => a.session.startDate!.localeCompare(b.session.startDate!))

  const seenCourses = new Set<string>()
  const result: {
    id: string
    day: string
    month: string
    title: string
    location: string
    badgeText: string
    badgeVariant: 'success' | 'warning' | 'neutral'
    to: string
  }[] = []

  for (const { course, session: s } of candidates) {
    if (seenCourses.has(course.slug)) continue
    seenCourses.add(course.slug)

    const date = new Date(`${s.startDate}T00:00:00Z`)
    const day = String(date.getUTCDate()).padStart(2, '0')
    const month = MONTH_ABBR_FR[date.getUTCMonth()]!
    const mapped = mapCourse(course)
    const seats = s.seatsRemaining
    const badgeVariant = sessionSeatType(seats ?? undefined) ?? 'success'
    const badgeText = seats != null ? placesLabel(seats, true) : 'Places disponibles'

    result.push({
      id: `${course.slug}-${s.startDate}`,
      day,
      month,
      title: course.title,
      location: mapped.meta || 'Centre partenaire',
      badgeText,
      badgeVariant,
      to: mapped.to ?? '/formations'
    })

    if (result.length >= 3) break
  }

  return result
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
  limit: 100
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
</script>
