<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

import FormField from '@/components/FormField.vue'
import { useForm } from '@/composables/useForm'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const { submitting, errors, message, submit } = useForm()

const form = reactive({ name: '', email: '', password: '', password_confirmation: '' })

async function onSubmit(): Promise<void> {
  if (await submit(() => auth.register(form))) await router.push('/')
}
</script>

<template>
  <main class="card">
    <h1>Regisztráció</h1>
    <form class="form" novalidate @submit.prevent="onSubmit">
      <p v-if="message" class="alert" role="alert">{{ message }}</p>
      <FormField v-model="form.name" label="Név" autocomplete="name" :error="errors.name" />
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
        autocomplete="new-password"
        :error="errors.password"
      />
      <FormField
        v-model="form.password_confirmation"
        label="Jelszó megerősítése"
        type="password"
        autocomplete="new-password"
        :error="errors.password_confirmation"
      />
      <button class="btn" type="submit" :disabled="submitting">
        {{ submitting ? 'Regisztráció…' : 'Regisztráció' }}
      </button>
      <p class="muted">Van már fiókod? <RouterLink to="/login">Bejelentkezés</RouterLink></p>
    </form>
  </main>
</template>
