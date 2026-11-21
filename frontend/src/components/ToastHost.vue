<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="toasts" aria-live="polite">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="`toast--${toast.kind}`"
      :role="toast.kind === 'error' ? 'alert' : 'status'"
    >
      <span>{{ toast.message }}</span>
      <button
        class="toast__close"
        type="button"
        aria-label="Értesítés bezárása"
        @click="dismiss(toast.id)"
      >
        ✕
      </button>
    </div>
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
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left-width: 4px;
  border-radius: var(--radius);
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
}

.toast--success {
  border-left-color: var(--color-success);
}

.toast--error {
  border-left-color: var(--color-danger);
}

.toast__close {
  padding: 0 var(--space-1);
  font: inherit;
  color: var(--color-muted);
  background: transparent;
  border: 0;
  cursor: pointer;
}
</style>
