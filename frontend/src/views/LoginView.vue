<script setup lang="ts">
import AppLoader from '@/components/AppLoader.vue'
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import FormField from '@/components/FormField.vue'
import { useForm } from '@/composables/useForm'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { submitting, errors, message, submit } = useForm()

const form = reactive({ email: '', password: '' })

async function onSubmit(): Promise<void> {
  if (await submit(() => auth.login(form))) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  }
}
</script>

<template>
  <main class="card">
    <h1>Bejelentkezés</h1>
    <form class="form" novalidate @submit.prevent="onSubmit">
      <p v-if="message" class="alert" role="alert">{{ message }}</p>
      <FormField
        v-model="form.email"
        label="E-mail-cím"
        type="email"
        autocomplete="email"
        :error="errors.email"
      />
      <FormField
        v-model="form.password"
        label="Jelszó"
        type="password"
        autocomplete="current-password"
        :error="errors.password"
      />
      <button class="btn" type="submit" :disabled="submitting">
        <AppLoader :loading="submitting" size="button" />
        {{ submitting ? 'Bejelentkezés…' : 'Bejelentkezés' }}
      </button>
      <p class="muted">Nincs még fiókod? <RouterLink to="/register">Regisztráció</RouterLink></p>
    </form>
  </main>
</template>
