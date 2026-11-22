<script setup lang="ts">
import { useId } from 'vue'

import AccordionEditor from '@/components/AccordionEditor.vue'
import CardsEditor from '@/components/CardsEditor.vue'
import IconPicker from '@/components/IconPicker.vue'
import type { PageComponent } from '@/types/content'
import { componentLabel, componentSummary, type PageTarget } from '@/utils/components'

// Egy komponens szerkesztője: a mezők típusonként változnak, a hibák mezőnként jelennek meg.
defineProps<{
  errors: Record<string, string[]>
  first: boolean
  last: boolean
  active: boolean
  targets?: PageTarget[]
}>()

const model = defineModel<PageComponent>({ required: true })

defineEmits<{
  remove: []
  duplicate: []
  up: []
  down: []
  toggle: []
  dragstart: [event: DragEvent]
}>()

const uid = useId()
</script>

<template>
  <div class="component" :class="{ 'component--active': active }">
    <div class="component__head">
      <span
        class="component__handle"
        draggable="true"
        role="img"
        aria-label="Húzd az átrendezéshez"
        title="Húzd az átrendezéshez"
        @dragstart="$emit('dragstart', $event)"
        >⠿</span
      >
      <button
        class="component__toggle"
        type="button"
        :aria-expanded="active"
        :aria-controls="`${uid}-fields`"
        @click="$emit('toggle')"
      >
        <strong>{{ componentLabel(model.type) }}</strong>
        <span v-if="!active" class="component__summary muted">{{ componentSummary(model) }}</span>
        <span v-if="!active && Object.keys(errors).length" class="component__invalid">
          Hibás mező
        </span>
      </button>
      <span class="actions">
        <button
          class="btn btn--secondary btn--small"
          type="button"
          :disabled="first"
          aria-label="Feljebb"
          @click="$emit('up')"
        >
          ↑
        </button>
        <button
          class="btn btn--secondary btn--small"
          type="button"
          :disabled="last"
          aria-label="Lejjebb"
          @click="$emit('down')"
        >
          ↓
        </button>
        <button
          class="btn btn--secondary btn--small"
          type="button"
          aria-label="Komponens másolása"
          @click="$emit('duplicate')"
        >
          ⧉
        </button>
        <button
          class="btn btn--secondary btn--small"
          type="button"
          aria-label="Komponens törlése"
          @click="$emit('remove')"
        >
          ✕
        </button>
      </span>
    </div>

    <div v-if="active" :id="`${uid}-fields`" class="component__fields">
      <template v-if="model.type === 'heading'">
        <div class="field">
          <label :for="`${uid}-text`">Szöveg</label>
          <input
            :id="`${uid}-text`"
            v-model="model.text"
            :aria-invalid="!!errors.text"
            type="text"
          />
          <p v-if="errors.text" class="field__error">{{ errors.text.join(' ') }}</p>
        </div>
        <div class="field">
          <label :for="`${uid}-level`">Szint</label>
          <select :id="`${uid}-level`" v-model.number="model.level">
            <option :value="1">Nagy (H1)</option>
            <option :value="2">Közepes (H2)</option>
            <option :value="3">Kicsi (H3)</option>
          </select>
          <p v-if="errors.level" class="field__error">{{ errors.level.join(' ') }}</p>
        </div>
        <IconPicker v-model="model.icon" :error="errors.icon" />
      </template>

      <div v-else-if="model.type === 'text'" class="field">
        <label :for="`${uid}-text`">Szöveg</label>
        <textarea
          :id="`${uid}-text`"
          v-model="model.text"
          :aria-invalid="!!errors.text"
          rows="4"
        ></textarea>
        <p v-if="errors.text" class="field__error">{{ errors.text.join(' ') }}</p>
      </div>

      <template v-else-if="model.type === 'button'">
        <div class="field">
          <label :for="`${uid}-label`">Felirat</label>
          <input
            :id="`${uid}-label`"
            v-model="model.label"
            :aria-invalid="!!errors.label"
            type="text"
          />
          <p v-if="errors.label" class="field__error">{{ errors.label.join(' ') }}</p>
        </div>
        <div class="field">
          <label :for="`${uid}-url`">Cél (https://…, /útvonal vagy #horgony)</label>
          <input
            :id="`${uid}-url`"
            v-model="model.url"
            :aria-invalid="!!errors.url"
            :list="targets?.length ? `${uid}-targets` : undefined"
            type="text"
          />
          <datalist v-if="targets?.length" :id="`${uid}-targets`">
            <option v-for="target in targets" :key="target.url" :value="target.url">
              {{ target.label }}
            </option>
          </datalist>
          <p v-if="errors.url" class="field__error">{{ errors.url.join(' ') }}</p>
        </div>
      </template>

      <CardsEditor
        v-else-if="model.type === 'cards'"
        v-model="model.cards"
        :errors="errors"
        :targets="targets"
      />

      <AccordionEditor
        v-else-if="model.type === 'accordion'"
        v-model="model.items"
        :errors="errors"
      />
    </div>
  </div>
</template>

<style scoped>
.component {
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.component--active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.component__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.component--active .component__head {
  margin-bottom: var(--space-3);
}

/* Az összefoglaló egész sora kattintható és billentyűzettel is használható (Enter, szóköz). */
.component__toggle {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: baseline;
  gap: var(--space-3);
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  background: none;
  border: 0;
  cursor: pointer;
}

.component__summary {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.component__invalid {
  font-size: 0.875rem;
  color: var(--color-danger);
}

.component__head .actions {
  margin-left: auto;
}

.component__handle {
  color: var(--color-muted);
  cursor: grab;
  user-select: none;
}

.component__fields {
  display: grid;
  gap: var(--space-3);
}

/* Érintőképernyőn nincs HTML5 húzás: a fel/le gomb marad, a gombok nagyobbak. */
@media (pointer: coarse) {
  .component__handle {
    display: none;
  }

  .component__head .btn {
    min-width: 2.75rem;
    min-height: 2.75rem;
  }
}

.field {
  display: grid;
  gap: var(--space-1);
}

label {
  font-weight: 600;
}

input,
select,
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
</style>
