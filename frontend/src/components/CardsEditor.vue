<script setup lang="ts">
import { useId } from 'vue'

import IconPicker from '@/components/IconPicker.vue'
import type { CardItem } from '@/types/content'
import { createCard, MAX_CARDS, MIN_CARDS, moveItem, type PageTarget } from '@/utils/components'

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

      <div class="field">
        <label :for="`${uid}-${card.id}-title`">Cím</label>
        <input
          :id="`${uid}-${card.id}-title`"
          v-model="card.title"
          :aria-invalid="!!errors[`cards.${index}.title`]"
          type="text"
        />
        <p v-if="errors[`cards.${index}.title`]" class="field__error">
          {{ errors[`cards.${index}.title`]!.join(' ') }}
        </p>
      </div>

      <div class="field">
        <label :for="`${uid}-${card.id}-text`">Leírás (opcionális)</label>
        <textarea
          :id="`${uid}-${card.id}-text`"
          v-model="card.text"
          :aria-invalid="!!errors[`cards.${index}.text`]"
          rows="2"
        ></textarea>
        <p v-if="errors[`cards.${index}.text`]" class="field__error">
          {{ errors[`cards.${index}.text`]!.join(' ') }}
        </p>
      </div>

      <div class="field">
        <label :for="`${uid}-${card.id}-label`">Gomb felirata (opcionális)</label>
        <input
          :id="`${uid}-${card.id}-label`"
          v-model="card.label"
          :aria-invalid="!!errors[`cards.${index}.label`]"
          type="text"
        />
        <p v-if="errors[`cards.${index}.label`]" class="field__error">
          {{ errors[`cards.${index}.label`]!.join(' ') }}
        </p>
      </div>

      <div class="field">
        <label :for="`${uid}-${card.id}-url`"
          >Gomb célja (https://…, /útvonal vagy #horgony; a felirattal együtt)</label
        >
        <input
          :id="`${uid}-${card.id}-url`"
          v-model="card.url"
          :aria-invalid="!!errors[`cards.${index}.url`]"
          :list="targets?.length ? `${uid}-targets` : undefined"
          type="text"
        />
        <p v-if="errors[`cards.${index}.url`]" class="field__error">
          {{ errors[`cards.${index}.url`]!.join(' ') }}
        </p>
      </div>
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

.field {
  display: grid;
  gap: var(--space-1);
}

label {
  font-weight: 600;
}

input,
textarea {
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  font: inherit;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

[aria-invalid='true'] {
  border-color: var(--color-danger);
}

.field__error {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-danger);
}

@media (pointer: coarse) {
  .card-editor__actions .btn {
    min-width: 2.75rem;
    min-height: 2.75rem;
  }
}
</style>
