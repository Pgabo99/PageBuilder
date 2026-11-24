<script setup lang="ts">
import ChoiceSelect from '@/components/ChoiceSelect.vue'
import type { OptionSpec } from '@/utils/components'

// Előre definiált beállítások (legördülő listák) egy komponens mezőihez; az üres választás `null`,
// ami a régi, mező nélküli komponens megjelenését jelenti.
defineProps<{
  spec: OptionSpec
  errors: Record<string, string[]>
}>()

const model = defineModel<object>({ required: true })

const record = () => model.value as Record<string, unknown>

function get(key: string): string | null {
  const value = record()[key]
  return value === null || value === undefined ? null : String(value)
}

function set(key: string, value: string | null | undefined): void {
  // Az oszlopszám szám, a többi választás szöveg.
  record()[key] = value && key === 'columns' ? Number(value) : (value ?? null)
}
</script>

<template>
  <ChoiceSelect
    v-for="option in spec"
    :key="option.key"
    :model-value="get(option.key)"
    :label="option.label"
    :default-label="option.defaultLabel"
    :options="option.options"
    :error="errors[option.key]"
    @update:model-value="set(option.key, $event)"
  />
</template>
