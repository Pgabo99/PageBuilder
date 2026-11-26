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
      <label class="choice">
        <input
          class="choice__input"
          type="radio"
          :name="group"
          value=""
          :checked="!model"
          @change="model = null"
        />
        <span class="choice__face icon-picker__none">Nincs</span>
      </label>
      <label v-for="icon in icons" :key="icon.name" class="choice" :title="icon.label">
        <input
          class="choice__input"
          type="radio"
          :name="group"
          :value="icon.name"
          :checked="model === icon.name"
          :aria-label="icon.label"
          @change="model = icon.name"
        />
        <span class="choice__face"><AppIcon :name="icon.name" /></span>
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

.icon-picker__none {
  font-size: var(--text-sm);
}
</style>
