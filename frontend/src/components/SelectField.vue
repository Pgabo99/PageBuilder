<script setup lang="ts" generic="T extends string | number">
import { useId } from 'vue'

// Legördülő lista a többi mezővel azonos megjelenéssel. Az `emptyLabel` megadásakor van üres
// (alapértelmezett) választás, ami `null` értéket ad; a régi, mező nélküli komponens (undefined) is ezt jelenti.
const props = defineProps<{
  label: string
  options: readonly { value: T; label: string }[]
  emptyLabel?: string
  error?: string[]
  hint?: string
}>()

const model = defineModel<T | null | undefined>()
const id = useId()
const errorId = `${id}-error`

function change(event: Event) {
  const raw = (event.target as HTMLSelectElement).value
  // A szám- és szövegértékek is a lista eredeti típusában kerülnek vissza.
  model.value = props.options.find((option) => String(option.value) === raw)?.value ?? null
}
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <select
      :id="id"
      :value="model ?? ''"
      :aria-invalid="!!error?.length"
      :aria-describedby="error?.length ? errorId : undefined"
      @change="change"
    >
      <option v-if="emptyLabel !== undefined" value="">{{ emptyLabel }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="error?.length" :id="errorId" class="field__error">{{ error.join(' ') }}</p>
    <p v-else-if="hint" class="muted field__hint">{{ hint }}</p>
  </div>
</template>
