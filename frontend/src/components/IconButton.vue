<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import AppTooltip from '@/components/AppTooltip.vue'

// Ikongomb: az ikon a szöveges megnevezést nem helyettesíti, ezért a `label` kötelező (aria-label és
// tooltip). A többi attribútum (disabled, click) a gombra kerül, nem a tooltip burkolóra.
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    icon: string
    label: string
    variant?: 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md'
  }>(),
  { variant: 'secondary', size: 'sm' },
)
</script>

<template>
  <AppTooltip :text="label">
    <button
      type="button"
      v-bind="$attrs"
      class="icon-btn"
      :class="[`icon-btn--${variant}`, `icon-btn--${size}`]"
      :aria-label="label"
    >
      <AppIcon :name="icon" kind="ui" />
    </button>
  </AppTooltip>
</template>

<style scoped>
.icon-btn {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: var(--color-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius);
  cursor: pointer;
  transition:
    background-color var(--motion-fast) var(--ease),
    border-color var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease),
    transform var(--motion-fast) var(--ease);
}

.icon-btn--sm {
  width: 2rem;
  height: 2rem;
}

.icon-btn--md {
  width: 2.25rem;
  height: 2.25rem;
}

.icon-btn :deep(.icon) {
  width: var(--icon-md);
  height: var(--icon-md);
}

.icon-btn--secondary {
  background: var(--color-surface);
  border-color: var(--color-border-control);
}

.icon-btn:hover:not(:disabled) {
  color: var(--color-text);
  background: var(--state-hover);
}

.icon-btn:active:not(:disabled) {
  background: var(--state-active);
  transform: translateY(1px);
}

.icon-btn--danger:hover:not(:disabled) {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

.icon-btn:disabled {
  cursor: not-allowed;
  opacity: var(--state-disabled-opacity);
}

/* Érintőképernyőn legalább 44 px-es célméret. */
@media (pointer: coarse) {
  .icon-btn {
    width: 2.75rem;
    height: 2.75rem;
  }
}
</style>
