<script setup lang="ts">
import FormField from '@/components/FormField.vue'
import type { AccordionItem } from '@/types/content'
import {
  createAccordionItem,
  MAX_ACCORDION_ITEMS,
  MIN_ACCORDION_ITEMS,
  moveItem,
} from '@/utils/components'

// A becsukható részek szerkesztője: 1–20 rész, mindegyiknek kötelező címe és szövege van.
// A hibák kulcsa a komponensen belüli út (`items.0.title`), a listára vonatkozó hibáé `items`.
defineProps<{ errors: Record<string, string[]> }>()

const items = defineModel<AccordionItem[]>({ required: true })

function add(): void {
  if (items.value.length < MAX_ACCORDION_ITEMS) {
    items.value = [...items.value, createAccordionItem()]
  }
}

function remove(index: number): void {
  if (items.value.length > MIN_ACCORDION_ITEMS) {
    items.value = items.value.filter((_, i) => i !== index)
  }
}

function move(from: number, to: number): void {
  items.value = moveItem(items.value, from, to)
}
</script>

<template>
  <div class="accordion-editor">
    <p v-if="errors.items" class="field__error">{{ errors.items.join(' ') }}</p>

    <fieldset v-for="(item, index) in items" :key="item.id" class="item-editor">
      <legend>Rész {{ index + 1 }}</legend>

      <span class="actions item-editor__actions">
        <button
          class="btn btn--secondary btn--small"
          type="button"
          :disabled="index === 0"
          :aria-label="`Rész ${index + 1} feljebb`"
          @click="move(index, index - 1)"
        >
          ↑
        </button>
        <button
          class="btn btn--secondary btn--small"
          type="button"
          :disabled="index === items.length - 1"
          :aria-label="`Rész ${index + 1} lejjebb`"
          @click="move(index, index + 1)"
        >
          ↓
        </button>
        <button
          class="btn btn--secondary btn--small"
          type="button"
          :disabled="items.length <= MIN_ACCORDION_ITEMS"
          :aria-label="`Rész ${index + 1} törlése`"
          @click="remove(index)"
        >
          ✕
        </button>
      </span>

      <FormField
        v-model="item.title"
        label="Cím"
        :required="false"
        :error="errors[`items.${index}.title`]"
      />
      <FormField
        v-model="item.text"
        label="Szöveg"
        multiline
        :rows="3"
        :required="false"
        :error="errors[`items.${index}.text`]"
      />
    </fieldset>

    <div class="actions">
      <button
        class="btn btn--secondary"
        type="button"
        :disabled="items.length >= MAX_ACCORDION_ITEMS"
        @click="add"
      >
        + Rész hozzáadása
      </button>
      <span class="muted">{{ items.length }}/{{ MAX_ACCORDION_ITEMS }} rész</span>
    </div>
  </div>
</template>

<style scoped>
.accordion-editor {
  display: grid;
  gap: var(--space-3);
}

.item-editor {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
  margin: 0;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.item-editor legend {
  padding: 0 var(--space-2);
  font-weight: 600;
}

.item-editor__actions {
  justify-self: end;
}

[aria-invalid='true'] {
  border-color: var(--color-danger);
}

@media (pointer: coarse) {
  .item-editor__actions .btn {
    min-width: 2.75rem;
    min-height: 2.75rem;
  }
}
</style>
