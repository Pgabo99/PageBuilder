<script setup lang="ts">
import { useId } from 'vue'

import AppIcon from '@/components/AppIcon.vue'
import { icons } from '@/utils/icons'

// Az ikon kiválasztása az előre definiált készletből; a "Nincs" a mezőt üresre (null) állítja.
// Natív rádiógombok: nyílbillentyűvel és Tabbal is használható.
defineProps<{ label?: string; error?: string[] }>()

const model = defineModel<string | null | undefined>()
const group = useId()
</script>

<template>
  <fieldset class="icon-picker">
    <legend>{{ label ?? 'Ikon' }}</legend>
    <div class="icon-picker__grid">
      <label class="icon-picker__option">
        <input
          class="icon-picker__input"
          type="radio"
          :name="group"
          value=""
          :checked="!model"
          @change="model = null"
        />
        <span class="icon-picker__face icon-picker__face--none">Nincs</span>
      </label>
      <label v-for="icon in icons" :key="icon.name" class="icon-picker__option" :title="icon.label">
        <input
          class="icon-picker__input"
          type="radio"
          :name="group"
          :value="icon.name"
          :checked="model === icon.name"
          :aria-label="icon.label"
          @change="model = icon.name"
        />
        <span class="icon-picker__face"><AppIcon :name="icon.name" /></span>
      </label>
    </div>
    <p v-if="error?.length" class="field__error">{{ error.join(' ') }}</p>
  </fieldset>
</template>

<style scoped>
.icon-picker {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.icon-picker legend {
  padding: 0;
  font-weight: var(--weight-semibold);
}

.icon-picker__grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

.icon-picker__option {
  position: relative;
  font-weight: var(--weight-regular);
}

.icon-picker__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.icon-picker__face {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 var(--space-2);
  font-size: var(--icon-md);
  color: var(--color-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.icon-picker__face--none {
  font-size: var(--text-sm);
}

.icon-picker__input:checked + .icon-picker__face {
  color: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.icon-picker__input:focus-visible + .icon-picker__face {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
