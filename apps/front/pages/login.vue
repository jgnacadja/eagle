<template>
  <div>
    <div class="mb-8">
      <div
        class="inline-flex px-[10px] py-1 rounded-full bg-primary-soft font-mono text-[9px] font-bold tracking-[0.14em] uppercase text-[var(--primary-text)] mb-[14px]"
      >
        Connexion
      </div>
      <p class="text-[13px] text-ink-muted leading-[1.55] m-0">Connectez-vous à votre espace</p>
    </div>

    <p
      v-if="error"
      id="alert-auth"
      role="alert"
      class="px-[14px] py-3 rounded-[10px] bg-[var(--error-soft)] border border-danger/20 text-[13px] text-danger mb-[14px]"
    >
      {{ error }}
    </p>

    <form novalidate @submit.prevent="submit">
      <div class="mb-4">
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

      <div class="mb-4">
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
          autocomplete="current-password"
          required
          :disabled="loading"
          class="tf-input"
        />
      </div>

      <button type="submit" class="tf-btn" :disabled="loading">
        {{ loading ? 'Connexion…' : 'Se connecter' }}
      </button>
    </form>

    <p class="mt-6 pt-5 border-t border-[var(--rule)] text-center text-[13px] text-ink-muted">
      Pas encore de compte ?
      <NuxtLink
        to="/register"
        class="text-[var(--primary-text)] font-semibold no-underline ml-1 hover:underline"
      >
        S'inscrire →
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
const { error, loading, handleSubmit } = useAuthSubmit('Identifiants invalides')
const form = reactive({ email: '', password: '' })

function submit() {
  handleSubmit(async () => {
    await auth.login(form)
    await navigateTo('/')
  })
}
</script>
