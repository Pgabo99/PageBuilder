<script setup lang="ts">
import { useId } from 'vue'

import AccordionEditor from '@/components/AccordionEditor.vue'
import CardsEditor from '@/components/CardsEditor.vue'
import FormField from '@/components/FormField.vue'
import IconPicker from '@/components/IconPicker.vue'
import OptionFields from '@/components/OptionFields.vue'
import SelectField from '@/components/SelectField.vue'
import type { PageComponent } from '@/types/content'
import {
  BUTTON_OPTIONS,
  CARDS_OPTIONS,
  componentLabel,
  componentSummary,
  DIVIDER_OPTIONS,
  HEADING_LEVEL_OPTIONS,
  HEADING_OPTIONS,
  MAX_SPACER_HEIGHT,
  MIN_SPACER_HEIGHT,
  type PageTarget,
  URL_FIELD_HINT,
} from '@/utils/components'

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
        <FormField v-model="model.text" label="Szöveg" :required="false" :error="errors.text" />
        <SelectField
          v-model="model.level"
          label="Szint"
          :options="HEADING_LEVEL_OPTIONS"
          :error="errors.level"
        />
        <OptionFields v-model="model" :spec="HEADING_OPTIONS" :errors="errors" />
        <IconPicker v-model="model.icon" :error="errors.icon" />
      </template>

      <FormField
        v-else-if="model.type === 'text'"
        v-model="model.text"
        label="Szöveg"
        multiline
        :rows="4"
        :required="false"
        :error="errors.text"
      />

      <template v-else-if="model.type === 'button'">
        <FormField v-model="model.label" label="Felirat" :required="false" :error="errors.label" />
        <FormField
          v-model="model.url"
          :label="`Cél ${URL_FIELD_HINT}`"
          :required="false"
          :list="targets?.length ? `${uid}-targets` : undefined"
          :error="errors.url"
        />
        <datalist v-if="targets?.length" :id="`${uid}-targets`">
          <option v-for="target in targets" :key="target.url" :value="target.url">
            {{ target.label }}
          </option>
        </datalist>
        <OptionFields v-model="model" :spec="BUTTON_OPTIONS" :errors="errors" />
      </template>

      <template v-else-if="model.type === 'cards'">
        <details class="component__options">
          <summary>Elrendezés</summary>
          <OptionFields v-model="model" :spec="CARDS_OPTIONS" :errors="errors" />
        </details>
        <CardsEditor v-model="model.cards" :errors="errors" :targets="targets" />
      </template>

      <FormField
        v-else-if="model.type === 'spacer'"
        v-model="model.height"
        label="Magasság (rem)"
        type="number"
        :min="MIN_SPACER_HEIGHT"
        :max="MAX_SPACER_HEIGHT"
        :step="1"
        :required="false"
        :error="errors.height"
      />

      <OptionFields
        v-else-if="model.type === 'divider'"
        v-model="model"
        :spec="DIVIDER_OPTIONS"
        :errors="errors"
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

[aria-invalid='true'] {
  border-color: var(--color-danger);
}
</style>
