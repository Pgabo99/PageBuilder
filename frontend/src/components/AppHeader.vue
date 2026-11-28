<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { errorMessage } from '@/api/client'
import AppIcon from '@/components/AppIcon.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import UserMenu from '@/components/UserMenu.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const loggingOut = ref(false)
const logoutError = ref<string | null>(null)

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
    <RouterLink to="/" class="header__brand">
      <span class="header__mark" aria-hidden="true"><AppIcon name="layout" kind="type" /></span>
      PageBuilder
    </RouterLink>
    <nav v-if="auth.isAuthenticated" class="header__nav" aria-label="Fő navigáció">
      <RouterLink to="/" class="header__link" exact-active-class="is-active">Webhelyeim</RouterLink>
    </nav>
    <div class="header__end">
      <UserMenu v-if="auth.user" :user="auth.user" :logging-out="loggingOut" @logout="logout" />
      <ThemeToggle v-else />
    </div>
  </header>
  <p v-if="logoutError" class="alert" role="alert">{{ logoutError }}</p>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-height: var(--header-height);
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--weight-bold);
  letter-spacing: -0.015em;
  color: var(--color-text);
  text-decoration: none;
}

.header__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: var(--radius-md);
}

.header__nav {
  display: flex;
  gap: var(--space-1);
}

.header__link {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-muted);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition:
    background-color var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.header__link:hover {
  color: var(--color-text);
  background: var(--state-hover);
}

.header__link.is-active {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.header__end {
  display: flex;
  align-items: center;
  margin-left: auto;
}
</style>
