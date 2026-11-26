<script setup lang="ts">
import { computed, toRef } from 'vue'

import { useDelayedFlag } from '@/composables/useDelayedFlag'

// Közös betöltésjelző. A szöveges állapot (`role="status"`) azonnal jelen van a képernyőolvasónak,
// a vizuális pörgő jelző csak rövid késleltetés után jelenik meg (nincs villogás), és megjelenés után
// legalább rövid ideig látszik. A `button` méret dekoratív: a gomb saját szövege közli az állapotot.
const props = withDefaults(
  defineProps<{
    loading: boolean
    size?: 'inline' | 'button' | 'page'
    label?: string
  }>(),
  { size: 'inline', label: 'Betöltés…' },
)

const visible = useDelayedFlag(toRef(props, 'loading'))
const decorative = computed(() => props.size === 'button')
</script>

<template>
  <span v-if="decorative && (loading || visible)" class="loader loader--button" aria-hidden="true">
    <Transition name="loader">
      <span v-if="visible" class="loader__spinner" />
    </Transition>
  </span>
  <div v-else-if="loading" class="loader" :class="`loader--${size}`" role="status">
    <Transition name="loader">
      <span v-if="visible" class="loader__spinner" aria-hidden="true" />
    </Transition>
    <span :class="visible ? 'muted' : 'sr-only'">{{ label }}</span>
  </div>
</template>

<style scoped>
.loader {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.loader--page {
  justify-content: center;
  padding: var(--space-8) 0;
}

.loader--button {
  display: inline-flex;
  vertical-align: middle;
}

.loader__spinner {
  flex: none;
  width: var(--icon-md);
  height: var(--icon-md);
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: loader-spin 800ms linear infinite;
}

.loader--page .loader__spinner {
  width: var(--icon-lg);
  height: var(--icon-lg);
}

.loader--button .loader__spinner {
  width: 1em;
  height: 1em;
  margin-right: var(--space-2);
}

.loader-enter-active,
.loader-leave-active {
  transition: opacity var(--motion-normal) var(--ease);
}

.loader-enter-from,
.loader-leave-to {
  opacity: 0;
}

@keyframes loader-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Csökkentett mozgásnál nem pörög: a statikus gyűrű és a szöveg jelzi az állapotot. */
@media (prefers-reduced-motion: reduce) {
  .loader__spinner {
    animation: none;
  }
}
</style>
