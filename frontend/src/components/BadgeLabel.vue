<script setup lang="ts">
// Állapotjelző címke: a színt mindig szöveg is kíséri (a pont dekoratív), így nem csak színnel jelez.
withDefaults(
  defineProps<{
    variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
    dot?: boolean
  }>(),
  { variant: 'neutral', dot: false },
)
</script>

<template>
  <span class="badge" :class="`badge--${variant}`">
    <span v-if="dot" class="badge__dot" aria-hidden="true"></span>
    <slot />
  </span>
</template>

<style scoped>
.badge {
  --badge-color: var(--color-muted);

  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0.125rem var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-normal);
  color: var(--badge-color);
  white-space: nowrap;
  background: color-mix(in srgb, var(--badge-color) 12%, var(--color-surface));
  border-radius: var(--radius-full);
}

.badge--info {
  --badge-color: var(--color-primary);
}

.badge--success {
  --badge-color: var(--color-success);
}

.badge--warning {
  --badge-color: var(--color-warning);
}

.badge--danger {
  --badge-color: var(--color-danger);
}

.badge__dot {
  width: 0.4375rem;
  height: 0.4375rem;
  background: currentcolor;
  border-radius: 50%;
}
</style>
