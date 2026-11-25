<script setup lang="ts" generic="T extends string">
import { useId } from 'vue'

// Előre definiált értékek közül választó mező; az üres választás (alapértelmezett) `null`,
// a régi, mező nélküli komponens (undefined) is ezt jelenti.
defineProps<{
  label: string
  options: readonly { value: T; label: string }[]
  defaultLabel: string
  error?: string[]
}>()

const model = defineModel<T | null | undefined>()
const uid = useId()

function change(event: Event) {
  model.value = ((event.target as HTMLSelectElement).value || null) as T | null
}
</script>

<template>
  <div class="field">
    <label :for="uid">{{ label }}</label>
    <select :id="uid" :value="model ?? ''" @change="change">
      <option value="">{{ defaultLabel }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="error" class="field__error">{{ error.join(' ') }}</p>
  </div>
</template>
