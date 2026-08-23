<template>
  <div>
    <div class="mb-7">
      <div
        class="inline-flex px-[10px] py-1 rounded-full bg-primary-soft font-mono text-[9px] font-bold tracking-[0.14em] uppercase text-[var(--primary-text)] mb-[14px]"
      >
        Inscription
      </div>
      <p class="text-[13px] text-ink-muted leading-[1.55] m-0">
        Commencez à organiser vos tâches dès aujourd'hui.
      </p>
    </div>

    <p
      v-if="error"
      role="alert"
      class="px-[14px] py-3 rounded-[10px] bg-[var(--error-soft)] border border-danger/20 text-[13px] text-danger mb-[14px]"
    >
      {{ error }}
    </p>

    <form novalidate @submit.prevent="submit">
      <div class="grid grid-cols-2 gap-3">
        <div class="mb-[14px]">
          <label
            for="firstname"
            class="block font-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-ink-muted mb-2"
          >
            Prénom
          </label>
          <input
            id="firstname"
            v-model="form.firstname"
            type="text"
            autocomplete="given-name"
            required
            :disabled="loading"
            class="tf-input"
          />
        </div>
        <div class="mb-[14px]">
          <label
            for="lastname"
            class="block font-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-ink-muted mb-2"
          >
            Nom
          </label>
          <input
            id="lastname"
            v-model="form.lastname"
            type="text"
            autocomplete="family-name"
            required
            :disabled="loading"
            class="tf-input"
          />
        </div>
      </div>

      <div class="mb-[14px]">
        <label
          for="email"
          class="block font-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-ink-muted mb-2"
        >
          Email
        </label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          inputmode="email"
          autocomplete="email"
          required
          :disabled="loading"
          class="tf-input"
        />
      </div>

      <div class="mb-[14px]">
        <label
          for="confirmEmail"
          class="block font-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-ink-muted mb-2"
        >
          Confirmer l'email
        </label>
        <input
          id="confirmEmail"
          v-model="form.confirmEmail"
          type="email"
          inputmode="email"
          autocomplete="email"
          required
          :disabled="loading"
          class="tf-input"
        />
      </div>

      <div class="mb-[14px]">
        <label
          for="password"
          class="block font-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-ink-muted mb-2"
        >
          Mot de passe
        </label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          required
          minlength="8"
          :disabled="loading"
          class="tf-input"
        />
      </div>

      <div class="mb-[14px]">
        <label
          for="confirmPassword"
          class="block font-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-ink-muted mb-2"
        >
          Confirmer le mot de passe
        </label>
        <input
          id="confirmPassword"
          v-model="form.confirmPassword"
          type="password"
          autocomplete="new-password"
          required
          :disabled="loading"
          class="tf-input"
        />
      </div>

      <button type="submit" class="tf-btn" :disabled="loading">
        {{ loading ? 'Inscription…' : "S'inscrire" }}
      </button>
    </form>

    <p class="mt-6 pt-5 border-t border-[var(--rule)] text-center text-[13px] text-ink-muted">
      Déjà un compte ?
      <NuxtLink
        to="/login"
        class="text-[var(--primary-text)] font-semibold no-underline ml-1 hover:underline"
      >
        Se connecter →
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useAuthSubmit } from '~/composables/useAuthSubmit'
import { reactive } from 'vue'
definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const { error, loading, handleSubmit } = useAuthSubmit('Une erreur est survenue')
const form = reactive({
  firstname: '',
  lastname: '',
  email: '',
  confirmEmail: '',
  password: '',
  confirmPassword: ''
})

function submit() {
  handleSubmit(async () => {
    await auth.register(form)
    await navigateTo('/login')
  })
}
</script>
