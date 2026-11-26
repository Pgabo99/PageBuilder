<script setup lang="ts">
import { computed, useId } from 'vue'

import AppIcon from '@/components/AppIcon.vue'

// Jelölőnégyzet címkével, súgóval és hibával; a natív input megmarad (billentyűzet, képernyőolvasó).
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
    <label class="choice choice--checkbox" :for="id">
      <input
        :id="id"
        v-model="model"
        class="choice__input"
        type="checkbox"
        :disabled="disabled"
        :aria-invalid="hasError"
        :aria-describedby="note ? noteId : undefined"
      />
      <span class="choice__box" aria-hidden="true"><AppIcon name="check" kind="ui" /></span>
      <span class="choice__text">
        <span class="choice__label">{{ label }}</span>
      </span>
    </label>
    <p v-if="note" :id="noteId" class="field__hint" :class="hasError ? 'field__error' : 'muted'">
      {{ note }}
    </p>
  </div>
</template>
