<script setup lang="ts">
import { computed, useId } from 'vue'

import AccordionEditor from '@/components/AccordionEditor.vue'
import ActionMenu from '@/components/ActionMenu.vue'
import AppCollapse from '@/components/AppCollapse.vue'
import AppIcon from '@/components/AppIcon.vue'
import BadgeLabel from '@/components/BadgeLabel.vue'
import CardsEditor from '@/components/CardsEditor.vue'
import FooterEditor from '@/components/FooterEditor.vue'
import FormField from '@/components/FormField.vue'
import IconButton from '@/components/IconButton.vue'
import IconPicker from '@/components/IconPicker.vue'
import OptionFields from '@/components/OptionFields.vue'
import SelectField from '@/components/SelectField.vue'
import SocialEditor from '@/components/SocialEditor.vue'
import StatsEditor from '@/components/StatsEditor.vue'
import type { PageComponent } from '@/types/content'
import {
  ALERT_VARIANTS,
  BUTTON_OPTIONS,
  CARDS_OPTIONS,
  componentLabel,
  componentTypes,
  componentSummary,
  DIVIDER_OPTIONS,
  HEADING_LEVEL_OPTIONS,
  HEADING_OPTIONS,
  MARKDOWN_HINT,
  MAX_SPACER_HEIGHT,
  MIN_SPACER_HEIGHT,
  TEXT_FORMATS,
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
const typeIcon = computed(
  () => componentTypes.find((item) => item.type === model.value.type)?.icon ?? 'type',
)
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
        <span class="component__icon" aria-hidden="true">
          <AppIcon :name="typeIcon" kind="type" />
        </span>
        <strong>{{ componentLabel(model.type) }}</strong>
        <span v-if="!active" class="component__summary muted">{{ componentSummary(model) }}</span>
        <BadgeLabel
          v-if="!active && Object.keys(errors).length"
          class="component__invalid"
          variant="danger"
          dot
        >
          Hibás mező
        </BadgeLabel>
      </button>
      <span class="actions">
        <IconButton icon="arrow-up" label="Feljebb" :disabled="first" @click="$emit('up')" />
        <IconButton icon="arrow-down" label="Lejjebb" :disabled="last" @click="$emit('down')" />
        <ActionMenu label="További műveletek">
          <button
            v-if="model.type !== 'footer'"
            class="menu__item"
            type="button"
            role="menuitem"
            @click="$emit('duplicate')"
          >
            <AppIcon name="copy" kind="ui" />
            Komponens másolása
          </button>
          <div v-if="model.type !== 'footer'" class="menu__separator" role="separator"></div>
          <button
            class="menu__item menu__item--danger"
            type="button"
            role="menuitem"
            @click="$emit('remove')"
          >
            <AppIcon name="trash-2" kind="ui" />
            Komponens törlése
          </button>
        </ActionMenu>
      </span>
    </div>

    <AppCollapse :id="`${uid}-fields`" :open="active">
      <div class="component__fields">
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

        <template v-else-if="model.type === 'text'">
          <SelectField
            v-model="model.format"
            label="Formátum"
            empty-label="Sima szöveg"
            :options="TEXT_FORMATS"
            :error="errors.format"
          />
          <FormField
            v-model="model.text"
            label="Szöveg"
            multiline
            :rows="4"
            :required="false"
            :hint="model.format === 'markdown' ? MARKDOWN_HINT : undefined"
            :error="errors.text"
          />
        </template>

        <template v-else-if="model.type === 'button'">
          <FormField
            v-model="model.label"
            label="Felirat"
            :required="false"
            :error="errors.label"
          />
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

        <FooterEditor
          v-else-if="model.type === 'footer'"
          v-model="model"
          :errors="errors"
          :targets="targets"
        />

        <StatsEditor v-else-if="model.type === 'stats'" v-model="model.items" :errors="errors" />

        <SocialEditor
          v-else-if="model.type === 'social'"
          v-model="model.items"
          :errors="errors"
          :targets="targets"
        />

        <template v-else-if="model.type === 'quote'">
          <FormField
            v-model="model.text"
            label="Idézet"
            multiline
            :rows="3"
            :required="false"
            :error="errors.text"
          />
          <FormField
            v-model="model.author"
            label="Szerző (opcionális)"
            :required="false"
            :error="errors.author"
          />
          <FormField
            v-model="model.source"
            label="Forrás (opcionális)"
            :required="false"
            :error="errors.source"
          />
          <FormField
            v-model="model.source_url"
            :label="`Forrás linkje (opcionális) ${URL_FIELD_HINT}`"
            :required="false"
            :list="targets?.length ? `${uid}-targets` : undefined"
            :error="errors.source_url"
          />
          <datalist v-if="targets?.length" :id="`${uid}-targets`">
            <option v-for="target in targets" :key="target.url" :value="target.url">
              {{ target.label }}
            </option>
          </datalist>
        </template>

        <template v-else-if="model.type === 'alert'">
          <SelectField
            v-model="model.variant"
            label="Típus"
            :options="ALERT_VARIANTS"
            :error="errors.variant"
          />
          <FormField
            v-model="model.title"
            label="Cím (opcionális)"
            :required="false"
            :error="errors.title"
          />
          <FormField
            v-model="model.text"
            label="Szöveg"
            multiline
            :rows="3"
            :required="false"
            :error="errors.text"
          />
          <IconPicker v-model="model.icon" :error="errors.icon" />
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
    </AppCollapse>
  </div>
</template>

<style scoped>
.component {
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  transition:
    border-color var(--motion-fast) var(--ease),
    box-shadow var(--motion-fast) var(--ease);
}

.component:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-sm);
}

/* Aktív kártya: akcentuskeret, puha gyűrű és bal oldali akcentussáv. */
.component--active,
.component--active:hover {
  border-color: var(--color-primary);
  box-shadow:
    inset 3px 0 0 var(--color-primary),
    0 0 0 3px var(--color-primary-soft);
}

.component__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* Az egész sor kattintható és billentyűzettel is használható (Enter, szóköz). */
.component__toggle {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-1) 0;
  font: inherit;
  color: inherit;
  text-align: left;
  background: none;
  border: 0;
  cursor: pointer;
}

.component__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--color-muted);
  background: var(--state-hover);
  border-radius: var(--radius-md);
  transition:
    background-color var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.component__icon :deep(.icon) {
  width: var(--icon-md);
  height: var(--icon-md);
}

.component--active .component__icon {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.component__summary {
  min-width: 0;
  overflow: hidden;
  font-size: var(--text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.component__head .actions {
  flex: none;
  flex-wrap: nowrap;
  gap: var(--space-1);
  margin-left: auto;
}

.component__handle {
  flex: none;
  color: var(--color-muted);
  cursor: grab;
  user-select: none;
}

.component__fields {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

/* Érintőképernyőn nincs HTML5 húzás: a fel/le gomb marad. */
@media (pointer: coarse) {
  .component__handle {
    display: none;
  }
}

[aria-invalid='true'] {
  border-color: var(--color-danger);
}
</style>
