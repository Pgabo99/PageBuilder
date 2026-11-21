<script setup lang="ts">
import { ref, watch } from 'vue'

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
      <h2 id="confirm-title">{{ pending.title }}</h2>
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.dialog::backdrop {
  background: rgb(0 0 0 / 0.5);
}

h2 {
  margin: 0 0 var(--space-3);
  font-size: 1.125rem;
}

p {
  margin: 0 0 var(--space-6);
}

.dialog__actions {
  justify-content: flex-end;
}
</style>
