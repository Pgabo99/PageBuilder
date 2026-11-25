<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from '@/components/AppIcon.vue'
import {
  buttonClasses,
  buttonWrapClasses,
  cardsClasses,
  dividerClasses,
  headingClasses,
  spacerHeight,
  MAX_ACCORDION_ITEMS,
  MAX_CARDS,
} from '@/utils/components'
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
        :class="[{ 'preview__item--active': component.id === activeId }, cardsClasses(component)]"
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
          <p v-if="card.label && card.url && SAFE_URL.test(card.url)" class="preview__card-action">
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
      <!-- A szaggatott keret csak szerkesztői jelölés (hogy a térköz ne tűnjön üres elemnek); a publikált oldalon nincs. -->
      <div
        v-else-if="component.type === 'spacer'"
        class="preview__item preview__spacer"
        :class="{ 'preview__item--active': component.id === activeId }"
        :style="{ height: `${spacerHeight(component.height)}rem` }"
        :data-component-id="component.id"
        @click="$emit('select', component.id)"
      ></div>
      <div
        v-else-if="component.type === 'divider'"
        class="preview__item preview__divider-wrap"
        :class="{ 'preview__item--active': component.id === activeId }"
        :data-component-id="component.id"
        @click="$emit('select', component.id)"
      >
        <hr class="preview__divider" :class="dividerClasses(component)" />
      </div>
      <p
        v-else-if="component.type === 'button' && SAFE_URL.test(component.url)"
        class="preview__item"
        :class="[
          { 'preview__item--active': component.id === activeId },
          buttonWrapClasses(component),
        ]"
        :data-component-id="component.id"
        @click="$emit('select', component.id)"
      >
        <span class="preview__button" :class="buttonClasses(component)">{{ component.label }}</span>
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
  --gap: 1rem;
  --pad: 1rem;
  --radius: 0.75rem;
  --border-width: 1px;
  --shadow: none;
  --icon-size: 1.75rem;

  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--gap);
  margin: 1rem 0;
}

.preview__card {
  padding: var(--pad);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.preview__card-icon .icon {
  width: var(--icon-size);
  height: var(--icon-size);
  margin-bottom: 0.25rem;
  color: var(--accent);
}

/* A kártyacsoport elrendezési módosítói: mint a publikált oldal `.cards--*` szabályai. */
.preview__cards--columns-1 {
  --cols: 1;
}

.preview__cards--columns-2 {
  --cols: 2;
}

.preview__cards--columns-3 {
  --cols: 3;
}

.preview__cards--columns-4 {
  --cols: 4;
}

.preview__cards--columns-1,
.preview__cards--columns-2,
.preview__cards--columns-3,
.preview__cards--columns-4 {
  grid-template-columns: repeat(
    auto-fit,
    minmax(max(14rem, calc((100% - (var(--cols) - 1) * var(--gap)) / var(--cols))), 1fr)
  );
}

.preview__cards--icon-position-top-center .preview__card-icon {
  text-align: center;
}

.preview__cards--icon-position-left .preview__card,
.preview__cards--icon-position-right .preview__card {
  display: grid;
  align-content: start;
  column-gap: 0.75rem;
}

.preview__cards--icon-position-left .preview__card {
  grid-template-columns: auto 1fr;
}

.preview__cards--icon-position-right .preview__card {
  grid-template-columns: 1fr auto;
}

.preview__cards--icon-position-left .preview__card > *,
.preview__cards--icon-position-right .preview__card > * {
  grid-column: 1;
}

.preview__cards--icon-position-left .preview__card > * {
  grid-column: 2;
}

.preview__cards--icon-position-left .preview__card > .preview__card-icon {
  grid-row: 1 / span 4;
  grid-column: 1;
}

.preview__cards--icon-position-right .preview__card > .preview__card-icon {
  grid-row: 1 / span 4;
  grid-column: 2;
}

.preview__cards--icon-size-small {
  --icon-size: 1.25rem;
}

.preview__cards--icon-size-medium {
  --icon-size: 1.75rem;
}

.preview__cards--icon-size-large {
  --icon-size: 2.5rem;
}

.preview__cards--text-align-left .preview__card {
  text-align: left;
}

.preview__cards--text-align-center .preview__card {
  text-align: center;
}

.preview__cards--text-align-right .preview__card {
  text-align: right;
}

.preview__cards--button-position-left .preview__card-action {
  text-align: left;
}

.preview__cards--button-position-center .preview__card-action {
  text-align: center;
}

.preview__cards--button-position-right .preview__card-action {
  text-align: right;
}

.preview__cards--border-none {
  --border-width: 0px;
}

.preview__cards--border-thin {
  --border-width: 1px;
}

.preview__cards--border-thick {
  --border-width: 3px;
}

.preview__cards--shadow-none {
  --shadow: none;
}

.preview__cards--shadow-small {
  --shadow: 0 1px 3px rgb(0 0 0 / 20%);
}

.preview__cards--shadow-medium {
  --shadow: 0 6px 16px rgb(0 0 0 / 25%);
}

.preview__cards--radius-none {
  --radius: 0;
}

.preview__cards--radius-small {
  --radius: 0.375rem;
}

.preview__cards--radius-medium {
  --radius: 0.75rem;
}

.preview__cards--radius-large {
  --radius: 1.25rem;
}

.preview__cards--gap-small {
  --gap: 0.5rem;
}

.preview__cards--gap-medium {
  --gap: 1rem;
}

.preview__cards--gap-large {
  --gap: 2rem;
}

.preview__cards--padding-small {
  --pad: 0.5rem;
}

.preview__cards--padding-medium {
  --pad: 1rem;
}

.preview__cards--padding-large {
  --pad: 2rem;
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

.preview__spacer {
  border: 1px dashed var(--border);
  border-radius: 0.25rem;
}

/* Mint a publikált oldal `.divider` szabályai; a körítés a kattintható felület. */
.preview__divider-wrap {
  padding: 0.25rem 0;
}

.preview__divider {
  margin: 1.5rem 0;
  border: 0;
  border-top: var(--divider-width, 1px) var(--divider-style, solid)
    var(--divider-color, var(--border));
}

.preview__divider--thickness-thin {
  --divider-width: 1px;
}

.preview__divider--thickness-medium {
  --divider-width: 2px;
}

.preview__divider--thickness-thick {
  --divider-width: 4px;
}

.preview__divider--style-solid {
  --divider-style: solid;
}

.preview__divider--style-dashed {
  --divider-style: dashed;
}

.preview__divider--style-dotted {
  --divider-style: dotted;
}

.preview__divider--color-border {
  --divider-color: var(--border);
}

.preview__divider--color-text {
  --divider-color: var(--text);
}

.preview__divider--color-accent {
  --divider-color: var(--accent);
}

.preview__empty {
  margin: 0;
  opacity: 0.7;
}

.preview__button {
  display: inline-block;
  box-sizing: border-box;
  max-width: 100%;
  padding: 0.5rem 1rem;
  font-weight: 600;
  color: var(--on-accent);
  background: var(--accent);
  border-radius: 0.5rem;
}

/* Mint a publikált oldal `.button--*` szabályai. */
.preview__button--outline {
  color: var(--accent);
  background: transparent;
  box-shadow: inset 0 0 0 2px var(--accent);
}

.preview__button--soft {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 15%, transparent);
}

.preview__button--link {
  padding-inline: 0;
  color: var(--accent);
  text-decoration: underline;
  background: transparent;
}

.preview__button--small {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.preview__button--medium {
  padding: 0.5rem 1rem;
}

.preview__button--large {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

.preview__button--r-none {
  border-radius: 0;
}

.preview__button--r-small {
  border-radius: 0.25rem;
}

.preview__button--r-medium {
  border-radius: 0.5rem;
}

.preview__button--r-full {
  border-radius: 999px;
}

.preview__button-wrap--left {
  text-align: left;
}

.preview__button-wrap--center {
  text-align: center;
}

.preview__button-wrap--right {
  text-align: right;
}
</style>
