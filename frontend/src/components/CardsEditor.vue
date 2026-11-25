<script setup lang="ts">
import { useId } from 'vue'

import FormField from '@/components/FormField.vue'
import IconPicker from '@/components/IconPicker.vue'
import type { CardItem } from '@/types/content'
import {
  createCard,
  MAX_CARDS,
  MIN_CARDS,
  moveItem,
  type PageTarget,
  URL_FIELD_HINT,
} from '@/utils/components'

// A kártyacsoport szerkesztője: 1–6 kártya, kártyánként ikon, cím, leírás és opcionális gomb.
// A hibák kulcsa a komponensen belüli út (`cards.0.title`), a csoportra vonatkozó hibáé `cards`.
defineProps<{
  errors: Record<string, string[]>
  targets?: PageTarget[]
}>()

const cards = defineModel<CardItem[]>({ required: true })

const uid = useId()

function add(): void {
  if (cards.value.length < MAX_CARDS) cards.value = [...cards.value, createCard()]
}

function remove(index: number): void {
  if (cards.value.length > MIN_CARDS) cards.value = cards.value.filter((_, i) => i !== index)
}

function move(from: number, to: number): void {
  cards.value = moveItem(cards.value, from, to)
}
</script>

<template>
  <div class="cards-editor">
    <p v-if="errors.cards" class="field__error">{{ errors.cards.join(' ') }}</p>

    <fieldset v-for="(card, index) in cards" :key="card.id" class="card-editor">
      <legend>Kártya {{ index + 1 }}</legend>

      <span class="actions card-editor__actions">
        <button
          class="btn btn--secondary btn--small"
          type="button"
          :disabled="index === 0"
          :aria-label="`Kártya ${index + 1} feljebb`"
          @click="move(index, index - 1)"
        >
          ↑
        </button>
        <button
          class="btn btn--secondary btn--small"
          type="button"
          :disabled="index === cards.length - 1"
          :aria-label="`Kártya ${index + 1} lejjebb`"
          @click="move(index, index + 1)"
        >
          ↓
        </button>
        <button
          class="btn btn--secondary btn--small"
          type="button"
          :disabled="cards.length <= MIN_CARDS"
          :aria-label="`Kártya ${index + 1} törlése`"
          @click="remove(index)"
        >
          ✕
        </button>
      </span>

      <IconPicker v-model="card.icon" :error="errors[`cards.${index}.icon`]" />

      <FormField
        v-model="card.title"
        label="Cím"
        :required="false"
        :error="errors[`cards.${index}.title`]"
      />
      <FormField
        v-model="card.text"
        label="Leírás (opcionális)"
        multiline
        :rows="2"
        :required="false"
        :error="errors[`cards.${index}.text`]"
      />
      <FormField
        v-model="card.label"
        label="Gomb felirata (opcionális)"
        :required="false"
        :error="errors[`cards.${index}.label`]"
      />
      <FormField
        v-model="card.url"
        :label="`Gomb célja ${URL_FIELD_HINT.slice(0, -1)}; a felirattal együtt)`"
        :required="false"
        :list="targets?.length ? `${uid}-targets` : undefined"
        :error="errors[`cards.${index}.url`]"
      />
    </fieldset>

    <datalist v-if="targets?.length" :id="`${uid}-targets`">
      <option v-for="target in targets" :key="target.url" :value="target.url">
        {{ target.label }}
      </option>
    </datalist>

    <div class="actions">
      <button
        class="btn btn--secondary"
        type="button"
        :disabled="cards.length >= MAX_CARDS"
        @click="add"
      >
        + Kártya hozzáadása
      </button>
      <span class="muted">{{ cards.length }}/{{ MAX_CARDS }} kártya</span>
    </div>
  </div>
</template>

<style scoped>
.cards-editor {
  display: grid;
  gap: var(--space-3);
}

.card-editor {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
  margin: 0;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.card-editor legend {
  padding: 0 var(--space-2);
  font-weight: 600;
}

.card-editor__actions {
  justify-self: end;
}

[aria-invalid='true'] {
  border-color: var(--color-danger);
}

@media (pointer: coarse) {
  .card-editor__actions .btn {
    min-width: 2.75rem;
    min-height: 2.75rem;
  }
}
</style>
