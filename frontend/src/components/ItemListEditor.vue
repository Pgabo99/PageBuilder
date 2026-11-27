<script setup lang="ts" generic="T extends { id: string }">
import IconButton from '@/components/IconButton.vue'
import { moveItem } from '@/utils/components'

// Egy komponens ismétlődő elemeinek (kártyák, részek, statisztikák) listaszerkesztője: sorszámozott
// csoportok fel/le/törlés gombokkal és hozzáadással; az elem mezőit az `item` slot adja.
// A hibák kulcsa a komponensen belüli út (pl. `cards.0.title`), a listára vonatkozó hibát az `error` kapja.
const props = defineProps<{
  /** Az elem neve egyes számban, nagy kezdőbetűvel (pl. „Kártya”): jelölés, gombnevek. */
  itemLabel: string
  /** Az elem neve a számlálóban, kisbetűvel (pl. „kártya”). */
  countLabel: string
  min: number
  max: number
  createItem: () => T
  error?: string[]
}>()

const items = defineModel<T[]>({ required: true })

function add(): void {
  if (items.value.length < props.max) items.value = [...items.value, props.createItem()]
}

function remove(index: number): void {
  if (items.value.length > props.min) items.value = items.value.filter((_, i) => i !== index)
}

function move(from: number, to: number): void {
  items.value = moveItem(items.value, from, to)
}
</script>

<template>
  <div class="item-list">
    <p v-if="error?.length" class="field__error">{{ error.join(' ') }}</p>

    <fieldset v-for="(item, index) in items" :key="item.id" class="item-editor">
      <legend>{{ itemLabel }} {{ index + 1 }}</legend>

      <span class="actions item-editor__actions">
        <IconButton
          icon="arrow-up"
          :label="`${itemLabel} ${index + 1} feljebb`"
          :disabled="index === 0"
          @click="move(index, index - 1)"
        />
        <IconButton
          icon="arrow-down"
          :label="`${itemLabel} ${index + 1} lejjebb`"
          :disabled="index === items.length - 1"
          @click="move(index, index + 1)"
        />
        <IconButton
          icon="trash-2"
          variant="danger"
          :label="`${itemLabel} ${index + 1} törlése`"
          :disabled="items.length <= min"
          @click="remove(index)"
        />
      </span>

      <slot name="item" :item="item" :index="index"></slot>
    </fieldset>

    <slot name="after"></slot>

    <div class="actions">
      <button class="btn btn--secondary" type="button" :disabled="items.length >= max" @click="add">
        + {{ itemLabel }} hozzáadása
      </button>
      <span class="muted">{{ items.length }}/{{ max }} {{ countLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.item-list {
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
  font-weight: var(--weight-semibold);
}

.item-editor__actions {
  justify-self: end;
}
</style>
