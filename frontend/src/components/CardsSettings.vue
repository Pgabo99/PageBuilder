<script setup lang="ts">
import ChoiceSelect from '@/components/ChoiceSelect.vue'
import type { CardsComponent } from '@/types/content'
import { CARDS_OPTIONS } from '@/utils/components'

// A kártyacsoport elrendezési beállításai (oszlopok, ikon, igazítás, keret, árnyék, térközök).
// Az üres választás `null`, ami a régi, mező nélküli csoport megjelenését jelenti.
defineProps<{ errors: Record<string, string[]> }>()

const model = defineModel<CardsComponent>({ required: true })

function get(key: string): string | null {
  const value = (model.value as unknown as Record<string, unknown>)[key]
  return value === null || value === undefined ? null : String(value)
}

function set(key: string, value: string | null | undefined): void {
  // Az oszlopszám szám, a többi választás szöveg.
  const stored = value && key === 'columns' ? Number(value) : (value ?? null)
  ;(model.value as unknown as Record<string, unknown>)[key] = stored
}
</script>

<template>
  <details class="cards-settings">
    <summary>Elrendezés</summary>
    <ChoiceSelect
      v-for="option in CARDS_OPTIONS"
      :key="option.key"
      :model-value="get(option.key)"
      :label="option.label"
      :default-label="option.defaultLabel"
      :options="option.options"
      :error="errors[option.key]"
      @update:model-value="set(option.key, $event)"
    />
  </details>
</template>
