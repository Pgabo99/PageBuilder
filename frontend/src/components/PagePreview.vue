<script setup lang="ts">
import { computed } from 'vue'

import type { PageComponent } from '@/types/content'
import { pageStyle, type PageTheme } from '@/utils/themes'

// Az előnézet a szerkesztett (akár mentetlen) tartalomból renderel, a publikált oldal megjelenésével.
// Szándékosan nem interaktív: a gombok nem navigálnak.
const props = defineProps<{
  components: readonly PageComponent[]
  theme?: PageTheme | null
  accent?: string | null
}>()

const style = computed(() => pageStyle(props.theme, props.accent))

// A backend `PageContentRules::URL_PATTERN`-jével azonos szabály: a publikált oldal a nem biztonságos URL-ű gombot elhagyja.
const SAFE_URL = /^(?:https?:\/\/\S+|\/(?!\/)\S*|#\S*)$/i

const level = (value: number): 1 | 2 | 3 =>
  Math.min(3, Math.max(1, Math.trunc(value) || 2)) as 1 | 2 | 3
</script>

<template>
  <div class="preview" :style="style" aria-hidden="true">
    <p v-if="components.length === 0" class="preview__empty">Az oldal még üres.</p>
    <template v-for="component in components" :key="component.id">
      <component :is="`h${level(component.level)}`" v-if="component.type === 'heading'">
        {{ component.text }}
      </component>
      <p v-else-if="component.type === 'text'">{{ component.text }}</p>
      <p v-else-if="component.type === 'button' && SAFE_URL.test(component.url)">
        <span class="preview__button">{{ component.label }}</span>
      </p>
    </template>
  </div>
</template>

<style scoped>
.preview {
  padding: 1rem;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  line-height: 1.6;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow-wrap: anywhere;
}

.preview__empty {
  margin: 0;
  opacity: 0.7;
}

.preview__button {
  display: inline-block;
  padding: 0.5rem 1rem;
  font-weight: 600;
  color: var(--on-accent);
  background: var(--accent);
  border-radius: 0.5rem;
}
</style>
