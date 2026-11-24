<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from '@/components/AppIcon.vue'
import { headingClasses, MAX_ACCORDION_ITEMS, MAX_CARDS } from '@/utils/components'
import { findIcon } from '@/utils/icons'
import type { PageComponent } from '@/types/content'
import { pageStyle, type PageTheme } from '@/utils/themes'

// Az előnézet a szerkesztett (akár mentetlen) tartalomból renderel, a publikált oldal megjelenésével.
// A gombok nem navigálnak; a kattintás csak az elemet jelöli ki a szerkesztőben (billentyűzettel a
// szerkesztő összefoglaló sorai érhetők el, ezért az előnézet rejtett a képernyőolvasók elől).
const props = defineProps<{
  components: readonly PageComponent[]
  theme?: PageTheme | null
  accent?: string | null
  activeId?: string | null
}>()

defineEmits<{ select: [id: string] }>()

const style = computed(() => pageStyle(props.theme, props.accent))

// A backend `PageContentRules::URL_PATTERN`-jével azonos szabály: a publikált oldal a nem biztonságos URL-ű gombot elhagyja.
const SAFE_URL = /^(?:https?:\/\/\S+|\/(?!\/)\S*|#\S*)$/i

const level = (value: number): number => Math.min(6, Math.max(1, Math.trunc(value) || 2))
</script>

<template>
  <div class="preview" :style="style" aria-hidden="true">
    <p v-if="components.length === 0" class="preview__empty">Az oldal még üres.</p>
    <template v-for="component in components" :key="component.id">
      <component
        :is="`h${level(component.level)}`"
        v-if="component.type === 'heading'"
        class="preview__item"
        :class="[{ 'preview__item--active': component.id === activeId }, headingClasses(component)]"
        :data-component-id="component.id"
        @click="$emit('select', component.id)"
      >
        <AppIcon v-if="component.icon" class="preview__icon" :name="component.icon" />{{
          component.text
        }}
      </component>
      <p
        v-else-if="component.type === 'text'"
        class="preview__item"
        :class="{ 'preview__item--active': component.id === activeId }"
        :data-component-id="component.id"
        @click="$emit('select', component.id)"
      >
        {{ component.text }}
      </p>
      <div
        v-else-if="component.type === 'cards'"
        class="preview__item preview__cards"
        :class="{ 'preview__item--active': component.id === activeId }"
        :data-component-id="component.id"
        @click="$emit('select', component.id)"
      >
        <article
          v-for="card in component.cards.slice(0, MAX_CARDS)"
          :key="card.id"
          class="preview__card"
        >
          <div v-if="findIcon(card.icon)" class="preview__card-icon">
            <AppIcon :name="card.icon" />
          </div>
          <h3>{{ card.title }}</h3>
          <p v-if="card.text">{{ card.text }}</p>
          <p v-if="card.label && card.url && SAFE_URL.test(card.url)">
            <span class="preview__button">{{ card.label }}</span>
          </p>
        </article>
      </div>
      <!-- A részek natív details elemek: a kattintás nyit/csuk, és közben a komponenst is kijelöli. A
           summary nem fókuszálható (tabindex -1), mert az előnézet a képernyőolvasók elől rejtett. -->
      <div
        v-else-if="component.type === 'accordion'"
        class="preview__item preview__accordion"
        :class="{ 'preview__item--active': component.id === activeId }"
        :data-component-id="component.id"
        @click="$emit('select', component.id)"
      >
        <details v-for="item in component.items.slice(0, MAX_ACCORDION_ITEMS)" :key="item.id">
          <summary tabindex="-1">{{ item.title }}</summary>
          <p>{{ item.text }}</p>
        </details>
      </div>
      <p
        v-else-if="component.type === 'button' && SAFE_URL.test(component.url)"
        class="preview__item"
        :class="{ 'preview__item--active': component.id === activeId }"
        :data-component-id="component.id"
        @click="$emit('select', component.id)"
      >
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

.preview__item {
  cursor: pointer;
  border-radius: 0.25rem;
}

/* A kijelölés csak szerkesztői jelölés: a publikált HTML-ben nincs ilyen. */
.preview__item--active {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

/* Mint a publikált oldal `.heading--*` szabályai: a megjelenési méret és az igazítás a szinttől független. */
.preview__heading--small,
.preview__heading--medium,
.preview__heading--large,
.preview__heading--xlarge {
  line-height: 1.25;
}

.preview__heading--small {
  font-size: 1.25rem;
}

.preview__heading--medium {
  font-size: 1.75rem;
}

.preview__heading--large {
  font-size: clamp(1.75rem, 6vw, 2.5rem);
}

.preview__heading--xlarge {
  font-size: clamp(2rem, 9vw, 3.5rem);
}

.preview__heading--left {
  text-align: left;
}

.preview__heading--center {
  text-align: center;
}

.preview__heading--right {
  text-align: right;
}

/* Mint a publikált oldal `.icon` szabálya: a kiemelőszínt veszi át. */
.preview__icon {
  margin-right: 0.4em;
  color: var(--accent);
  vertical-align: -0.15em;
}

/* Mint a publikált oldal kártyái: reszponzív rács media query nélkül. */
.preview__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.preview__card {
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
}

.preview__card-icon .icon {
  width: 1.75rem;
  height: 1.75rem;
  margin-bottom: 0.25rem;
  color: var(--accent);
}

.preview__card h3 {
  margin: 0.25rem 0 0.5rem;
  font-size: 1.1rem;
}

.preview__card p {
  margin: 0.5rem 0;
}

/* Mint a publikált oldal accordionja. */
.preview__accordion {
  margin: 1rem 0;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
}

.preview__accordion details + details {
  border-top: 1px solid var(--border);
}

.preview__accordion summary {
  padding: 0.75rem 1rem;
  font-weight: 600;
  cursor: pointer;
}

.preview__accordion details[open] summary {
  color: var(--accent);
}

.preview__accordion details p {
  margin: 0;
  padding: 0 1rem 1rem;
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
