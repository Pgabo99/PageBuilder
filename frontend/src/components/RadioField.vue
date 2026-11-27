<script setup lang="ts" generic="T extends string | number">
import { useId } from 'vue'

// Egy rádiógomb-opció; a csoportot az azonos `name` és a közös `v-model` (a kiválasztott érték) adja.
const props = defineProps<{
  label: string
  value: T
  name: string
  hint?: string
  disabled?: boolean
}>()

const model = defineModel<T | null | undefined>()
const id = useId()
const hintId = `${id}-hint`
</script>

<template>
  <div class="field">
    <label class="choice choice--radio" :for="id">
      <input
        :id="id"
        class="choice__input"
        type="radio"
        :name="name"
        :value="props.value"
        :checked="model === props.value"
        :disabled="disabled"
        :aria-describedby="hint ? hintId : undefined"
        @change="model = props.value"
      />
      <span class="choice__box" aria-hidden="true"></span>
      <span class="choice__text">
        <span class="choice__label">{{ label }}</span>
      </span>
    </label>
    <p v-if="hint" :id="hintId" class="muted field__hint">{{ hint }}</p>
  </div>
</template>
