<script setup lang="ts">
import { computed, useId } from 'vue'

// Színválasztó visszaállítással: az üres érték az alapértelmezett szín (a `fallback` jelenik meg benne).
const props = defineProps<{
  label: string
  fallback: string
  error?: string[]
}>()

const model = defineModel<string>({ required: true })
const id = useId()
const errorId = `${id}-error`
const hasError = computed(() => (props.error?.length ?? 0) > 0)
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <div class="actions">
      <input
        :id="id"
        type="color"
        :value="model || fallback"
        :aria-invalid="hasError"
        :aria-describedby="hasError ? errorId : undefined"
        @input="model = ($event.target as HTMLInputElement).value"
      />
      <button v-if="model" class="btn btn--secondary btn--small" type="button" @click="model = ''">
        Alapértelmezett
      </button>
    </div>
    <p v-if="hasError" :id="errorId" class="field__error">{{ error?.join(' ') }}</p>
  </div>
</template>

<style scoped>
input[type='color'] {
  width: 3rem;
  height: 2.25rem;
  padding: 0;
  cursor: pointer;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
</style>
