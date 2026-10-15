<template>
  <div class="flex-1">
    <div class="mx-auto px-gutter-mobile py-section md:px-gutter">
      <Card
        v-if="allowed"
        class="mx-auto flex max-w-3xl flex-col items-center gap-lg p-xl text-center"
      >
        <p
          class="flex h-4xl w-4xl items-center justify-center rounded-full bg-success-soft text-success"
        >
          <IconCheck :size="32" />
        </p>
        <div v-hero>
          <h1 class="font-display text-h2 font-extrabold text-ink lg:text-h1">
            {{ content.title }}
          </h1>
          <p class="mt-sm max-w-prose text-body text-ink-muted">
            {{ content.message }}
          </p>
        </div>
        <div v-if="reference" class="rounded-md border border-rule bg-surface px-xl py-md">
          <p class="text-small font-semibold text-ink">Référence de suivi&nbsp;: {{ reference }}</p>
          <p class="mt-xs text-meta text-ink-subtle">Conservez-la&nbsp;: elle facilite le suivi.</p>
        </div>
        <div class="flex flex-wrap justify-center gap-md">
          <Button as-child variant="dark" size="pill-lg">
            <NuxtLink :to="backTo">{{ backLabel }}</NuxtLink>
          </Button>
          <Button as-child variant="outline" size="pill-lg">
            <NuxtLink to="/formations">Parcourir le catalogue</NuxtLink>
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
// ST-30 — page de confirmation d'une conversion. La conversion n'est
// mesurable que si elle suit un envoi réussi : le formulaire pose un
// drapeau sessionStorage, consommé ici au montage (supprimé — un
// rechargement ou un accès direct repart vers l'accueil, jamais de
// conversion fantôme). Pages noindex/nofollow, hors sitemaps.
import { confirmationFlagKey, type ConfirmationType } from '~/utils/confirmation'

const CONTENT: Record<ConfirmationType, { title: string; message: string }> = {
  devis: {
    title: 'Votre demande est transmise',
    message:
      'Votre conseiller LEARN UP ACADEMY prend en charge votre demande et vous recontacte sous 24 h ouvrées.'
  },
  'rendez-vous': {
    title: 'Demande transmise',
    message: 'Votre conseiller vous recontacte sous 24 h ouvrées aux coordonnées indiquées.'
  },
  inscription: {
    title: 'Inscription confirmée',
    message: 'Vous recevrez nos prochaines actualités et offres de formation par e-mail.'
  },
  candidature: {
    title: 'Candidature transmise',
    message:
      'Votre candidature est bien arrivée — l’équipe réseau l’étudie et vous recontacte rapidement.'
  }
}

const route = useRoute()
const type = route.params.type as ConfirmationType

const content = CONTENT[type]
if (!content) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

// noindex + nofollow : la page ne doit ni s'indexer ni propager de signal.
useHead({
  title: `${content.title} | LEARN UP ACADEMY`,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const reference = ref<string | null>(null)
const backTo = ref('/')
const backLabel = ref("Retour à l'accueil")
const allowed = ref(false)

onMounted(async () => {
  const key = confirmationFlagKey(type)
  const flag = window.sessionStorage.getItem(key)
  if (flag === null) {
    // Accès direct, rechargement ou retour arrière : pas de conversion à
    // mesurer — retour accueil sans historiser la page.
    await navigateTo('/', { replace: true })
    return
  }
  window.sessionStorage.removeItem(key)
  try {
    const context = JSON.parse(flag) as { reference?: string; backTo?: string; backLabel?: string }
    reference.value = context.reference || null
    backTo.value = context.backTo || '/'
    backLabel.value = context.backLabel || "Retour à l'accueil"
  } catch {
    // Drapeau corrompu : la conversion compte quand même, sans contexte.
  }
  allowed.value = true
})
</script>
