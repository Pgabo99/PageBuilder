<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { errorMessage } from '@/api/client'
import AppLoader from '@/components/AppLoader.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import ToastHost from '@/components/ToastHost.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const loggingOut = ref(false)
const logoutError = ref<string | null>(null)

// Az első navigációt a guard az /api/v1/user válaszáig tartja; közben nem maradhat üres az oldal.
const ready = ref(false)
onMounted(() => {
  void router.isReady().finally(() => (ready.value = true))
})

async function logout(): Promise<void> {
  loggingOut.value = true
  logoutError.value = null
  try {
    await auth.logout()
    await router.push({ name: 'login' })
  } catch (error) {
    logoutError.value = errorMessage(error)
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <header class="header">
    <RouterLink to="/" class="header__brand">PageBuilder</RouterLink>
    <div class="header__user">
      <ThemeToggle />
      <template v-if="auth.isAuthenticated">
        <span class="muted">{{ auth.user?.name }}</span>
        <button class="btn btn--secondary" type="button" :disabled="loggingOut" @click="logout">
          Kijelentkezés
        </button>
      </template>
    </div>
  </header>
  <p v-if="logoutError" class="alert" role="alert">{{ logoutError }}</p>
  <main v-if="!ready" class="container">
    <AppLoader loading size="page" />
  </main>
  <RouterView v-else />
  <ConfirmDialog />
  <ToastHost />
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header__brand {
  font-weight: var(--weight-bold);
  color: var(--color-text);
  text-decoration: none;
}

.header__user {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
</style>
