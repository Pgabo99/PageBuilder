<script setup lang="ts">
import { computed, useId } from 'vue'

const props = defineProps<{
  label: string
  type?: string
  autocomplete?: string
  error?: string[]
  hint?: string
}>()

const model = defineModel<string>({ required: true })

const id = useId()
const errorId = `${id}-error`
const hasError = computed(() => (props.error?.length ?? 0) > 0)
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :autocomplete="autocomplete"
      :aria-invalid="hasError"
      :aria-describedby="hasError ? errorId : undefined"
      required
    />
    <p v-if="hasError" :id="errorId" class="field__error">{{ error?.join(' ') }}</p>
    <p v-else-if="hint" class="muted field__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: var(--space-1);
}

label {
  font-weight: 600;
}

input {
  padding: var(--space-2) var(--space-3);
  font: inherit;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

input[aria-invalid='true'] {
  border-color: var(--color-danger);
}

.field__hint {
  margin: 0;
  font-size: 0.875rem;
}

.field__error {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-danger);
}
</style>
