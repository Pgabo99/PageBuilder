<script setup lang="ts">
import { computed, useId } from 'vue'

// Kapcsoló (be/ki): natív jelölőnégyzet `role="switch"`-csel, így szóközzel és képernyőolvasóval is használható.
const props = defineProps<{
  label: string
  hint?: string
  error?: string[]
  disabled?: boolean
}>()

const model = defineModel<boolean>({ default: false })
const id = useId()
const noteId = `${id}-note`
const hasError = computed(() => (props.error?.length ?? 0) > 0)
const note = computed(() => (hasError.value ? props.error?.join(' ') : props.hint))
</script>

<template>
  <div class="field">
    <label class="choice choice--switch" :for="id">
      <input
        :id="id"
        v-model="model"
        class="choice__input"
        type="checkbox"
        role="switch"
        :disabled="disabled"
        :aria-invalid="hasError"
        :aria-describedby="note ? noteId : undefined"
      />
      <span class="choice__track" aria-hidden="true"></span>
      <span class="choice__text">
        <span class="choice__label">{{ label }}</span>
      </span>
    </label>
    <p v-if="note" :id="noteId" class="field__hint" :class="hasError ? 'field__error' : 'muted'">
      {{ note }}
    </p>
  </div>
</template>
