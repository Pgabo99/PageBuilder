<script setup lang="ts">
import { computed, useId } from 'vue'

// Szöveges, számmező vagy (a `multiline` esetén) többsoros mező címkével, hibával és súgóval.
// A `required` alapból igaz (az auth-űrlapok miatt); az opcionális mezőknél `:required="false"`.
const props = withDefaults(
  defineProps<{
    label: string
    type?: string
    multiline?: boolean
    rows?: number
    autocomplete?: string
    error?: string[]
    hint?: string
    required?: boolean
    list?: string
    min?: number
    max?: number
    step?: number
  }>(),
  { type: 'text', required: true },
)

const model = defineModel<string | number | null | undefined>({ required: true })

const id = useId()
const errorId = `${id}-error`
const hasError = computed(() => (props.error?.length ?? 0) > 0)

function input(event: Event) {
  const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
  // A számmező számot ad vissza (az üres marad üres, hogy a szerver jelezze a hiányt).
  model.value = props.type === 'number' && value !== '' ? Number(value) : value
}
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <textarea
      v-if="multiline"
      :id="id"
      :value="model ?? ''"
      :rows="rows"
      :aria-invalid="hasError"
      :aria-describedby="hasError ? errorId : undefined"
      :required="required"
      @input="input"
    ></textarea>
    <input
      v-else
      :id="id"
      :value="model ?? ''"
      :type="type"
      :autocomplete="autocomplete"
      :list="list"
      :min="min"
      :max="max"
      :step="step"
      :aria-invalid="hasError"
      :aria-describedby="hasError ? errorId : undefined"
      :required="required"
      @input="input"
    />
    <p v-if="hasError" :id="errorId" class="field__error">{{ error?.join(' ') }}</p>
    <p v-else-if="hint" class="muted field__hint">{{ hint }}</p>
  </div>
</template>
