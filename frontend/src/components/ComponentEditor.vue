<script setup lang="ts">
import { useId } from 'vue'

import type { PageComponent } from '@/types/content'
import { componentLabel } from '@/utils/components'

// Egy komponens szerkesztője: a mezők típusonként változnak, a hibák mezőnként jelennek meg.
defineProps<{
  errors: Record<string, string[]>
  first: boolean
  last: boolean
}>()

const model = defineModel<PageComponent>({ required: true })

defineEmits<{ remove: []; duplicate: []; up: []; down: []; dragstart: [event: DragEvent] }>()

const uid = useId()
</script>

<template>
  <div class="component">
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
      <strong>{{ componentLabel(model.type) }}</strong>
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

    <div class="component__fields">
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
          <input :id="`${uid}-url`" v-model="model.url" :aria-invalid="!!errors.url" type="text" />
          <p v-if="errors.url" class="field__error">{{ errors.url.join(' ') }}</p>
        </div>
      </template>
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

.component__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
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
