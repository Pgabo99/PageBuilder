<script setup lang="ts">
import { computed } from 'vue'

import ActionMenu from '@/components/ActionMenu.vue'
import AppIcon from '@/components/AppIcon.vue'
import { useTheme } from '@/composables/useTheme'
import type { User } from '@/types/user'

// Felhasználói menü: név és e-mail-cím, témaváltó, kijelentkezés. Mobilon csak az avatar látszik.
const props = defineProps<{ user: User; loggingOut?: boolean }>()
defineEmits<{ logout: [] }>()

const { theme, toggle } = useTheme()
const dark = computed(() => theme.value === 'dark')

// Az avatar a név első két szavának kezdőbetűje.
const initials = computed(
  () =>
    props.user.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join('') || '?',
)
</script>

<template>
  <ActionMenu label="Felhasználói menü">
    <template #trigger="{ open, toggle: toggleMenu, attrs }">
      <button
        class="user-trigger"
        type="button"
        v-bind="attrs"
        :aria-expanded="open"
        @click="toggleMenu"
      >
        <span class="user-trigger__avatar" aria-hidden="true">{{ initials }}</span>
        <span class="user-trigger__name">{{ user.name }}</span>
        <AppIcon class="user-trigger__chevron" name="chevron-down" kind="ui" />
      </button>
    </template>

    <div class="menu__header">
      <div class="user-menu__name">{{ user.name }}</div>
      <div class="muted user-menu__email">{{ user.email }}</div>
    </div>
    <div class="menu__separator" role="separator"></div>
    <button class="menu__item" type="button" role="menuitem" @click="toggle">
      <AppIcon :name="dark ? 'sun' : 'moon'" kind="ui" />
      {{ dark ? 'Világos téma' : 'Sötét téma' }}
    </button>
    <button
      class="menu__item menu__item--danger"
      type="button"
      role="menuitem"
      :disabled="loggingOut"
      @click="$emit('logout')"
    >
      <AppIcon name="log-out" kind="ui" />
      Kijelentkezés
    </button>
  </ActionMenu>
</template>

<style scoped>
.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 2.25rem;
  padding: 0 var(--space-2) 0 var(--space-1);
  font: inherit;
  font-size: var(--text-sm);
  color: var(--color-text);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background-color var(--motion-fast) var(--ease),
    border-color var(--motion-fast) var(--ease);
}

.user-trigger:hover,
.user-trigger[aria-expanded='true'] {
  background: var(--state-hover);
  border-color: var(--color-border);
}

.user-trigger__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: 50%;
}

.user-trigger__chevron {
  width: var(--icon-sm);
  height: var(--icon-sm);
  color: var(--color-muted);
  transition: transform var(--motion-normal) var(--ease);
}

.user-trigger[aria-expanded='true'] .user-trigger__chevron {
  transform: rotate(180deg);
}

.user-menu__name {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.user-menu__email {
  font-size: var(--text-xs);
  overflow-wrap: anywhere;
}

/* Mobilon csak az avatar látszik: nincs sortörés és nincs túlnyúlás. */
@media (max-width: 40rem) {
  .user-trigger__name {
    display: none;
  }
}
</style>
