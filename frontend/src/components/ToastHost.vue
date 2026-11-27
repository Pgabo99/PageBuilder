<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import IconButton from '@/components/IconButton.vue'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.kind}`"
        :role="toast.kind === 'error' ? 'alert' : 'status'"
      >
        <AppIcon
          class="toast__icon"
          :name="toast.kind === 'error' ? 'alert-circle' : 'check-circle'"
          kind="ui"
        />
        <span class="toast__message">{{ toast.message }}</span>
        <IconButton
          icon="x"
          label="Értesítés bezárása"
          variant="ghost"
          @click="dismiss(toast.id)"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: 100;
  display: grid;
  gap: var(--space-2);
  max-width: min(24rem, calc(100vw - 2 * var(--space-4)));
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
  color: var(--color-text);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-pop);
}

.toast__icon {
  flex: none;
  width: var(--icon-md);
  height: var(--icon-md);
}

.toast--success .toast__icon {
  color: var(--color-success);
}

.toast--error .toast__icon {
  color: var(--color-danger);
}

.toast__message {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--motion-normal) var(--ease),
    transform var(--motion-normal) var(--ease);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
