<script setup lang="ts">
import { ref, watch } from 'vue'

import AppIcon from '@/components/AppIcon.vue'
import { useConfirm } from '@/composables/useConfirm'

const { pending, answer } = useConfirm()
const dialog = ref<HTMLDialogElement | null>(null)

// A natív <dialog> kezeli a fókuszt, a háttér blokkolását és az Esc-et.
watch(pending, (options) => {
  const element = dialog.value
  if (!element) return
  if (options) {
    if (typeof element.showModal === 'function') element.showModal()
    else element.setAttribute('open', '')
  } else if (element.open) {
    if (typeof element.close === 'function') element.close()
    else element.removeAttribute('open')
  }
})
</script>

<template>
  <dialog
    ref="dialog"
    class="dialog"
    aria-labelledby="confirm-title"
    aria-describedby="confirm-message"
    @cancel.prevent="answer(false)"
  >
    <template v-if="pending">
      <div class="dialog__head">
        <span v-if="pending.danger" class="dialog__icon" aria-hidden="true">
          <AppIcon name="alert-triangle" kind="ui" />
        </span>
        <h2 id="confirm-title">{{ pending.title }}</h2>
      </div>
      <p id="confirm-message">{{ pending.message }}</p>
      <div class="actions dialog__actions">
        <button class="btn btn--secondary" type="button" autofocus @click="answer(false)">
          Mégsem
        </button>
        <button
          class="btn"
          :class="{ 'btn--danger': pending.danger }"
          type="button"
          @click="answer(true)"
        >
          {{ pending.confirmLabel }}
        </button>
      </div>
    </template>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(26rem, calc(100vw - 2 * var(--space-4)));
  padding: var(--space-6);
  color: var(--color-text);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-pop);
  opacity: 0;
  transform: translateY(0.5rem) scale(0.98);
  transition:
    opacity var(--motion-normal) var(--ease),
    transform var(--motion-normal) var(--ease),
    overlay var(--motion-normal) allow-discrete,
    display var(--motion-normal) allow-discrete;
}

.dialog[open] {
  opacity: 1;
  transform: none;
}

.dialog::backdrop {
  background: var(--color-backdrop);
  opacity: 0;
  transition:
    opacity var(--motion-normal) var(--ease),
    overlay var(--motion-normal) allow-discrete,
    display var(--motion-normal) allow-discrete;
}

.dialog[open]::backdrop {
  opacity: 1;
}

/* Belépő animáció a megnyitás pillanatától (ahol a böngésző támogatja; máshol azonnal jelenik meg). */
@starting-style {
  .dialog[open] {
    opacity: 0;
    transform: translateY(0.5rem) scale(0.98);
  }

  .dialog[open]::backdrop {
    opacity: 0;
  }
}

.dialog__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: 0 0 var(--space-3);
}

.dialog__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  color: var(--color-danger);
  background: var(--color-danger-bg);
  border-radius: var(--radius-full);
}

h2 {
  margin: 0;
  font-size: var(--text-lg);
}

p {
  margin: 0 0 var(--space-6);
  color: var(--color-muted);
}

.dialog__actions {
  justify-content: flex-end;
}
</style>
